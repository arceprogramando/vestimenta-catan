import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorador para restringir acceso a roles específicos
 * @param roles Lista de roles permitidos
 * @example
 * @Roles('admin')
 * @Delete(':id')
 * remove(@Param('id') id: string) { }
 *
 * @example
 * @Roles('admin', 'manager')
 * @Get('reports')
 * getReports() { }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
