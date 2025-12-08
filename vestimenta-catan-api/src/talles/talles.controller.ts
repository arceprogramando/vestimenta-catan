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
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { TallesService } from './talles.service';
import { CreateTalleDto } from './dto/create-talle.dto';
import { UpdateTalleDto } from './dto/update-talle.dto';

@ApiTags('talles')
@ApiBearerAuth()
@Controller('talles')
export class TallesController {
  constructor(private readonly tallesService: TallesService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({
    summary: 'Crear un nuevo talle para productos (solo admin)',
    description:
      'Registra un nuevo talle disponible para las variantes de productos de vestimenta.',
  })
  @ApiBody({
    type: CreateTalleDto,
    description: 'Información del talle a registrar',
  })
  @ApiResponse({
    status: 201,
    description: 'Talle creado exitosamente.',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o talle duplicado.',
  })
  create(@Body() createTalleDto: CreateTalleDto) {
    return this.tallesService.create(createTalleDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtener todos los talles' })
  @ApiResponse({ status: 200, description: 'Lista de talles.' })
  findAll() {
    return this.tallesService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener un talle por ID' })
  @ApiParam({ name: 'id', description: 'ID del talle', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Talle encontrado.' })
  @ApiResponse({ status: 404, description: 'Talle no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const talle = await this.tallesService.findOne(id);
    if (!talle) {
      throw new NotFoundException(`Talle con ID ${id} no encontrado`);
    }
    return talle;
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar un talle (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID del talle', type: 'integer' })
  @ApiBody({ type: UpdateTalleDto })
  @ApiResponse({ status: 200, description: 'Talle actualizado.' })
  @ApiResponse({ status: 404, description: 'Talle no encontrado.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTalleDto: UpdateTalleDto,
  ) {
    return this.tallesService.update(id, updateTalleDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar un talle (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID del talle', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Talle eliminado.' })
  @ApiResponse({ status: 404, description: 'Talle no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tallesService.remove(id);
  }
}
