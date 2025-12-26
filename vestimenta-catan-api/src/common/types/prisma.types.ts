/**
 * Interface para valores Decimal de Prisma
 * Prisma devuelve Decimal como un objeto con métodos toNumber() y toString()
 */
export interface DecimalLike {
  toNumber(): number;
  toString(): string;
}

/**
 * Request con cookies (usado en auth controller y strategies)
 */
export interface RequestWithCookies {
  cookies?: {
    accessToken?: string;
    refreshToken?: string;
  };
  headers: {
    'user-agent'?: string;
    'x-forwarded-for'?: string;
    authorization?: string;
  };
  ip?: string;
  user?: {
    payload: { sub: number; email: string };
    refreshToken: string;
  };
}

/**
 * Item de resumen de stock para productos
 */
export interface StockResumenItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  genero: string;
  precio: number | null;
  thumbnail: string | null;
  stock_total: number;
  variantes_count: number;
}
