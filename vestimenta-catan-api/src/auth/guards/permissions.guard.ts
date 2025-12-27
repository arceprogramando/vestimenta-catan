import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { RequestUser } from '../../common/interfaces';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Guard de autorización por permisos granulares
 * - Verifica que el usuario tenga al menos uno de los permisos requeridos
 * - Los permisos se cargan desde la DB basándose en el rol del usuario
 * - superadmin tiene todos los permisos automáticamente
 * - Debe usarse después de JwtAuthGuard
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtener los permisos requeridos del decorador @RequirePermission()
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si no hay permisos requeridos, permitir acceso
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Obtener el usuario del request
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    // superadmin tiene todos los permisos
    if (user.rol === 'superadmin') {
      return true;
    }

    // Cargar permisos del usuario si no están en el request
    if (!user.permisos) {
      user.permisos = await this.loadUserPermissions(user.userId);
    }

    // Verificar si tiene al menos uno de los permisos requeridos
    const hasPermission = requiredPermissions.some((permission) =>
      user.permisos?.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere uno de los siguientes permisos: ${requiredPermissions.join(', ')}`,
      );
    }

    return true;
  }

  /**
   * Carga los permisos del usuario desde la base de datos
   */
  private async loadUserPermissions(userId: number): Promise<string[]> {
    const usuario = await this.prisma.usuarios.findUnique({
      where: { id: BigInt(userId) },
      select: {
        rol_id: true,
        rol_ref: {
          select: {
            rol_permisos: {
              where: {
                permiso: {
                  is_active: true,
                },
              },
              select: {
                permiso: {
                  select: {
                    codigo: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!usuario?.rol_ref) {
      return [];
    }

    return usuario.rol_ref.rol_permisos.map((rp) => rp.permiso.codigo);
  }
}
