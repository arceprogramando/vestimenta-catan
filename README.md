# Vestimenta Catán

Sistema de gestión de inventario y reservas para vestimenta térmica. Aplicación full-stack con API REST y frontend moderno.

## Tabla de Contenidos

- [Descripción](#descripción)
- [Tecnologías](#tecnologías)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Despliegue](#despliegue)
- [Contribución](#contribución)
- [Licencia](#licencia)

## Descripción

Vestimenta Catán es un sistema integral para la gestión de inventario de ropa térmica que incluye:

- **Catálogo de productos** con variantes (talla, color)
- **Control de stock** en tiempo real
- **Sistema de reservas** con flujo de estados (pendiente → confirmado → completado/cancelado)
- **Autenticación segura** con JWT y Google OAuth
- **Panel de administración** para gestión completa

## Tecnologías

### Backend (API)
- **NestJS 11** - Framework Node.js
- **Prisma 6** - ORM para PostgreSQL
- **PostgreSQL 17** - Base de datos
- **Passport.js** - Autenticación JWT + Google OAuth
- **Swagger** - Documentación de API

### Frontend
- **Next.js 15** - Framework React con App Router
- **React 19** - Librería UI
- **TypeScript** - Tipado estático
- **Tailwind CSS 4** - Estilos
- **Zustand** - Estado global
- **Radix UI** - Componentes accesibles

### Infraestructura
- **Docker** - Contenedores para PostgreSQL y pgAdmin
- **Nginx** - Reverse proxy (producción)
- **GitHub Actions** - CI/CD

## Requisitos

- Node.js >= 20.x
- pnpm >= 9.x (backend)
- npm >= 10.x (frontend)
- Docker y Docker Compose
- PostgreSQL 17 (o usar Docker)

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/vestimenta-catan.git
cd vestimenta-catan
```

### 2. Instalar dependencias del monorepo

```bash
npm install
```

### 3. Iniciar bases de datos

```bash
cd docker-postgres
docker-compose up -d
```

Esto levanta 3 bases de datos PostgreSQL:

| Ambiente | Puerto | Base de Datos | Uso |
|----------|--------|---------------|-----|
| Desarrollo | 5433 | `comercio_electronico_db` | Desarrollo local |
| Test | 5434 | `comercio_electronico_db_test` | Tests E2E automatizados |
| Staging | 5435 | `comercio_electronico_db_staging_homologacion` | QA y demos |

### 4. Configurar Backend

```bash
cd vestimenta-catan-api
pnpm install
cp .env.example .env
# Editar .env con tus valores
npx prisma migrate dev
npx prisma generate
```

### 5. Configurar Frontend

```bash
cd vestimenta-catan-frontend
npm install
cp .env.example .env.local
# Editar .env.local con tus valores
```

## Configuración

### Variables de Entorno - Backend

```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/vestimenta_catan"

# JWT
JWT_ACCESS_SECRET="tu-secret-access-token"
JWT_REFRESH_SECRET="tu-secret-refresh-token"

# Google OAuth
GOOGLE_CLIENT_ID="tu-google-client-id"

# CORS
CORS_ORIGIN="http://localhost:3001"

# Entorno
NODE_ENV="development"
PORT=3000
```

### Variables de Entorno - Frontend

```env
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="tu-google-client-id"
```

## Uso

### Desarrollo

**Terminal 1 - Base de datos:**
```bash
cd docker-postgres
docker-compose up -d
```

**Terminal 2 - Backend:**
```bash
cd vestimenta-catan-api
pnpm run start:dev
```

**Terminal 3 - Frontend:**
```bash
cd vestimenta-catan-frontend
npm run dev
```

### URLs de desarrollo

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:3001 |
| API | http://localhost:3000/api |
| Swagger | http://localhost:3000/api/docs |
| pgAdmin | http://localhost:8080 |

## Estructura del Proyecto

```
vestimenta-catan/
├── vestimenta-catan-api/     # Backend NestJS
│   ├── src/
│   │   ├── auth/             # Autenticación JWT + Google
│   │   ├── usuarios/         # Gestión de usuarios
│   │   ├── productos/        # Catálogo de productos
│   │   ├── producto-variantes/ # Control de stock
│   │   ├── reservas/         # Sistema de reservas
│   │   ├── colores/          # Catálogo de colores
│   │   ├── talles/           # Catálogo de tallas
│   │   └── prisma/           # Servicio de base de datos
│   ├── prisma/
│   │   └── schema.prisma     # Esquema de BD
│   └── test/                 # Tests E2E
├── vestimenta-catan-frontend/ # Frontend Next.js
│   ├── src/
│   │   ├── app/              # App Router pages
│   │   ├── components/       # Componentes React
│   │   ├── stores/           # Estado Zustand
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilidades
│   │   └── types/            # Tipos TypeScript
│   └── public/               # Assets estáticos
├── docker-postgres/          # Docker para BD
│   ├── docker-compose.yml
│   └── backups/              # Backups de BD
├── .github/
│   └── workflows/            # GitHub Actions CI/CD
└── nginx/                    # Config Nginx (prod)
```

## API Documentation

La documentación completa de la API está disponible en Swagger:

```
http://localhost:3000/api/docs
```

### Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | /api/auth/register | Registrar usuario |
| POST | /api/auth/login | Iniciar sesión |
| POST | /api/auth/google | Login con Google |
| POST | /api/auth/refresh | Refrescar tokens |
| GET | /api/auth/me | Usuario actual |
| GET | /api/productos | Listar productos |
| GET | /api/reservas | Listar reservas |

## Testing

### Tests Unitarios

```bash
cd vestimenta-catan-api

pnpm run test          # Ejecutar tests
pnpm run test:watch    # Tests en modo watch
pnpm run test:cov      # Tests con reporte de cobertura
```

### Tests E2E (End-to-End)

Los tests E2E corren contra la base de datos de test (`pg17_test` en puerto 5434).

```bash
# Asegurarse que la BD de test esté corriendo
docker-compose up -d db_test

# Ejecutar tests E2E
cd vestimenta-catan-api
pnpm run test:e2e
```

La base de datos de test se limpia automáticamente entre corridas de tests.

### Validación Completa (CI)

```bash
# Desde la raíz del monorepo - ejecuta lint + tests
npm run validate
```

## Despliegue

### Producción con Docker

```bash
# Desde la raíz del proyecto
docker-compose -f docker-compose.prod.yml up -d
```

### Variables de producción

Ver `.env.production.example` para la configuración requerida.

## Contribución

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para guías de contribución.

### Commits

Este proyecto usa [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: nueva funcionalidad
fix: corrección de bug
docs: cambios en documentación
style: cambios de formato
refactor: refactorización de código
test: agregar o modificar tests
chore: tareas de mantenimiento
```

## Seguridad

Ver [SECURITY.md](SECURITY.md) para políticas de seguridad y reporte de vulnerabilidades.

## Licencia

Este proyecto es privado y propietario. Todos los derechos reservados.

---

Desarrollado por Felipe Arce <arceprogramando@gmail.com>
