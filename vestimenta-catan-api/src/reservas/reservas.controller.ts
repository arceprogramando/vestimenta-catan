import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { RequestUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ReservasService } from './reservas.service';
import type { SoftDeleteDto } from '../common/interfaces';
import { PaginationQueryDto } from '../common/dto';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { estado_reserva } from '@prisma/client';

@ApiTags('reservas')
@ApiBearerAuth()
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva reserva (usuario autenticado)' })
  @ApiBody({ type: CreateReservaDto })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente.' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o stock insuficiente.',
  })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  @ApiResponse({ status: 404, description: 'Variante no encontrada.' })
  create(
    @Body() createReservaDto: CreateReservaDto,
    @CurrentUser() user: RequestUser,
  ) {
    // Asociar reserva al usuario actual si no viene en el DTO
    const dto = {
      ...createReservaDto,
      usuario_id: createReservaDto.usuario_id || user?.userId,
    };
    return this.reservasService.create(dto);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({
    summary: 'Obtener todas las reservas paginadas (solo admin)',
  })
  @ApiQuery({
    name: 'includeDeleted',
    required: false,
    type: Boolean,
    description: 'Incluir reservas eliminadas',
  })
  @ApiQuery({
    name: 'estado',
    required: false,
    enum: ['pendiente', 'confirmado', 'cancelado', 'completado'],
    description: 'Filtrar por estado de reserva',
  })
  @ApiResponse({ status: 200, description: 'Lista de reservas paginada.' })
  findAll(
    @Query() pagination: PaginationQueryDto,
    @Query('includeDeleted') includeDeleted?: string,
    @Query('estado') estado?: estado_reserva,
  ) {
    return this.reservasService.findAllPaginated({
      ...pagination,
      estado,
      includeDeleted: includeDeleted === 'true',
    });
  }

  @Get('mis-reservas')
  @ApiOperation({ summary: 'Obtener reservas del usuario actual' })
  @ApiResponse({ status: 200, description: 'Lista de reservas del usuario.' })
  @ApiResponse({ status: 401, description: 'No autenticado.' })
  findMyReservas(@CurrentUser() user: RequestUser) {
    if (!user?.userId) {
      return [];
    }
    return this.reservasService.findByUsuario(user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una reserva por ID' })
  @ApiParam({ name: 'id', description: 'ID de la reserva', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Reserva encontrada.' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: RequestUser,
  ) {
    const reserva = await this.reservasService.findOne(id);
    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }
    // Verificar que el usuario sea dueño de la reserva o admin
    if (user?.rol !== 'admin' && reserva.usuario_id !== user?.userId) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }
    return reserva;
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar una reserva (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID de la reserva', type: 'integer' })
  @ApiBody({ type: UpdateReservaDto })
  @ApiResponse({ status: 200, description: 'Reserva actualizada.' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReservaDto: UpdateReservaDto,
  ) {
    return this.reservasService.update(id, updateReservaDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar una reserva (soft delete, solo admin)' })
  @ApiParam({ name: 'id', description: 'ID de la reserva', type: 'integer' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        deleted_by: { type: 'string', example: 'admin@example.com' },
        delete_reason: { type: 'string', example: 'Solicitud del cliente' },
      },
    },
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Reserva eliminada.' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Body() softDeleteDto?: SoftDeleteDto,
    @CurrentUser() user?: RequestUser,
  ) {
    const deleteInfo: SoftDeleteDto = {
      deleted_by: softDeleteDto?.deleted_by || user?.email,
      delete_reason: softDeleteDto?.delete_reason,
    };
    return this.reservasService.remove(id, deleteInfo);
  }

  @Post(':id/restore')
  @Roles('admin')
  @ApiOperation({ summary: 'Restaurar una reserva eliminada (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID de la reserva', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Reserva restaurada.' })
  @ApiResponse({ status: 400, description: 'La reserva no está eliminada.' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.restore(id);
  }
}
