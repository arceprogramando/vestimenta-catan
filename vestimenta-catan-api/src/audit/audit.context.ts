import { AsyncLocalStorage } from 'async_hooks';
import { AuditRequestContext } from './audit.types';

/**
 * AsyncLocalStorage para mantener el contexto de auditoría
 * a través de toda la cadena de llamadas async
 *
 * Esto permite que el middleware de auditoría sepa
 * quién está haciendo la operación sin pasar el contexto
 * manualmente por todos los métodos.
 */
export const auditContextStorage = new AsyncLocalStorage<AuditRequestContext>();

/**
 * Obtiene el contexto de auditoría actual
 */
export function getAuditContext(): AuditRequestContext | undefined {
  return auditContextStorage.getStore();
}

/**
 * Ejecuta una función con un contexto de auditoría específico
 */
export function runWithAuditContext<T>(
  context: AuditRequestContext,
  fn: () => T,
): T {
  return auditContextStorage.run(context, fn);
}
