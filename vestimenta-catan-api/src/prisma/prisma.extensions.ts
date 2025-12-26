import { PrismaClient } from '@prisma/client';
import {
  softDeleteExtension,
  usuariosExtension,
  productosExtension,
  reservasExtension,
} from './extensions';
import { auditExtension } from '../audit/audit.extension';

// Re-exportar tipos útiles
export type { AuditContext, StockResumenItem } from './extensions';

/**
 * Crea el cliente extendido con todas las extensiones
 *
 * El orden importa: las extensiones se aplican en cadena
 * auditExtension va primero para capturar todas las operaciones
 */
export function createExtendedPrismaClient(baseClient: PrismaClient) {
  return baseClient
    .$extends(auditExtension) // Auditoría primero para capturar todo
    .$extends(softDeleteExtension)
    .$extends(usuariosExtension)
    .$extends(productosExtension)
    .$extends(reservasExtension);
}

/**
 * Tipo del cliente extendido para usar en toda la app
 */
export type ExtendedPrismaClient = ReturnType<
  typeof createExtendedPrismaClient
>;
