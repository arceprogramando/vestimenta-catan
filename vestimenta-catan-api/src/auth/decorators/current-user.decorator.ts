import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Interface del usuario en el request (después de validar JWT)
 */
export interface RequestUser {
  userId: number;
  email: string;
  rol: string;
}

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
