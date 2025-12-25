import { Prisma, genero } from '@prisma/client';

/**
 * Tipo para el resultado de stock resumen
 */
export interface StockResumenItem {
  id: number;
  nombre: string;
  genero: genero;
  descripcion: string | null;
  thumbnail: string | null;
  stock_total: number;
}

/**
 * Labels para géneros
 */
const GENERO_LABELS: Record<genero, string> = {
  mujer: 'Mujer',
  hombre: 'Hombre',
  ninios: 'Niños',
};

/**
 * Extensión para métodos custom y campos computados en productos
 */
export const productosExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: 'productos',
    model: {
      productos: {
        /**
         * Busca un producto con todo su stock (variantes, colores, talles)
         */
        async findWithStock(id: number) {
          return client.productos.findUnique({
            where: { id, is_active: true },
            include: {
              producto_variantes: {
                where: { is_active: true },
                include: {
                  color: true,
                  talle: true,
                },
                orderBy: [
                  { talle: { orden: 'asc' } },
                  { color: { nombre: 'asc' } },
                ],
              },
            },
          });
        },

        /**
         * Obtiene resumen de stock de todos los productos activos
         */
        async getStockResumen(): Promise<StockResumenItem[]> {
          const productos = await client.productos.findMany({
            where: { is_active: true },
            include: {
              producto_variantes: {
                where: { is_active: true },
                select: { cantidad: true },
              },
            },
          });

          return productos.map((p) => ({
            id: p.id,
            nombre: p.nombre,
            genero: p.genero,
            descripcion: p.descripcion,
            thumbnail: p.thumbnail,
            stock_total: p.producto_variantes.reduce(
              (sum, v) => sum + v.cantidad,
              0,
            ),
          }));
        },
      },
    },
    result: {
      productos: {
        /**
         * Nombre para mostrar con género incluido
         */
        displayName: {
          needs: { nombre: true, genero: true },
          compute(producto: { nombre: string; genero: genero }): string {
            return `${producto.nombre} - ${GENERO_LABELS[producto.genero]}`;
          },
        },
      },
    },
  });
});
