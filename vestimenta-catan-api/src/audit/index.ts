/**
 * Módulo de Auditoría - ISO 9001 Compliant
 *
 * Sistema de auditoría exhaustivo para trazabilidad completa:
 * - Registro automático de CREATE, UPDATE, DELETE, RESTORE
 * - Buffer en memoria para optimizar escrituras
 * - Limpieza automática de logs antiguos
 * - Contexto de usuario via AsyncLocalStorage
 * - Sanitización de datos sensibles
 *
 * Uso:
 * 1. Importar AuditModule en AppModule
 * 2. Agregar auditExtension a Prisma
 * 3. Los logs se generan automáticamente
 *
 * Variables de entorno:
 * - AUDIT_ENABLED: true/false (default: true)
 * - AUDIT_RETENTION_DAYS: días de retención (default: 90)
 */

export { AuditModule } from './audit.module';
export { AuditService } from './audit.service';
export { auditExtension, setAuditService } from './audit.extension';
export { AuditContextMiddleware } from './audit.middleware';
export {
  getAuditContext,
  runWithAuditContext,
  auditContextStorage,
} from './audit.context';
export * from './audit.types';
export * from './audit.utils';
