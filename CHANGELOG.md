# Changelog

Todos los cambios notables de este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

## [Unreleased]

### Added
- Sistema de autenticación con JWT (access + refresh tokens)
- Autenticación con Google OAuth
- Panel de administración para reservas
- Página de "Mis Reservas" para usuarios
- Modal de reserva en detalle de producto
- Componentes UI con Radix UI y shadcn/ui
- Estado global con Zustand para autenticación y reservas
- Tests unitarios completos para todos los servicios de la API
- CI/CD con GitHub Actions
- Conventional commits enforcement con Husky y commitlint
- Infraestructura de producción con Docker y Nginx

### Changed
- Migración de access token desde localStorage a cookies httpOnly (mejora de seguridad)
- Refactorización de decoradores y guards de autenticación para mejorar type safety
- Actualización de dependencias del frontend

### Fixed
- Corrección de Suspense boundary para useSearchParams en Next.js 15
- Corrección de navegación en pre-commit hook
- Corrección de enlace de categoría niños y formato de visualización
- Eliminación de link duplicado en header

### Security
- Access token almacenado en cookies httpOnly (protección contra XSS)
- Refresh token con path restringido a /api/auth
- Rate limiting en endpoints de autenticación
- Headers de seguridad con Helmet
- CORS configurado correctamente

## [0.1.0] - 2024-12-25

### Added
- Estructura inicial del monorepo
- API REST con NestJS 11
- Frontend con Next.js 15 y React 19
- Base de datos PostgreSQL con Prisma ORM
- Módulos de la API:
  - Autenticación (auth)
  - Usuarios (usuarios)
  - Productos (productos)
  - Variantes de producto (producto-variantes)
  - Colores (colores)
  - Tallas (talles)
  - Reservas (reservas)
- Docker Compose para desarrollo local
- Documentación de API con Swagger

---

## Tipos de cambios

- **Added** para nuevas funcionalidades.
- **Changed** para cambios en funcionalidades existentes.
- **Deprecated** para funcionalidades que serán eliminadas próximamente.
- **Removed** para funcionalidades eliminadas.
- **Fixed** para corrección de bugs.
- **Security** para vulnerabilidades corregidas.
