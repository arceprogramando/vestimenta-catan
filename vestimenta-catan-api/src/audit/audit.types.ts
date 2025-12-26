/**
 * Tipos para el sistema de auditoría
 *
 * Diseñado para ISO 9001 - Trazabilidad completa de cambios
 */

/**
 * Acciones que se pueden auditar
 */
export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';

/**
 * Tablas que se auditan automáticamente
 * NO se auditan: refresh_tokens (muy volátil), audit_log (evitar recursión)
 */
export const AUDITABLE_TABLES = [
  'usuarios',
  'productos',
  'producto_variantes',
  'reservas',
  'colores',
  'talles',
  'roles',
] as const;

export type AuditableTable = (typeof AUDITABLE_TABLES)[number];

/**
 * Campos sensibles que NO se deben guardar en el audit log
 */
export const SENSITIVE_FIELDS = [
  'password_hash',
  'token_hash',
  'google_id',
] as const;

/**
 * Campos de auditoría que no generan diff
 * (son metadata, no datos de negocio)
 */
export const AUDIT_METADATA_FIELDS = [
  'created_at',
  'created_by',
  'updated_at',
  'updated_by',
  'deleted_at',
  'deleted_by',
  'delete_reason',
] as const;

/**
 * Evento de auditoría en memoria (antes de persistir)
 */
export interface AuditEvent {
  tabla: AuditableTable;
  registro_id: string;
  accion: AuditAction;
  datos_antes: Record<string, unknown> | null;
  datos_despues: Record<string, unknown> | null;
  campos_modificados: string[];
  usuario_id: bigint | null;
  usuario_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: Date;
}

/**
 * Contexto de la operación actual (inyectado vía AsyncLocalStorage)
 */
export interface AuditRequestContext {
  userId?: bigint;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Configuración del sistema de auditoría
 */
export interface AuditConfig {
  /** Tamaño máximo del buffer antes de flush automático */
  bufferSize: number;
  /** Intervalo de flush en milisegundos */
  flushInterval: number;
  /** Días de retención de logs (0 = infinito) */
  retentionDays: number;
  /** Habilitar auditoría */
  enabled: boolean;
}

export const DEFAULT_AUDIT_CONFIG: AuditConfig = {
  bufferSize: 100,
  flushInterval: 5000, // 5 segundos
  retentionDays: 90,
  enabled: true,
};
