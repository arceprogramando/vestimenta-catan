# Guía de Contribución

Gracias por tu interés en contribuir a Vestimenta Catán. Esta guía te ayudará a entender cómo contribuir al proyecto.

## Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Configuración del Entorno](#configuración-del-entorno)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Estándares de Código](#estándares-de-código)
- [Commits](#commits)
- [Pull Requests](#pull-requests)
- [Reportar Bugs](#reportar-bugs)
- [Solicitar Features](#solicitar-features)

## Código de Conducta

Este proyecto y todos sus participantes están gobernados por nuestro código de conducta. Al participar, se espera que respetes este código.

- Sé respetuoso y considerado
- Acepta las críticas constructivas
- Enfócate en lo que es mejor para la comunidad
- Muestra empatía hacia otros miembros

## Configuración del Entorno

### Requisitos previos

- Node.js >= 20.x
- pnpm >= 9.x
- npm >= 10.x
- Docker y Docker Compose
- Git

### Instalación

1. Fork del repositorio
2. Clonar tu fork:

```bash
git clone https://github.com/tu-usuario/vestimenta-catan.git
cd vestimenta-catan
```

3. Agregar upstream:

```bash
git remote add upstream https://github.com/original/vestimenta-catan.git
```

4. Instalar dependencias:

```bash
# Monorepo
npm install

# Backend
cd vestimenta-catan-api
pnpm install

# Frontend
cd ../vestimenta-catan-frontend
npm install
```

5. Configurar variables de entorno:

```bash
# Backend
cp vestimenta-catan-api/.env.example vestimenta-catan-api/.env

# Frontend
cp vestimenta-catan-frontend/.env.example vestimenta-catan-frontend/.env.local
```

6. Iniciar base de datos:

```bash
cd docker-postgres
docker-compose up -d
```

7. Ejecutar migraciones:

```bash
cd vestimenta-catan-api
npx prisma migrate dev
```

## Flujo de Trabajo

### 1. Sincronizar con upstream

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. Crear rama feature

```bash
git checkout -b feat/nombre-descriptivo
```

### Convención de nombres de ramas

| Prefijo | Uso |
|---------|-----|
| `feat/` | Nueva funcionalidad |
| `fix/` | Corrección de bug |
| `docs/` | Documentación |
| `refactor/` | Refactorización |
| `test/` | Tests |
| `chore/` | Tareas de mantenimiento |

### 3. Desarrollar y hacer commits

```bash
# Hacer cambios...
git add .
git commit -m "feat: descripción del cambio"
```

### 4. Push y Pull Request

```bash
git push origin feat/nombre-descriptivo
```

Luego crear PR en GitHub.

## Estándares de Código

### TypeScript

- **Nunca usar `any`** - Siempre encontrar el tipo correcto
- Usar tipos explícitos para parámetros de funciones
- Preferir interfaces sobre types para objetos
- Usar enums para conjuntos fijos de valores

```typescript
// Correcto
function getUser(id: number): Promise<User> {
  // ...
}

// Incorrecto
function getUser(id: any): any {
  // ...
}
```

### Backend (NestJS)

- Un servicio por módulo
- Validación con class-validator en DTOs
- Documentar endpoints con decoradores de Swagger
- Manejar errores con excepciones de NestJS

```typescript
// Estructura de un módulo
src/
  modulo/
    dto/
      create-modulo.dto.ts
      update-modulo.dto.ts
    modulo.controller.ts
    modulo.service.ts
    modulo.module.ts
```

### Frontend (Next.js)

- Componentes funcionales con hooks
- Usar App Router conventions
- Estilos con Tailwind CSS
- Estado global con Zustand

```typescript
// Componente típico
export function MiComponente({ prop }: MiComponenteProps) {
  const [state, setState] = useState(initialValue);

  return (
    <div className="p-4">
      {/* ... */}
    </div>
  );
}
```

### Linting

Ejecutar antes de cada commit:

```bash
# Backend
cd vestimenta-catan-api
pnpm run lint

# Frontend
cd vestimenta-catan-frontend
npm run lint
```

### Testing

Escribir tests para:

- Servicios (lógica de negocio)
- Controllers (endpoints)
- Funciones utilitarias

```bash
# Ejecutar tests
cd vestimenta-catan-api
pnpm run test

# Con coverage
pnpm run test:cov
```

## Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/).

### Formato

```
<tipo>: <descripción>

[cuerpo opcional]

[footer opcional]
```

### Tipos permitidos

| Tipo | Descripción |
|------|-------------|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `docs` | Documentación |
| `style` | Formato (no afecta código) |
| `refactor` | Refactorización |
| `perf` | Mejora de rendimiento |
| `test` | Agregar/modificar tests |
| `build` | Sistema de build |
| `ci` | Integración continua |
| `chore` | Tareas de mantenimiento |
| `revert` | Revertir commit |

### Ejemplos

```bash
# Feature
git commit -m "feat: add user profile page"

# Bug fix
git commit -m "fix: correct login redirect issue"

# Con scope
git commit -m "feat(auth): add password reset"

# Breaking change
git commit -m "feat!: change API response format"
```

### Reglas

- Descripción en inglés, minúsculas, sin punto final
- Máximo 72 caracteres en primera línea
- Usar presente imperativo ("add" no "added")

## Pull Requests

### Checklist

Antes de crear un PR, asegurar:

- [ ] Tests pasan: `pnpm run test`
- [ ] Linting pasa: `pnpm run lint`
- [ ] Build funciona: `pnpm run build`
- [ ] Documentación actualizada si aplica
- [ ] Commits siguen conventional commits

### Título del PR

Usar el mismo formato que commits:

```
feat: add user profile management
```

### Descripción del PR

```markdown
## Descripción
Breve descripción de los cambios.

## Tipo de cambio
- [ ] Bug fix
- [ ] Nueva feature
- [ ] Breaking change
- [ ] Documentación

## Testing
Describir cómo se probaron los cambios.

## Screenshots
Si aplica, agregar screenshots.
```

### Proceso de Review

1. Al menos 1 aprobación requerida
2. CI debe pasar
3. Sin conflictos con main
4. Squash merge al mergear

## Reportar Bugs

### Antes de reportar

1. Verificar que no exista un issue similar
2. Probar con la última versión
3. Recolectar información relevante

### Crear issue

Usar la plantilla de bug report:

```markdown
## Descripción
Descripción clara del bug.

## Pasos para reproducir
1. Ir a '...'
2. Click en '...'
3. Ver error

## Comportamiento esperado
Qué debería pasar.

## Comportamiento actual
Qué está pasando.

## Entorno
- OS: [e.g., Windows 11]
- Node: [e.g., 20.x]
- Browser: [e.g., Chrome 120]

## Screenshots
Si aplica.

## Logs
```
Pegar logs relevantes
```
```

## Solicitar Features

### Antes de solicitar

1. Verificar que no exista una solicitud similar
2. Considerar si es útil para otros usuarios

### Crear issue

Usar la plantilla de feature request:

```markdown
## Problema
Descripción del problema que esta feature resolvería.

## Solución propuesta
Descripción de la solución que te gustaría.

## Alternativas consideradas
Otras soluciones que consideraste.

## Contexto adicional
Cualquier otro contexto o screenshots.
```

---

¿Preguntas? Abre un issue o contacta a los mantenedores.
