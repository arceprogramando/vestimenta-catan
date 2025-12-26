#!/bin/bash
# =============================================================================
# Script de Restauración de Backups
# =============================================================================
# Uso: ./restore.sh <archivo_backup.sql> <ambiente>
# Ejemplo: ./restore.sh dev_20251226_120000.sql dev
# Ambientes: dev, staging, test
# =============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Validar argumentos
if [ $# -lt 2 ]; then
    echo -e "${RED}Error: Faltan argumentos${NC}"
    echo ""
    echo "Uso: ./restore.sh <archivo_backup.sql> <ambiente>"
    echo ""
    echo "Ambientes disponibles:"
    echo "  dev     - Base de datos de desarrollo (pg17, puerto 5433)"
    echo "  staging - Base de datos de staging/homologación (pg17_staging_homologacion, puerto 5435)"
    echo "  test    - Base de datos de test E2E (pg17_test, puerto 5434)"
    echo ""
    echo "Ejemplo:"
    echo "  ./restore.sh dev_20251226_120000.sql dev"
    echo "  ./restore.sh staging_20251226_120000.sql staging"
    exit 1
fi

BACKUP_FILE=$1
AMBIENTE=$2
BACKUPS_DIR="$(dirname "$0")/../backups"

# Verificar que el archivo existe
if [ ! -f "$BACKUPS_DIR/$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Archivo de backup no encontrado: $BACKUPS_DIR/$BACKUP_FILE${NC}"
    echo ""
    echo "Backups disponibles:"
    ls -la "$BACKUPS_DIR"/*.sql 2>/dev/null || echo "  (ninguno)"
    exit 1
fi

# Cargar variables de entorno
source "$(dirname "$0")/../.env"

# Configurar según ambiente
case $AMBIENTE in
    dev)
        CONTAINER="pg17"
        DB_NAME="$POSTGRES_DB"
        ;;
    staging)
        CONTAINER="pg17_staging_homologacion"
        DB_NAME="${POSTGRES_DB}_staging_homologacion"
        ;;
    test)
        CONTAINER="pg17_test"
        DB_NAME="${POSTGRES_DB}_test"
        ;;
    *)
        echo -e "${RED}Error: Ambiente no válido: $AMBIENTE${NC}"
        echo "Ambientes válidos: dev, staging, test"
        exit 1
        ;;
esac

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  RESTAURACIÓN DE BACKUP${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Archivo:   $BACKUP_FILE"
echo "Ambiente:  $AMBIENTE"
echo "Container: $CONTAINER"
echo "Database:  $DB_NAME"
echo ""

# Confirmar
read -p "¿Está seguro que desea restaurar? Esto ELIMINARÁ todos los datos actuales. (s/N): " confirm
if [ "$confirm" != "s" ] && [ "$confirm" != "S" ]; then
    echo -e "${YELLOW}Operación cancelada${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Iniciando restauración...${NC}"

# Verificar que el contenedor está corriendo
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER}$"; then
    echo -e "${RED}Error: El contenedor $CONTAINER no está corriendo${NC}"
    echo "Ejecute: docker-compose up -d"
    exit 1
fi

# Crear backup de seguridad antes de restaurar
SAFETY_BACKUP="pre_restore_$(date +%Y%m%d_%H%M%S).sql"
echo "Creando backup de seguridad: $SAFETY_BACKUP"
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER" \
    pg_dump -U "$POSTGRES_USER" -d "$DB_NAME" > "$BACKUPS_DIR/$SAFETY_BACKUP" 2>/dev/null || true

# Terminar conexiones activas
echo "Terminando conexiones activas..."
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER" \
    psql -U "$POSTGRES_USER" -d postgres -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
    > /dev/null 2>&1 || true

# Eliminar y recrear la base de datos
echo "Recreando base de datos..."
docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER" \
    psql -U "$POSTGRES_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";" > /dev/null

docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER" \
    psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";" > /dev/null

# Restaurar backup
echo "Restaurando backup..."
docker exec -i -e PGPASSWORD="$POSTGRES_PASSWORD" "$CONTAINER" \
    psql -U "$POSTGRES_USER" -d "$DB_NAME" < "$BACKUPS_DIR/$BACKUP_FILE" > /dev/null 2>&1

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  RESTAURACIÓN COMPLETADA${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Backup de seguridad guardado en: $SAFETY_BACKUP"
echo "Base de datos restaurada: $DB_NAME"
