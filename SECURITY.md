# Política de Seguridad

## Versiones Soportadas

| Versión | Soportada |
| ------- | --------- |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x: |

## Reportar una Vulnerabilidad

La seguridad de Vestimenta Catán es una prioridad. Si descubres una vulnerabilidad de seguridad, por favor repórtala de manera responsable.

### Cómo Reportar

1. **NO** abras un issue público para vulnerabilidades de seguridad
2. Envía un email a: arceprogramando@gmail.com
3. Incluye en tu reporte:
   - Descripción de la vulnerabilidad
   - Pasos para reproducir
   - Impacto potencial
   - Sugerencia de solución (si tienes una)

### Qué Esperar

- **Confirmación**: Recibirás confirmación de recepción en 48 horas
- **Evaluación**: Evaluaremos la vulnerabilidad en 7 días
- **Actualización**: Te mantendremos informado del progreso
- **Reconocimiento**: Si lo deseas, te reconoceremos en el changelog

### Política de Divulgación

- Trabajamos bajo divulgación responsable
- No revelaremos detalles hasta tener un fix disponible
- Coordinaremos contigo la divulgación pública

## Medidas de Seguridad Implementadas

### Autenticación

- **JWT con doble token**: Access token (15 min) + Refresh token (7 días)
- **Cookies httpOnly**: Tokens almacenados en cookies seguras, no accesibles por JavaScript
- **Rotación de tokens**: Refresh tokens rotan en cada uso
- **Invalidación de sesiones**: Logout cierra todas las sesiones activas

### Protección de API

- **Rate Limiting**: Límite de peticiones por IP (100/min general, 5/min login, 3/min registro)
- **Helmet**: Headers de seguridad HTTP configurados
- **CORS**: Orígenes permitidos configurados explícitamente
- **Validación**: Todos los inputs validados con class-validator

### Base de Datos

- **Prisma ORM**: Consultas parametrizadas (prevención de SQL Injection)
- **Soft Deletes**: Datos no se eliminan físicamente
- **Auditoría**: Campos created_by, updated_by, timestamps en todas las tablas

### Frontend

- **No localStorage para tokens**: Migrado a cookies httpOnly
- **CSRF**: Cookies con SameSite=Strict en producción
- **XSS**: React escapa automáticamente, no usamos dangerouslySetInnerHTML

### Infraestructura

- **HTTPS**: Obligatorio en producción
- **Docker**: Contenedores aislados
- **Variables de entorno**: Secrets no están en código

## Checklist de Seguridad

### Para Desarrolladores

Antes de cada PR, verificar:

- [ ] No hay credenciales hardcodeadas
- [ ] No se usa `any` en TypeScript
- [ ] Inputs validados con DTOs
- [ ] Endpoints protegidos con guards apropiados
- [ ] No hay `console.log` con datos sensibles
- [ ] Dependencias actualizadas

### Para Despliegue

- [ ] Variables de entorno configuradas
- [ ] HTTPS habilitado
- [ ] CORS configurado correctamente
- [ ] Rate limiting activado
- [ ] Logs no exponen datos sensibles
- [ ] Backups de BD configurados

## Dependencias

Mantenemos las dependencias actualizadas. Ejecutar regularmente:

```bash
# Verificar vulnerabilidades conocidas
npm audit
pnpm audit

# Actualizar dependencias
npm update
pnpm update
```

## Contacto

Para cualquier consulta de seguridad:
- Email: arceprogramando@gmail.com

---

Última actualización: Diciembre 2024
