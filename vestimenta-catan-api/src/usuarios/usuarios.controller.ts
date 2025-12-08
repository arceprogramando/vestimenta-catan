import {
  Body,
  Controller,
  Delete,
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
  @ApiOperation({ summary: 'Obtener todos los usuarios (solo admin)' })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    type: Boolean,
    description: 'Incluir usuarios inactivos',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuarios' })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.usuariosService.findAll(includeInactive === 'true');
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
    // El usuario no puede cambiar su propio rol
    const { rol, ...allowedUpdates } = updateUsuarioDto;
    return this.usuariosService.update(user.userId, allowedUpdates);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar usuario por ID (solo admin)' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
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
