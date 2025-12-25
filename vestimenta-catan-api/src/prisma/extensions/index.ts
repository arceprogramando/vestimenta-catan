/**
 * Prisma Client Extensions - Arquitectura modular
 *
 * Cada extensión está separada por dominio:
 * - soft-delete: Funcionalidad de borrado lógico para todos los modelos
 * - usuarios: Campos computados para usuarios
 * - productos: Métodos de stock y campos computados
 * - reservas: Métodos de estado y campos computados
 */

export { softDeleteExtension } from './soft-delete.extension';
export type { AuditContext } from './soft-delete.extension';
export { usuariosExtension } from './usuarios.extension';
export { productosExtension } from './productos.extension';
export type { StockResumenItem } from './productos.extension';
export { reservasExtension } from './reservas.extension';
