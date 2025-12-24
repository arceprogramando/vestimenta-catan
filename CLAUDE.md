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
pnpm run test             # Run tests
pnpm run test:watch       # Tests in watch mode
pnpm run test:e2e         # End-to-end tests
pnpm run lint             # ESLint with autofix
```

### Frontend (`vestimenta-catan-frontend/`)

```bash
npm install               # Install dependencies
npm run dev               # Development server (Turbopack)
npm run build             # Production build
npm run lint              # ESLint
```

### Database (`docker-postgres/`)

```bash
docker-compose up -d      # Start PostgreSQL + pgAdmin
docker-compose down       # Stop services
```

- pgAdmin available at http://localhost:8080
- Database backup: `docker-postgres/backups/backup_completo.sql`

### Prisma (from backend directory)

```bash
npx prisma migrate dev --name <name>   # Create migration
npx prisma db push                     # Push schema changes
npx prisma generate                    # Generate client
```

## Architecture

### Backend Structure

NestJS modular architecture with feature-based modules:

- `auth/` - JWT authentication with access/refresh tokens, Google OAuth, guards (`JwtAuthGuard`, `RolesGuard`), decorators (`@CurrentUser`, `@Public`, `@Roles`)
- `usuarios/` - User management
- `productos/` - Product catalog
- `producto-variantes/` - Stock control (product + size + color combinations)
- `colores/`, `talles/` - Color and size lookups
- `reservas/` - Reservation system with state machine (pendiente → confirmado → completado/cancelado)
- `prisma/` - Database service wrapper

Pattern: Controllers → Services → Prisma ORM

### Frontend Structure

- `app/` - Next.js App Router pages
- `components/ui/` - Radix UI primitive wrappers
- `stores/` - Zustand stores with persistence (`auth-store.ts`, `reservas-store.ts`)
- `hooks/` - Custom hooks (`use-auth.ts`, `use-reservas.ts`)
- `lib/axios.ts` - Axios clients:
  - `publicApi` - For public endpoints (no auth required)
  - `api` - Authenticated client with JWT interceptors and automatic token refresh

### Database Schema

Key models: `usuarios`, `productos`, `producto_variantes`, `reservas`, `colores`, `talles`

All tables use soft deletes (`deleted_at`, `is_active`) and full audit trails (`created_by`, `updated_by`, `created_at`, `updated_at`).

Enums: `genero` (mujer/hombre/ninios), `rol_usuario` (user/admin), `estado_reserva` (pendiente/confirmado/cancelado/completado)

### Authentication Flow

1. Access tokens: 15min expiry, sent in Authorization header
2. Refresh tokens: 7d expiry, stored in httpOnly cookies
3. Frontend axios interceptor queues requests during token refresh
4. Rate limiting: 100 requests/min per IP

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
