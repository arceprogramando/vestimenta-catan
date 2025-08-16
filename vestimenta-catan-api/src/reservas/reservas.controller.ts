import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ReservasService } from './reservas.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';

@ApiTags('reservas')
@Controller('reservas')
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva reserva' })
  @ApiBody({ type: CreateReservaDto })
  @ApiResponse({ status: 201, description: 'Reserva creada exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() createReservaDto: CreateReservaDto) {
    return this.reservasService.create(createReservaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las reservas' })
  @ApiResponse({ status: 200, description: 'Lista de reservas.' })
  findAll() {
    return this.reservasService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una reserva por ID' })
  @ApiParam({ name: 'id', description: 'ID de la reserva', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Reserva encontrada.' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const reserva = await this.reservasService.findOne(id);
    if (!reserva) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }
    return reserva;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una reserva' })
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
  @ApiOperation({ summary: 'Eliminar una reserva' })
  @ApiParam({ name: 'id', description: 'ID de la reserva', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Reserva eliminada.' })
  @ApiResponse({ status: 404, description: 'Reserva no encontrada.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reservasService.remove(id);
  }
}
