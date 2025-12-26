/**
 * DTO para operaciones de eliminación lógica (soft delete)
 * Usado por todos los servicios que implementan soft delete
 */
export interface SoftDeleteDto {
  /** Usuario que realizó la eliminación */
  deleted_by?: string;
  /** Motivo de la eliminación */
  delete_reason?: string;
}

/**
 * Contexto de auditoría para operaciones de soft delete
 * Usado por las extensiones de Prisma
 */
export interface AuditContext {
  userId?: bigint;
  userEmail?: string;
}
