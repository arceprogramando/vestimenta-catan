import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { canManageRole } from '../auth/guards/roles.guard';
import { rol_usuario } from '@prisma/client';
import { PaginationQueryDto } from '../common/dto';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto';
import { UsuariosService } from './usuarios.service';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear un nuevo usuario (solo admin)' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 409, description: 'El email ya está registrado' })
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary: 'Obtener usuarios paginados con búsqueda (solo admin)',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir usuarios inactivos',
  })
  @ApiQuery({
    name: 'rol',
    required: false,
    enum: ['user', 'admin', 'super_admin'],
    description: 'Filtrar por rol',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios paginada' })
  findAll(
    @Query() pagination: PaginationQueryDto,
    @Query('includeInactive') includeInactive?: string,
    @Query('rol') rol?: string,
  ) {
    return this.usuariosService.findAllPaginated({
      limit: pagination.limit,
      offset: pagination.offset,
      search: pagination.search,
      rol: rol as rol_usuario | undefined,
      includeInactive: includeInactive === 'true',
    });
  }

  @Get('roles')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener todos los roles disponibles (solo admin)' })
  @ApiResponse({ status: 200, description: 'Lista de roles con descripciones' })
  getRoles() {
    return this.usuariosService.findAllRoles();
  }

  @Get('me')
  @ApiOperation({ summary: 'Obtener perfil del usuario actual' })
  @ApiResponse({ status: 200, description: 'Datos del usuario actual' })
  getProfile(@CurrentUser() user: RequestUser) {
    return this.usuariosService.findById(user.userId);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Obtener usuario por ID (solo admin)' })
  @ApiResponse({ status: 200, description: 'Datos del usuario' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findById(id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualizar perfil del usuario actual' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  updateProfile(
    @CurrentUser() user: RequestUser,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    // El usuario no puede cambiar su propio rol - omitimos rol del update
    const allowedUpdates: Omit<UpdateUsuarioDto, 'rol'> = {
      nombre: updateUsuarioDto.nombre,
      apellido: updateUsuarioDto.apellido,
      email: updateUsuarioDto.email,
      password: updateUsuarioDto.password,
    };
    return this.usuariosService.update(user.userId, allowedUpdates);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar usuario por ID (solo admin)' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiResponse({
    status: 403,
    description: 'No puede asignar un rol igual o superior al suyo',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @CurrentUser() currentUser: RequestUser,
  ) {
    // Validaciones de seguridad para cambio de rol
    if (updateUsuarioDto.rol) {
      // 1. No permitir que un usuario cambie su propio rol (escalación de privilegios)
      if (currentUser.userId === id) {
        throw new ForbiddenException(
          'No puede modificar su propio rol. Solicite a otro administrador.',
        );
      }

      // 2. Validar que solo pueda asignar roles de menor nivel que el suyo
      if (!canManageRole(currentUser.rol, updateUsuarioDto.rol)) {
        throw new ForbiddenException(
          'No puede asignar un rol igual o superior al suyo',
        );
      }
    }
    return this.usuariosService.update(id, updateUsuarioDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar usuario (soft delete, solo admin)' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    return this.usuariosService.remove(id, user.email);
  }
}
