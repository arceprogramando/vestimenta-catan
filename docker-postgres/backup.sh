#!/bin/bash

# Script de backup automático para PostgreSQL
# Configuración
CONTAINER_NAME="pg17"
DB_USER="postgres"
DB_NAME="vestimenta_catan_db"
BACKUP_DIR="./backups"
RETENTION_DAYS=7

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

# Generar nombre del archivo con timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Crear backup
echo "Iniciando backup de $DB_NAME..."
docker exec $CONTAINER_NAME pg_dump -U $DB_USER -d $DB_NAME > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup creado exitosamente: $BACKUP_FILE"
    
    # Opcional: Comprimir el backup (comenta estas líneas si no quieres compresión)
    # gzip "$BACKUP_FILE"
    # echo "✅ Backup comprimido: $BACKUP_FILE.gz"
    
    # Limpiar backups antiguos (más de $RETENTION_DAYS días)
    find "$BACKUP_DIR" -name "backup_*.sql" -mtime +$RETENTION_DAYS -delete
    echo "🧹 Backups antiguos eliminados (>$RETENTION_DAYS días)"
    
    # Mostrar espacio usado por backups
    echo "📊 Espacio usado por backups:"
    du -sh "$BACKUP_DIR"
else
    echo "❌ Error al crear el backup"
    exit 1
fi
