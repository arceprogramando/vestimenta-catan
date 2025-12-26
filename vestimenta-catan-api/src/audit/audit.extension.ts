import { Prisma } from '@prisma/client';
import { AuditService } from './audit.service';
import { getAuditContext } from './audit.context';
import {
  isAuditableTable,
  getChangedFields,
  extractRecordId,
  sanitizeData,
} from './audit.utils';
import { AuditAction, AuditableTable } from './audit.types';

// Variable global para el servicio de auditoría
// Se inyecta desde el módulo
let auditService: AuditService | null = null;

/**
 * Configura el servicio de auditoría para la extensión
 */
export function setAuditService(service: AuditService): void {
  auditService = service;
}

/**
 * Extensión de Prisma para auditoría automática
 *
 * Intercepta operaciones create, update, delete, upsert
 * y registra los cambios automáticamente.
 */
export const auditExtension = Prisma.defineExtension({
  name: 'audit',
  query: {
    $allModels: {
      async create({ model, args, query }) {
        const result = await query(args);

        if (isAuditableTable(model)) {
          logAuditEvent(
            model,
            'CREATE',
            null,
            result as Record<string, unknown>,
          );
        }

        return result;
      },

      async createMany({ model, args, query }) {
        const result = await query(args);

        // createMany no retorna los registros creados, solo el count
        // No podemos auditar IDs individuales
        if (isAuditableTable(model) && auditService) {
          const ctx = getAuditContext();
          auditService.log({
            tabla: model,
            registro_id: `batch:${result.count}`,
            accion: 'CREATE',
            datos_antes: null,
            datos_despues: { count: result.count, data: '[BATCH]' },
            campos_modificados: [],
            usuario_id: ctx?.userId ?? null,
            usuario_email: ctx?.userEmail ?? null,
            ip_address: ctx?.ipAddress ?? null,
            user_agent: ctx?.userAgent ?? null,
          });
        }

        return result;
      },

      async update({ model, args, query }) {
        // Obtener estado anterior
        let before: Record<string, unknown> | null = null;

        if (isAuditableTable(model)) {
          try {
            const findArgs = { where: args.where };
            before = await (
              query as unknown as (
                args: unknown,
              ) => Promise<Record<string, unknown> | null>
            )(
              // Hack: usamos findUnique simulando la query
              // En realidad necesitamos acceder al modelo directamente
              findArgs,
            );
          } catch {
            // Si falla obtener el estado anterior, continuamos sin él
          }
        }

        const result = await query(args);

        if (isAuditableTable(model)) {
          // Para update, intentamos obtener el before del contexto o lo dejamos null
          logAuditEvent(
            model,
            'UPDATE',
            before,
            result as Record<string, unknown>,
          );
        }

        return result;
      },

      async updateMany({ model, args, query }) {
        const result = await query(args);

        if (isAuditableTable(model) && auditService) {
          const ctx = getAuditContext();
          auditService.log({
            tabla: model,
            registro_id: `batch:${result.count}`,
            accion: 'UPDATE',
            datos_antes: null,
            datos_despues: {
              count: result.count,
              where: sanitizeData(args.where as Record<string, unknown>),
              data: sanitizeData(args.data as Record<string, unknown>),
            },
            campos_modificados: Object.keys(args.data as object),
            usuario_id: ctx?.userId ?? null,
            usuario_email: ctx?.userEmail ?? null,
            ip_address: ctx?.ipAddress ?? null,
            user_agent: ctx?.userAgent ?? null,
          });
        }

        return result;
      },

      async delete({ model, args, query }) {
        const result = await query(args);

        if (isAuditableTable(model)) {
          // El resultado del delete contiene los datos eliminados
          logAuditEvent(
            model,
            'DELETE',
            result as Record<string, unknown>,
            null,
          );
        }

        return result;
      },

      async deleteMany({ model, args, query }) {
        const result = await query(args);

        if (isAuditableTable(model) && auditService) {
          const ctx = getAuditContext();
          auditService.log({
            tabla: model,
            registro_id: `batch:${result.count}`,
            accion: 'DELETE',
            datos_antes: {
              count: result.count,
              where: sanitizeData(args.where as Record<string, unknown>),
            },
            datos_despues: null,
            campos_modificados: [],
            usuario_id: ctx?.userId ?? null,
            usuario_email: ctx?.userEmail ?? null,
            ip_address: ctx?.ipAddress ?? null,
            user_agent: ctx?.userAgent ?? null,
          });
        }

        return result;
      },

      async upsert({ model, args, query }) {
        // No podemos saber si fue create o update sin consultar primero
        const result = await query(args);

        if (isAuditableTable(model)) {
          // Asumimos UPDATE si el registro ya existía
          // En la práctica, logeamos como UPDATE/CREATE genérico
          logAuditEvent(
            model,
            'UPDATE', // Podría ser CREATE, pero es más común UPDATE
            null,
            result as Record<string, unknown>,
          );
        }

        return result;
      },
    },
  },
});

/**
 * Helper para registrar evento de auditoría
 */
function logAuditEvent(
  model: string,
  accion: AuditAction,
  before: Record<string, unknown> | null,
  after: Record<string, unknown> | null,
): void {
  if (!auditService) return;

  const ctx = getAuditContext();
  const recordId = extractRecordId(after) || extractRecordId(before);

  if (!recordId) return; // No podemos auditar sin ID

  const camposModificados = getChangedFields(before, after);

  // Solo auditar si hay cambios reales (excepto CREATE/DELETE)
  if (accion === 'UPDATE' && camposModificados.length === 0) {
    return;
  }

  auditService.log({
    tabla: model as AuditableTable,
    registro_id: recordId,
    accion,
    datos_antes: before,
    datos_despues: after,
    campos_modificados: camposModificados,
    usuario_id: ctx?.userId ?? null,
    usuario_email: ctx?.userEmail ?? null,
    ip_address: ctx?.ipAddress ?? null,
    user_agent: ctx?.userAgent ?? null,
  });
}
