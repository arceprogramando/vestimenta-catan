#!/bin/bash
# =============================================================================
# Script de Backup Manual
# =============================================================================
# Uso: ./backup-manual.sh [ambiente]
# Si no se especifica ambiente, hace backup de todos
# Ambientes: dev, staging, all (default)
# =============================================================================

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

AMBIENTE=${1:-all}
BACKUPS_DIR="$(dirname "$0")/../backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Cargar variables de entorno
source "$(dirname "$0")/../.env"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}  BACKUP MANUAL${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""

backup_database() {
    local container=$1
    local db_name=$2
    local prefix=$3

    echo "Haciendo backup de $db_name..."

    if ! docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        echo "  ⚠ Container $container no está corriendo, saltando..."
        return
    fi

    docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" "$container" \
        pg_dump -U "$POSTGRES_USER" -d "$db_name" > "$BACKUPS_DIR/${prefix}_${DATE}.sql"

    echo -e "  ${GREEN}✓ Guardado: ${prefix}_${DATE}.sql${NC}"
}

case $AMBIENTE in
    dev)
        backup_database "pg17" "$POSTGRES_DB" "dev"
        ;;
    staging)
        backup_database "pg17_staging_homologacion" "${POSTGRES_DB}_staging_homologacion" "staging"
        ;;
    all)
        backup_database "pg17" "$POSTGRES_DB" "dev"
        backup_database "pg17_staging_homologacion" "${POSTGRES_DB}_staging_homologacion" "staging"
        ;;
    *)
        echo "Ambiente no válido: $AMBIENTE"
        echo "Opciones: dev, staging, all"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Backup completado${NC}"
echo "Archivos guardados en: $BACKUPS_DIR"
