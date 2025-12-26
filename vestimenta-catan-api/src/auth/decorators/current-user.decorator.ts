import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../../common/interfaces';

// Re-export para mantener compatibilidad con imports existentes
export type { RequestUser } from '../../common/interfaces';

/**
 * Decorador para obtener el usuario actual del request
 * @param data Propiedad específica del usuario a extraer (opcional)
 * @example
 * // Obtener todo el usuario
 * @Get('profile')
 * getProfile(@CurrentUser() user: RequestUser) { return user; }
 *
 * @example
 * // Obtener solo el ID
 * @Get('my-reservations')
 * getMyReservations(@CurrentUser('userId') userId: number) { }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
