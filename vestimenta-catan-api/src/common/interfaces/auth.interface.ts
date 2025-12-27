/**
 * Payload del JWT Access Token
 */
export interface JwtPayload {
  /** ID del usuario */
  sub: number;
  /** Email del usuario */
  email: string;
  /** Rol del usuario */
  rol: string;
  /** Timestamp de emisión (automático) */
  iat?: number;
  /** Timestamp de expiración (automático) */
  exp?: number;
}

/**
 * Payload del JWT Refresh Token
 */
export interface RefreshTokenPayload {
  /** ID del usuario */
  sub: number;
  /** Email del usuario */
  email: string;
  /** Timestamp de emisión (automático) */
  iat?: number;
  /** Timestamp de expiración (automático) */
  exp?: number;
}

/**
 * Usuario actual extraído del JWT (usado en decorador @CurrentUser)
 */
export interface RequestUser {
  /** ID del usuario */
  userId: number;
  /** Email del usuario */
  email: string;
  /** Rol del usuario */
  rol: string;
  /** ID del rol en la tabla roles */
  rolId?: number;
  /** Lista de permisos del usuario (cargados desde DB) */
  permisos?: string[];
}

/**
 * Respuesta de tokens JWT
 */
export interface TokensResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
