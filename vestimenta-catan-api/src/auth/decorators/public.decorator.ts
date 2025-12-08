import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorador para marcar endpoints como públicos (sin autenticación requerida)
 * @example
 * @Public()
 * @Get('health')
 * healthCheck() { return 'OK'; }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
