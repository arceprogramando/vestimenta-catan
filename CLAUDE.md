# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Vestimenta Catán is a full-stack inventory and reservation management system for thermal clothing. The project uses a monorepo structure with separate frontend and backend applications.

## Tech Stack

- **Frontend**: Next.js 15 (App Router, Turbopack), React 19, TypeScript, Tailwind CSS 4, Zustand, Radix UI
- **Backend**: NestJS 11, TypeScript, Prisma 6, PostgreSQL 17
- **Auth**: JWT (access + refresh tokens), Google OAuth, Passport.js
- **Infrastructure**: Docker (PostgreSQL + pgAdmin)

## Development Commands

### Backend (`vestimenta-catan-api/`)

```bash
pnpm install              # Install dependencies
pnpm run start:dev        # Development server with watch
pnpm run build            # Production build
pnpm run start:prod       # Run production build
pnpm run test             # Run unit tests
pnpm run test:watch       # Unit tests in watch mode
pnpm run test:e2e         # E2E tests (requires pg17_test running)
pnpm run lint             # ESLint with autofix
```

**E2E Testing:** Tests run against `pg17_test` database (port 5434). The test database is cleaned between test runs. Configuration in `.env.test`.

### Frontend (`vestimenta-catan-frontend/`)

```bash
npm install               # Install dependencies
npm run dev               # Development server (Turbopack)
npm run build             # Production build
npm run lint              # ESLint
```

### Database (`docker-postgres/`)

```bash
docker-compose up -d      # Start all databases + pgAdmin
docker-compose down       # Stop services
```

**Database Environments:**

| Environment | Container | Port | Database | Purpose |
|-------------|-----------|------|----------|---------|
| Development | `pg17` | 5433 | `comercio_electronico_db` | Local development |
| Test (E2E) | `pg17_test` | 5434 | `comercio_electronico_db_test` | Automated E2E tests |
| Staging | `pg17_staging_homologacion` | 5435 | `comercio_electronico_db_staging_homologacion` | QA and demos |

- pgAdmin available at http://localhost:8080
- All databases start automatically with `docker-compose up -d`

### Prisma (from backend directory)

```bash
npx prisma migrate dev --name <name>   # Create migration
npx prisma db push                     # Push schema changes
npx prisma generate                    # Generate client
```

## Architecture

### Architectural Style

**Monorepo with Client-Server separation** combining multiple patterns:

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (Next.js)                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │  Pages  │→ │Components│→ │ Stores  │→ │  Axios Client   │ │
│  └─────────┘  └─────────┘  └─────────┘  └────────┬────────┘ │
└──────────────────────────────────────────────────┼──────────┘
                                                   │ REST API
┌──────────────────────────────────────────────────┼──────────┐
│                      BACKEND (NestJS)            │          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────▼───────┐  │
│  │ Controllers │→ │  Services   │→ │     Prisma ORM      │  │
│  └─────────────┘  └─────────────┘  └──────────┬──────────┘  │
└───────────────────────────────────────────────┼─────────────┘
                                                │
┌───────────────────────────────────────────────┼─────────────┐
│                    PostgreSQL                  │             │
└────────────────────────────────────────────────┴─────────────┘
```

### Design Patterns

| Layer | Pattern | Implementation |
|-------|---------|----------------|
| Backend | Modular Architecture | Feature-based NestJS modules |
| Backend | Dependency Injection | NestJS DI container |
| Backend | DTO Pattern | class-validator for input validation |
| Backend | Repository (implicit) | Prisma ORM abstracts data access |
| Frontend | Component-Based | React functional components |
| Frontend | Flux/Store | Zustand for state management |
| Frontend | Custom Hooks | Reusable logic (`use-auth`, `use-reservas`) |
| Database | Soft Delete | `deleted_at`, `is_active` fields |
| Database | Audit Trail | `created_at`, `updated_at`, `created_by`, `updated_by` |
| Database | State Machine | `estado_reserva` enum with transitions |
| Database | Lookup Tables | Separate tables for `colores`, `talles` |
| Auth | Stateless JWT | Access + Refresh tokens in httpOnly cookies |

### Backend Structure

NestJS modular architecture with feature-based modules:

- `auth/` - JWT authentication with access/refresh tokens, Google OAuth, guards (`JwtAuthGuard`, `RolesGuard`), decorators (`@CurrentUser`, `@Public`, `@Roles`)
- `usuarios/` - User management
- `productos/` - Product catalog
- `producto-variantes/` - Stock control (product + size + color combinations)
- `colores/`, `talles/` - Color and size lookups
- `reservas/` - Reservation system with state machine (pendiente → confirmado → completado/cancelado)
- `prisma/` - Database service wrapper

Layer flow: Controllers → Services → Prisma ORM → PostgreSQL

### Frontend Structure

- `app/` - Next.js App Router pages (SSR/SSG)
- `components/ui/` - Radix UI primitive wrappers
- `stores/` - Zustand stores with persistence (`auth-store.ts`, `reservas-store.ts`)
- `hooks/` - Custom hooks (`use-auth.ts`, `use-reservas.ts`)
- `lib/axios.ts` - Axios clients:
  - `publicApi` - For public endpoints (no auth required)
  - `api` - Authenticated client with automatic token refresh via interceptors

### Database Schema

**Normalization**: 3rd Normal Form (3NF) - no data redundancy, lookup tables for colors/sizes.

Key models: `usuarios`, `productos`, `producto_variantes`, `reservas`, `colores`, `talles`

All tables use soft deletes (`deleted_at`, `is_active`) and full audit trails (`created_by`, `updated_by`, `created_at`, `updated_at`).

Enums: `genero` (mujer/hombre/ninios), `rol_usuario` (user/admin), `estado_reserva` (pendiente/confirmado/cancelado/completado)

### Authentication Flow

1. Access tokens: 15min expiry, stored in httpOnly cookies
2. Refresh tokens: 7d expiry, stored in httpOnly cookies (path: /api/auth)
3. JWT extracted from cookies (priority) or Authorization header (fallback)
4. Frontend axios interceptor queues requests during token refresh
5. Rate limiting: 100 requests/min per IP, 5/min login, 3/min register

## Code Standards

- **Type Safety**: Never use `any` type - always find correct TypeScript types
- **No hardcoded credentials**: Use environment variables
- **Conventional Commits**: `feat:`, `fix:`, `chore:`, etc. English only, no parentheses
- **One source of truth**: Never create `_new`, `_temp`, `_backup` file variants
- **Configuration changes**: Ask before modifying working ports/configs
- **Git operations**: Never auto-commit or push without explicit user request

## Environment Variables

Backend requires (see `.env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` - Token signing keys
- `CORS_ORIGIN` - Allowed origins
- `GOOGLE_CLIENT_ID` - Google OAuth client ID

Frontend requires:
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:3000/api)
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - Google OAuth client ID
