# Estrategia de Testing

Documentación de la estrategia de testing del proyecto Vestimenta Catán, siguiendo lineamientos ISO 9001 para aseguramiento de calidad.

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Pirámide de Testing](#pirámide-de-testing)
- [Tests Unitarios](#tests-unitarios)
- [Tests E2E](#tests-e2e)
- [Cobertura de Código](#cobertura-de-código)
- [Ambientes de Testing](#ambientes-de-testing)
- [Ejecución de Tests](#ejecución-de-tests)
- [Criterios de Aceptación](#criterios-de-aceptación)

---

## Visión General

El proyecto utiliza una estrategia de testing multinivel para garantizar la calidad del código:

```mermaid
flowchart TB
    subgraph Testing["Estrategia de Testing"]
        Unit["🧪 Tests Unitarios<br/>Jest + Mocks"]
        E2E["🔄 Tests E2E<br/>Supertest + DB Real"]
        Manual["👁️ Testing Manual<br/>Staging Environment"]
    end

    Unit --> E2E --> Manual
```

---

## Pirámide de Testing

```mermaid
flowchart TB
    subgraph Pyramid["Pirámide de Tests"]
        direction TB
        E2E["🔝 E2E Tests<br/>Pocos, lentos, alto valor"]
        Integration["🔶 Integration Tests<br/>API + Database"]
        Unit["🟢 Unit Tests<br/>Muchos, rápidos, aislados"]
    end

    style E2E fill:#ff6b6b
    style Integration fill:#ffd93d
    style Unit fill:#6bcb77
```

| Nivel | Cantidad | Velocidad | Aislamiento | Cobertura Objetivo |
|-------|----------|-----------|-------------|-------------------|
| Unit | Muchos | Rápido | Total (mocks) | > 80% |
| E2E | Pocos | Lento | Ninguno (DB real) | Flujos críticos |

---

## Tests Unitarios

### Configuración

Los tests unitarios usan **Jest** con mocks para aislar las dependencias.

```typescript
// Ejemplo: auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            usuarios: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    prismaService = module.get(PrismaService);
  });

  it('should register a new user', async () => {
    // Arrange
    prismaService.usuarios.create.mockResolvedValue(mockUser);

    // Act
    const result = await service.register(registerDto);

    // Assert
    expect(result.user.email).toBe(registerDto.email);
  });
});
```

### Servicios con Tests Unitarios

| Servicio | Archivo de Test | Estado |
|----------|-----------------|--------|
| AuthService | `auth.service.spec.ts` | ✅ |
| UsuariosService | `usuarios.service.spec.ts` | ✅ |
| ProductosService | `productos.service.spec.ts` | ✅ |
| ProductoVariantesService | `producto-variantes.service.spec.ts` | ✅ |
| ReservasService | `reservas.service.spec.ts` | ✅ |
| ColoresService | `colores.service.spec.ts` | ✅ |
| TallesService | `talles.service.spec.ts` | ✅ |
| PrismaService | `prisma.service.spec.ts` | ✅ |

### Comandos

```bash
cd vestimenta-catan-api

# Ejecutar todos los tests
pnpm run test

# Modo watch (desarrollo)
pnpm run test:watch

# Un archivo específico
pnpm run test -- auth.service.spec.ts

# Con coverage
pnpm run test:cov
```

---

## Tests E2E

### Configuración

Los tests E2E prueban la API completa contra una base de datos PostgreSQL real.

```mermaid
flowchart LR
    Test[Test Suite] -->|HTTP| API[NestJS App]
    API -->|Prisma| DB[(pg17_test<br/>Puerto 5434)]
```

### Características

- **Base de datos dedicada**: `pg17_test` en puerto 5434
- **Limpieza automática**: Entre cada suite de tests
- **Rate limiting desactivado**: Para evitar bloqueos
- **Cookies httpOnly**: Tests verifican flujo real

### Estructura de Tests E2E

```typescript
// test/auth.e2e-spec.ts
describe('Auth (E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await app.close();
  });

  describe('POST /api/auth/register', () => {
    it('debería registrar un nuevo usuario', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body.user.email).toBe(testUser.email);
      expect(response.headers['set-cookie']).toBeDefined();
    });
  });
});
```

### Tests E2E Implementados

| Suite | Archivo | Casos | Estado |
|-------|---------|-------|--------|
| App básico | `app.e2e-spec.ts` | 4 | ✅ |
| Autenticación | `auth.e2e-spec.ts` | 12 | ✅ |

### Flujos Probados

```mermaid
flowchart TB
    subgraph Auth["Auth E2E"]
        R[Registro] --> L[Login]
        L --> Me[/me endpoint]
        L --> Refresh[Refresh Token]
        L --> Logout[Logout]
        L --> LogoutAll[Logout All]
    end

    subgraph Errors["Casos de Error"]
        DupEmail[Email duplicado 409]
        BadPass[Password inválida 401]
        NoToken[Sin token 401]
        BadToken[Token inválido 401]
    end
```

### Comandos

```bash
cd vestimenta-catan-api

# Asegurar que la BD de test esté corriendo
docker-compose -f ../docker-postgres/docker-compose.yml up -d db_test

# Ejecutar tests E2E
pnpm run test:e2e

# Tests E2E con watch
pnpm run test:e2e -- --watch

# Un archivo específico
pnpm run test:e2e -- auth.e2e-spec.ts
```

---

## Cobertura de Código

### Objetivo de Cobertura

| Métrica | Objetivo | Mínimo Aceptable |
|---------|----------|------------------|
| Lines | > 80% | 70% |
| Functions | > 80% | 70% |
| Branches | > 75% | 65% |
| Statements | > 80% | 70% |

### Generar Reporte

```bash
cd vestimenta-catan-api

# Generar reporte de cobertura
pnpm run test:cov

# Ver reporte HTML
open coverage/lcov-report/index.html
```

### Archivos Excluidos

```javascript
// jest.config.js
coveragePathIgnorePatterns: [
  '/node_modules/',
  '/dist/',
  '.module.ts',
  '.dto.ts',
  'main.ts',
]
```

---

## Ambientes de Testing

```mermaid
flowchart LR
    subgraph Environments
        Dev["💻 Desarrollo<br/>:5433<br/>Datos de prueba"]
        Test["🧪 Test E2E<br/>:5434<br/>Se limpia automáticamente"]
        Staging["📋 Staging<br/>:5435<br/>Copia de producción"]
    end

    Dev -->|Tests manuales| Developer
    Test -->|Tests automatizados| CI
    Staging -->|QA Manual| Tester
```

### Variables de Entorno para Tests

```env
# .env.test
DATABASE_URL="postgresql://admin:admin@localhost:5434/comercio_electronico_db_test"
NODE_ENV=test
RATE_LIMIT_LIMIT=10000
RATE_LIMIT_TTL=1000
```

---

## Ejecución de Tests

### Flujo de Desarrollo

```mermaid
flowchart LR
    Code[Escribir código] --> Unit[Tests unitarios]
    Unit --> Commit[Commit]
    Commit --> Push[Push]
    Push --> CI[CI Pipeline]
    CI --> Lint[Lint]
    Lint --> UnitCI[Unit Tests]
    UnitCI --> E2ECI[E2E Tests]
    E2ECI --> Build[Build]
```

### Pre-commit Hook

El proyecto ejecuta lint antes de cada commit:

```bash
# Ejecutado automáticamente por Husky
pnpm run lint
```

### CI Pipeline (GitHub Actions)

```yaml
# Flujo de CI
- Lint (ESLint)
- Unit Tests (Jest)
- E2E Tests (Jest + PostgreSQL)
- Build (TypeScript)
```

### Validación Completa Local

```bash
# Desde la raíz del monorepo
npm run validate

# Esto ejecuta:
# 1. Backend: pnpm lint + pnpm test
# 2. Frontend: npm lint
```

---

## Criterios de Aceptación

### Definition of Done

Un feature se considera completo cuando:

- [ ] Tests unitarios escritos y pasando
- [ ] Tests E2E para flujos críticos
- [ ] Cobertura de código > 80%
- [ ] Sin errores de lint
- [ ] Build exitoso
- [ ] Documentación actualizada (si aplica)
- [ ] Code review aprobado

### Checklist de Calidad

```mermaid
flowchart TB
    subgraph QA["Quality Assurance"]
        T1[✓ Tests pasan]
        T2[✓ Coverage > 80%]
        T3[✓ Lint sin errores]
        T4[✓ Build exitoso]
        T5[✓ Sin vulnerabilidades]
    end

    T1 --> Ready
    T2 --> Ready
    T3 --> Ready
    T4 --> Ready
    T5 --> Ready[Listo para merge]
```

### Matriz de Testing por Feature

| Feature | Unit | E2E | Manual |
|---------|------|-----|--------|
| Registro de usuario | ✅ | ✅ | ✅ |
| Login | ✅ | ✅ | ✅ |
| Refresh token | ✅ | ✅ | ✅ |
| CRUD Productos | ✅ | ⏳ | ✅ |
| CRUD Variantes | ✅ | ⏳ | ✅ |
| Sistema de reservas | ✅ | ⏳ | ✅ |
| Cambio de estado reserva | ✅ | ⏳ | ✅ |

---

## Troubleshooting

### Error: "Connection refused" en E2E

```bash
# Verificar que la BD de test esté corriendo
docker ps | grep pg17_test

# Si no está corriendo
cd docker-postgres
docker-compose up -d db_test
```

### Error: "Rate limit exceeded"

Los tests E2E están configurados para saltear rate limiting. Si aparece este error:

1. Verificar que `.env.test` tenga `NODE_ENV=test`
2. Verificar que el controller use `@SkipThrottle({ default: process.env.NODE_ENV === 'test' })`

### Tests fallan por datos previos

```bash
# Limpiar la base de datos de test manualmente
docker exec pg17_test psql -U admin -d comercio_electronico_db_test -c "TRUNCATE usuarios, refresh_tokens CASCADE;"
```

---

## Registro de Cambios

| Fecha | Versión | Cambios |
|-------|---------|---------|
| 2025-12-26 | 1.0 | Documento inicial |

---

**Última actualización**: 2025-12-26
**Versión del documento**: 1.0
