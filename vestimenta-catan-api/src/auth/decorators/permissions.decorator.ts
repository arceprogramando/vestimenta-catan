import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorador para restringir acceso a permisos específicos
 * @param permissions Lista de permisos requeridos (cualquiera de ellos)
 * @example
 * @RequirePermission('productos.editar')
 * @Patch(':id')
 * update(@Param('id') id: string) { }
 *
 * @example
 * @RequirePermission('productos.crear', 'productos.editar')
 * @Post()
 * create() { }
 */
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
