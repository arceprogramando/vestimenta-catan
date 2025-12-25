import { PrismaClient } from '@prisma/client';
import {
  softDeleteExtension,
  usuariosExtension,
  productosExtension,
  reservasExtension,
} from './extensions';

// Re-exportar tipos útiles
export type { AuditContext, StockResumenItem } from './extensions';

/**
 * Crea el cliente extendido con todas las extensiones
 *
 * El orden importa: las extensiones se aplican en cadena
 */
export function createExtendedPrismaClient(baseClient: PrismaClient) {
  return baseClient
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
