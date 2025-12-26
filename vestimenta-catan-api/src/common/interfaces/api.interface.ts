/**
 * Estructura de respuesta de error global
 */
export interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  message: string | string[];
  error?: string;
  requestId?: string;
}

/**
 * Respuesta de excepción HTTP de NestJS
 */
export interface HttpExceptionResponse {
  message?: string | string[];
  error?: string;
  statusCode?: number;
}
