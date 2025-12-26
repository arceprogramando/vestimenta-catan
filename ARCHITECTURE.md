# Arquitectura del Sistema

Documentación técnica de la arquitectura de Vestimenta Catán, siguiendo lineamientos ISO 9001 para trazabilidad y control de calidad.

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Diagrama de Arquitectura](#diagrama-de-arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura del Backend](#arquitectura-del-backend)
- [Arquitectura del Frontend](#arquitectura-del-frontend)
- [Modelo de Datos](#modelo-de-datos)
- [Flujo de Autenticación](#flujo-de-autenticación)
- [Flujo de Reservas](#flujo-de-reservas)
- [Infraestructura y Despliegue](#infraestructura-y-despliegue)
- [Decisiones de Arquitectura](#decisiones-de-arquitectura)

---

## Visión General

Vestimenta Catán es un sistema de gestión de inventario y reservas para ropa térmica. Utiliza una arquitectura **Cliente-Servidor** con separación clara entre frontend y backend, comunicándose a través de una API REST.

### Características Principales

- **Catálogo de productos** con variantes (talla, color, género)
- **Control de stock** en tiempo real
- **Sistema de reservas** con máquina de estados
- **Autenticación segura** con JWT y Google OAuth
- **Panel de administración** para gestión completa

---

## Diagrama de Arquitectura

### Arquitectura General

```mermaid
flowchart TB
    subgraph Cliente["🖥️ Cliente"]
        Browser[Navegador Web]
    end

    subgraph Frontend["📱 Frontend - Next.js 15"]
        AppRouter[App Router]
        Components[React Components]
        Stores[Zustand Stores]
        AxiosClient[Axios Client]
    end

    subgraph Backend["⚙️ Backend - NestJS 11"]
        Controllers[Controllers]
        Services[Services]
        Guards[Auth Guards]
        Prisma[Prisma ORM]
    end

    subgraph Database["🗄️ Base de Datos"]
        PostgreSQL[(PostgreSQL 17)]
    end

    subgraph External["🌐 Servicios Externos"]
        Google[Google OAuth]
    end

    Browser --> AppRouter
    AppRouter --> Components
    Components --> Stores
    Stores --> AxiosClient
    AxiosClient -->|REST API| Controllers
    Controllers --> Guards
    Guards --> Services
    Services --> Prisma
    Prisma --> PostgreSQL
    Controllers -.->|OAuth| Google
```

### Diagrama de Componentes

```mermaid
flowchart LR
    subgraph FE["Frontend (Next.js)"]
        direction TB
        Pages["📄 Pages<br/>(App Router)"]
        UI["🎨 UI Components<br/>(Radix UI)"]
        State["📦 State<br/>(Zustand)"]
        API["🔌 API Client<br/>(Axios)"]
    end

    subgraph BE["Backend (NestJS)"]
        direction TB
        Auth["🔐 Auth Module"]
        Users["👥 Usuarios Module"]
        Products["📦 Productos Module"]
        Variants["🏷️ Variantes Module"]
        Reservations["📋 Reservas Module"]
        Catalog["📚 Catálogo<br/>(Colores, Talles)"]
    end

    subgraph DB["Database"]
        PG[(PostgreSQL)]
    end

    FE -->|HTTP/REST| BE
    BE -->|Prisma| DB
```

---

## Stack Tecnológico

### Frontend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 15 | Framework React con App Router |
| React | 19 | Librería UI |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 4 | Estilos utility-first |
| Zustand | 5.x | Estado global |
| Radix UI | latest | Componentes accesibles |
| Axios | 1.x | Cliente HTTP |

### Backend

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| NestJS | 11 | Framework Node.js |
| TypeScript | 5.x | Tipado estático |
| Prisma | 6 | ORM |
| PostgreSQL | 17 | Base de datos |
| Passport.js | 0.7 | Autenticación |
| Swagger | 8.x | Documentación API |
| Winston | 3.x | Logging |

### Infraestructura

| Tecnología | Propósito |
|------------|-----------|
| Docker | Contenedores |
| Docker Compose | Orquestación local |
| Nginx | Reverse proxy (producción) |
| GitHub Actions | CI/CD |

---

## Arquitectura del Backend

### Estructura Modular

```mermaid
flowchart TB
    subgraph AppModule["App Module"]
        direction TB

        subgraph Core["Core"]
            Config[ConfigModule]
            Throttle[ThrottlerModule]
            Winston[WinstonModule]
            PrismaM[PrismaModule]
        end

        subgraph Features["Feature Modules"]
            AuthM[AuthModule]
            UsuariosM[UsuariosModule]
            ProductosM[ProductosModule]
            VariantesM[ProductoVariantesModule]
            ReservasM[ReservasModule]
            ColoresM[ColoresModule]
            TallesM[TallesModule]
        end

        subgraph Shared["Shared"]
            Guards[Guards]
            Decorators[Decorators]
            Pipes[Pipes]
        end
    end

    Config --> Features
    PrismaM --> Features
    Shared --> Features
```

### Patrón por Módulo

Cada módulo sigue la estructura:

```
src/
  modulo/
    dto/
      create-modulo.dto.ts
      update-modulo.dto.ts
    modulo.controller.ts    # Endpoints REST
    modulo.service.ts       # Lógica de negocio
    modulo.module.ts        # Configuración del módulo
```

### Flujo de Request

```mermaid
sequenceDiagram
    participant C as Cliente
    participant M as Middleware
    participant G as Guard
    participant CT as Controller
    participant S as Service
    participant P as Prisma
    participant DB as PostgreSQL

    C->>M: HTTP Request
    M->>M: Logger Middleware
    M->>G: JwtAuthGuard
    G->>G: Validar Token
    alt Token Válido
        G->>CT: Request + User
        CT->>CT: Validar DTO
        CT->>S: Llamar Service
        S->>P: Query
        P->>DB: SQL
        DB-->>P: Result
        P-->>S: Entity
        S-->>CT: Response DTO
        CT-->>C: HTTP 200
    else Token Inválido
        G-->>C: HTTP 401
    end
```

---

## Arquitectura del Frontend

### Estructura de Carpetas

```
src/
  app/                    # App Router (páginas)
    (auth)/              # Grupo de rutas auth
    (dashboard)/         # Grupo de rutas dashboard
    layout.tsx           # Layout principal
    page.tsx             # Home
  components/
    ui/                  # Componentes base (Radix)
    forms/               # Formularios
    layout/              # Header, Footer, etc.
  stores/
    auth-store.ts        # Estado de autenticación
    reservas-store.ts    # Estado de reservas
  hooks/
    use-auth.ts          # Hook de autenticación
    use-reservas.ts      # Hook de reservas
  lib/
    axios.ts             # Configuración de Axios
    utils.ts             # Utilidades
  types/
    index.ts             # Tipos TypeScript
```

### Gestión de Estado

```mermaid
flowchart LR
    subgraph Components["React Components"]
        C1[ProductList]
        C2[ReservaModal]
        C3[AuthForm]
    end

    subgraph Stores["Zustand Stores"]
        AuthStore["authStore<br/>- user<br/>- isAuthenticated<br/>- login()<br/>- logout()"]
        ReservasStore["reservasStore<br/>- reservas<br/>- isLoading<br/>- fetchReservas()<br/>- createReserva()"]
    end

    subgraph API["API Layer"]
        PublicAPI[publicApi]
        AuthAPI[api]
    end

    C1 --> ReservasStore
    C2 --> ReservasStore
    C3 --> AuthStore
    AuthStore --> AuthAPI
    ReservasStore --> AuthAPI
    AuthAPI -->|Con Token| Backend
    PublicAPI -->|Sin Token| Backend
```

---

## Modelo de Datos

### Diagrama Entidad-Relación

```mermaid
erDiagram
    usuarios ||--o{ refresh_tokens : "tiene"
    usuarios ||--o{ reservas : "realiza"
    usuarios }o--|| roles : "tiene"

    productos ||--o{ producto_variantes : "tiene"
    talles ||--o{ producto_variantes : "tiene"
    colores ||--o{ producto_variantes : "tiene"

    producto_variantes ||--o{ reservas : "tiene"

    usuarios {
        bigint id PK
        string email UK
        string password_hash
        string nombre
        string apellido
        enum rol
        int rol_id FK
        string google_id UK
        string provider
        boolean is_active
        timestamp created_at
    }

    roles {
        int id PK
        string codigo UK
        string nombre
        string descripcion
        int nivel
        boolean is_active
    }

    refresh_tokens {
        bigint id PK
        string token_hash
        bigint usuario_id FK
        timestamp expires_at
        boolean revoked
    }

    productos {
        int id PK
        string nombre
        string descripcion
        enum genero
        decimal precio
        string thumbnail
        boolean is_active
    }

    talles {
        bigint id PK
        string nombre UK
        int orden
        boolean is_active
    }

    colores {
        bigint id PK
        string nombre UK
        boolean is_active
    }

    producto_variantes {
        bigint id PK
        int producto_id FK
        bigint talle_id FK
        bigint color_id FK
        int cantidad
        boolean is_active
    }

    reservas {
        bigint id PK
        bigint variante_id FK
        bigint usuario_id FK
        int cantidad
        enum estado
        timestamp fecha_reserva
        decimal precio_unitario
        decimal precio_total
        boolean is_active
    }

    audit_log {
        bigint id PK
        string tabla
        string registro_id
        string accion
        json datos_antes
        json datos_despues
        timestamp created_at
    }
```

### Enums del Sistema

```mermaid
flowchart LR
    subgraph Enums
        genero["genero<br/>─────<br/>mujer<br/>hombre<br/>ninios"]
        rol["rol_usuario<br/>─────<br/>user<br/>empleado<br/>admin<br/>superadmin"]
        estado["estado_reserva<br/>─────<br/>pendiente<br/>confirmado<br/>cancelado<br/>completado"]
    end
```

---

## Flujo de Autenticación

### Registro y Login

```mermaid
sequenceDiagram
    participant U as Usuario
    participant FE as Frontend
    participant API as API
    participant DB as Database

    rect rgb(144, 238, 144)
        Note over U,DB: Registro
        U->>FE: Completar formulario
        FE->>API: POST /api/auth/register
        API->>API: Validar datos
        API->>API: Hash password (bcrypt)
        API->>DB: Crear usuario
        API->>API: Generar tokens JWT
        API-->>FE: Set-Cookie (httpOnly)
        FE-->>U: Redirect a dashboard
    end

    rect rgb(135, 206, 250)
        Note over U,DB: Login
        U->>FE: Email + Password
        FE->>API: POST /api/auth/login
        API->>DB: Buscar usuario
        API->>API: Verificar password
        API->>API: Generar tokens JWT
        API->>DB: Guardar refresh token
        API-->>FE: Set-Cookie (httpOnly)
        FE-->>U: Redirect a dashboard
    end
```

### Refresh Token Flow

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as API
    participant DB as Database

    FE->>API: Request con accessToken expirado
    API-->>FE: 401 Unauthorized

    FE->>API: POST /api/auth/refresh
    Note right of FE: Cookie: refreshToken

    API->>DB: Buscar refreshToken
    alt Token válido y no revocado
        API->>API: Generar nuevo accessToken
        API->>API: Generar nuevo refreshToken
        API->>DB: Revocar token anterior
        API->>DB: Guardar nuevo token
        API-->>FE: Set-Cookie (nuevos tokens)
        FE->>API: Reintentar request original
        API-->>FE: 200 OK
    else Token inválido o revocado
        API-->>FE: 401 - Sesión expirada
        FE->>FE: Redirect a login
    end
```

### Tokens y Cookies

```mermaid
flowchart LR
    subgraph Tokens
        AT["Access Token<br/>─────<br/>Expira: 15 min<br/>Cookie: accessToken<br/>Path: /"]
        RT["Refresh Token<br/>─────<br/>Expira: 7 días<br/>Cookie: refreshToken<br/>Path: /api/auth"]
    end

    subgraph Security["Seguridad"]
        S1[httpOnly ✓]
        S2[Secure ✓ prod]
        S3[SameSite: Strict]
        S4[Rotación en uso]
    end

    AT --> S1
    AT --> S2
    RT --> S1
    RT --> S2
    RT --> S3
    RT --> S4
```

---

## Flujo de Reservas

### Máquina de Estados

```mermaid
stateDiagram-v2
    [*] --> pendiente: Crear reserva

    pendiente --> confirmado: Confirmar
    pendiente --> cancelado: Cancelar

    confirmado --> completado: Completar
    confirmado --> cancelado: Cancelar

    cancelado --> [*]
    completado --> [*]

    note right of pendiente
        Stock reservado
        temporalmente
    end note

    note right of confirmado
        Stock asegurado
        para el cliente
    end note

    note right of completado
        Entrega realizada
        Stock descontado
    end note

    note right of cancelado
        Stock liberado
        y devuelto
    end note
```

### Proceso de Reserva

```mermaid
sequenceDiagram
    participant U as Usuario
    participant FE as Frontend
    participant API as API
    participant DB as Database

    U->>FE: Seleccionar producto
    FE->>API: GET /api/productos/:id
    API->>DB: Query producto + variantes
    DB-->>API: Producto con stock
    API-->>FE: Producto disponible

    U->>FE: Seleccionar variante y cantidad
    FE->>API: POST /api/reservas

    API->>DB: Verificar stock disponible
    alt Stock suficiente
        API->>DB: Crear reserva (pendiente)
        API->>DB: Actualizar stock temporal
        DB-->>API: Reserva creada
        API-->>FE: 201 Created
        FE-->>U: Mostrar confirmación
    else Stock insuficiente
        API-->>FE: 400 - Sin stock
        FE-->>U: Mostrar error
    end
```

---

## Infraestructura y Despliegue

### Ambientes de Base de Datos

```mermaid
flowchart TB
    subgraph Docker["Docker Compose"]
        subgraph DEV["Desarrollo :5433"]
            DB1[(pg17<br/>comercio_electronico_db)]
        end

        subgraph TEST["Test E2E :5434"]
            DB2[(pg17_test<br/>comercio_electronico_db_test)]
        end

        subgraph STAGING["Staging :5435"]
            DB3[(pg17_staging_homologacion<br/>comercio_electronico_db_staging_homologacion)]
        end

        subgraph Tools["Herramientas"]
            PGA[pgAdmin :8080]
            BK[Backup Service]
        end
    end

    BK -->|Diario| DB1
    BK -->|Diario| DB3
    PGA --> DB1
    PGA --> DB2
    PGA --> DB3
```

### Arquitectura de Producción

```mermaid
flowchart TB
    subgraph Internet
        Users[👥 Usuarios]
    end

    subgraph Infra["Infraestructura"]
        subgraph Edge
            Nginx[Nginx<br/>Reverse Proxy]
        end

        subgraph Apps["Aplicaciones"]
            FE[Next.js<br/>Frontend]
            BE[NestJS<br/>Backend]
        end

        subgraph Data
            PG[(PostgreSQL)]
        end
    end

    Users -->|HTTPS| Nginx
    Nginx -->|:3001| FE
    Nginx -->|:3000/api| BE
    BE --> PG
```

---

## Decisiones de Arquitectura

### ADR-001: Monorepo vs Multirepo

**Decisión**: Monorepo con carpetas separadas para frontend y backend.

**Contexto**: Necesitamos desarrollar frontend y backend de forma coordinada.

**Consecuencias**:
- ✅ Cambios coordinados en una sola PR
- ✅ Compartir tipos TypeScript fácilmente
- ✅ CI/CD unificado
- ⚠️ Repositorio más grande

### ADR-002: JWT en Cookies vs LocalStorage

**Decisión**: Tokens JWT almacenados en cookies httpOnly.

**Contexto**: Protección contra ataques XSS.

**Consecuencias**:
- ✅ Tokens no accesibles por JavaScript
- ✅ Protección contra XSS
- ✅ Envío automático en cada request
- ⚠️ Requiere configuración CORS correcta

### ADR-003: Prisma vs TypeORM

**Decisión**: Prisma ORM.

**Contexto**: Necesitamos un ORM moderno con buen soporte TypeScript.

**Consecuencias**:
- ✅ Type-safety excelente
- ✅ Migraciones declarativas
- ✅ Prisma Studio para debugging
- ⚠️ Menos flexible que SQL raw

### ADR-004: Soft Delete vs Hard Delete

**Decisión**: Soft delete en todas las tablas (`deleted_at`, `is_active`).

**Contexto**: Requisito de auditoría y posibilidad de recuperar datos.

**Consecuencias**:
- ✅ Trazabilidad completa
- ✅ Posibilidad de restaurar
- ✅ Historial de cambios
- ⚠️ Queries más complejas (filtrar por is_active)

### ADR-005: Zustand vs Redux

**Decisión**: Zustand para estado global.

**Contexto**: Necesitamos estado global simple para auth y reservas.

**Consecuencias**:
- ✅ API simple y concisa
- ✅ Menos boilerplate que Redux
- ✅ Persistencia fácil
- ⚠️ Menos herramientas de debugging

---

## Registro de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-12-26 | 1.0 | Documento inicial |

---

**Última actualización**: 2025-12-26
**Versión del documento**: 1.0
