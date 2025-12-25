import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestUser } from '../decorators/current-user.decorator';

/**
 * Jerarquía de roles - mayor nivel = más permisos
 * Un rol superior puede acceder a todo lo que accede un rol inferior
 */
export const ROLE_HIERARCHY: Record<string, number> = {
  user: 1,
  empleado: 2,
  admin: 3,
  superadmin: 4,
};

/**
 * Guard de autorización por roles con jerarquía
 * - Verifica que el usuario tenga uno de los roles requeridos
 * - Roles superiores heredan permisos de roles inferiores
 * - Debe usarse después de JwtAuthGuard
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Obtener los roles requeridos del decorador @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay roles requeridos, permitir acceso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Obtener el usuario del request
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // Obtener el nivel del rol del usuario
    const userRoleLevel = ROLE_HIERARCHY[user.rol] || 0;

    // Obtener el nivel mínimo requerido (el menor de los roles especificados)
    const minRequiredLevel = Math.min(
      ...requiredRoles.map((role) => ROLE_HIERARCHY[role] || 999),
    );

    // El usuario puede acceder si su nivel es >= al mínimo requerido
    const hasAccess = userRoleLevel >= minRequiredLevel;

    if (!hasAccess) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

/**
 * Helper para verificar si un rol puede gestionar otro rol
 * (Un rol solo puede gestionar roles de menor nivel)
 */
export function canManageRole(
  managerRole: string,
  targetRole: string,
): boolean {
  const managerLevel = ROLE_HIERARCHY[managerRole] || 0;
  const targetLevel = ROLE_HIERARCHY[targetRole] || 0;
  return managerLevel > targetLevel;
}
