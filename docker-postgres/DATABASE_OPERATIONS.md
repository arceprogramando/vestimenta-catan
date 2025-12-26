# Guía de Operaciones de Base de Datos

Este documento describe los procedimientos operativos para la gestión de bases de datos del proyecto Vestimenta Catán, siguiendo los lineamientos de ISO 9001 para control de calidad.

## Tabla de Contenidos

- [Arquitectura de Ambientes](#arquitectura-de-ambientes)
- [Inicio Rápido](#inicio-rápido)
- [Backups](#backups)
- [Restauración (Rollback)](#restauración-rollback)
- [Procedimientos de Emergencia](#procedimientos-de-emergencia)
- [Mantenimiento](#mantenimiento)

---

## Arquitectura de Ambientes

El proyecto utiliza 3 bases de datos PostgreSQL 17 aisladas:

| Ambiente | Container | Puerto | Base de Datos | Propósito |
|----------|-----------|--------|---------------|-----------|
| **Desarrollo** | `pg17` | 5433 | `comercio_electronico_db` | Desarrollo local |
| **Test E2E** | `pg17_test` | 5434 | `comercio_electronico_db_test` | Tests automatizados |
| **Staging** | `pg17_staging_homologacion` | 5435 | `comercio_electronico_db_staging_homologacion` | QA y demos |

### Diagrama de Flujo de Datos

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   DESARROLLO    │     │    TEST E2E     │     │    STAGING      │
│   Puerto 5433   │     │   Puerto 5434   │     │   Puerto 5435   │
│                 │     │                 │     │                 │
│  Datos de       │     │  Se limpia en   │     │  Copia de       │
│  prueba local   │     │  cada test run  │     │  producción     │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┴───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   BACKUP AUTOMÁTICO     │
                    │   (cada 24 horas)       │
                    │   Retención: 7 días     │
                    └─────────────────────────┘
```

---

## Inicio Rápido

### 1. Requisitos Previos

- Docker Desktop instalado y corriendo
- Git Bash o terminal compatible con bash (Windows)

### 2. Levantar las Bases de Datos

```bash
cd docker-postgres
docker-compose up -d
```

Esto levanta:
- 3 bases de datos PostgreSQL
- pgAdmin (interfaz web en http://localhost:8080)
- Servicio de backup automático

### 3. Verificar Estado

```bash
# Ver contenedores corriendo
docker ps

# Verificar salud de las bases de datos
docker-compose ps
```

Deberías ver:
```
NAME                        STATUS
pg17                        Up (healthy)
pg17_test                   Up (healthy)
pg17_staging_homologacion   Up (healthy)
pgadmin4                    Up
pg_backup                   Up
```

### 4. Acceder a pgAdmin

1. Abrir http://localhost:8080
2. Credenciales: `admin@vestimenta-catan.com` / (ver .env)
3. Las conexiones ya están configuradas

### 5. Detener Servicios

```bash
docker-compose down          # Detiene contenedores (datos persisten)
docker-compose down -v       # ⚠️ ELIMINA TODOS LOS DATOS
```

---

## Backups

### Backup Automático

El servicio `pg_backup` ejecuta backups automáticos cada 24 horas:

- **Bases respaldadas**: Desarrollo y Staging (no Test, ya que se limpia constantemente)
- **Ubicación**: `docker-postgres/backups/`
- **Nomenclatura**: `dev_YYYYMMDD_HHMMSS.sql`, `staging_YYYYMMDD_HHMMSS.sql`
- **Retención**: 7 días (backups más antiguos se eliminan automáticamente)

#### Ver logs del servicio de backup

```bash
docker logs pg_backup -f
```

### Backup Manual

Para crear un backup manual inmediato:

```bash
# Backup de todas las bases
./scripts/backup-manual.sh

# Backup solo de desarrollo
./scripts/backup-manual.sh dev

# Backup solo de staging
./scripts/backup-manual.sh staging
```

### Listar Backups Disponibles

```bash
ls -la backups/
```

---

## Restauración (Rollback)

### Procedimiento de Restauración

⚠️ **PRECAUCIÓN**: La restauración ELIMINA todos los datos actuales de la base de datos.

```bash
# Sintaxis
./scripts/restore.sh <archivo_backup.sql> <ambiente>

# Ejemplos
./scripts/restore.sh dev_20251226_120000.sql dev
./scripts/restore.sh staging_20251226_120000.sql staging
```

El script automáticamente:
1. Crea un backup de seguridad antes de restaurar
2. Termina conexiones activas
3. Elimina y recrea la base de datos
4. Restaura el backup seleccionado

### Rollback de Emergencia

Si algo sale mal durante una restauración:

```bash
# El script crea automáticamente un backup pre-restore
# Buscar el archivo más reciente:
ls -la backups/pre_restore_*.sql

# Restaurar desde ese backup
./scripts/restore.sh pre_restore_20251226_120000.sql dev
```

---

## Procedimientos de Emergencia

### Escenario 1: Base de datos corrupta

1. **Detener la aplicación** para evitar más daño
2. **Identificar el último backup válido**:
   ```bash
   ls -la backups/
   ```
3. **Restaurar**:
   ```bash
   ./scripts/restore.sh dev_YYYYMMDD_HHMMSS.sql dev
   ```
4. **Verificar integridad**:
   ```bash
   docker exec pg17 psql -U admin -d comercio_electronico_db -c "SELECT count(*) FROM usuarios;"
   ```
5. **Reiniciar la aplicación**

### Escenario 2: Contenedor no inicia

```bash
# Ver logs del contenedor
docker logs pg17

# Reiniciar el contenedor
docker-compose restart db

# Si persiste, recrear el contenedor (datos persisten en volumen)
docker-compose up -d --force-recreate db
```

### Escenario 3: Espacio en disco lleno

```bash
# Ver uso de espacio por Docker
docker system df

# Limpiar recursos no utilizados
docker system prune

# Eliminar backups antiguos manualmente
find backups/ -name "*.sql" -mtime +3 -delete
```

### Escenario 4: Sincronizar Staging con Desarrollo

Para copiar los datos de desarrollo a staging:

```bash
# 1. Hacer backup de desarrollo
./scripts/backup-manual.sh dev

# 2. Restaurar en staging
./scripts/restore.sh dev_YYYYMMDD_HHMMSS.sql staging
```

---

## Mantenimiento

### Verificación Diaria (Recomendada)

```bash
# Estado de contenedores
docker-compose ps

# Verificar que el backup está corriendo
docker logs pg_backup --tail 20

# Verificar espacio en disco
docker system df
```

### Verificación Semanal

1. Revisar que hay backups de los últimos 7 días
2. Probar restauración en ambiente de test
3. Verificar logs de errores

### Limpieza de Volúmenes (Cuando sea necesario)

⚠️ **SOLO SI ES NECESARIO** - Esto elimina TODOS los datos:

```bash
# Detener servicios
docker-compose down

# Eliminar volúmenes
docker volume rm docker-postgres_pg17_data
docker volume rm docker-postgres_pg17_test_data
docker volume rm docker-postgres_pg17_staging_homologacion_data

# Reiniciar (creará bases vacías)
docker-compose up -d
```

---

## Conexión desde Aplicación

### Desarrollo

```env
DATABASE_URL="postgresql://admin:password@localhost:5433/comercio_electronico_db"
```

### Test E2E

```env
DATABASE_URL="postgresql://admin:password@localhost:5434/comercio_electronico_db_test"
```

### Staging

```env
DATABASE_URL="postgresql://admin:password@localhost:5435/comercio_electronico_db_staging_homologacion"
```

---

## Registro de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-12-26 | 1.0 | Documento inicial con procedimientos ISO 9001 |

---

## Responsabilidades

| Rol | Responsabilidad |
|-----|-----------------|
| Desarrollador | Ejecutar backups manuales antes de cambios mayores |
| DevOps/Admin | Verificar backups automáticos, mantenimiento semanal |
| QA | Mantener staging sincronizado con datos de prueba válidos |

---

**Última actualización**: 2025-12-26
**Versión del documento**: 1.0
