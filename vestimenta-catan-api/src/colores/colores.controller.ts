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
import { ColoresService } from './colores.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@ApiTags('colores')
@ApiBearerAuth()
@Controller('colores')
export class ColoresController {
  constructor(private readonly coloresService: ColoresService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({
    summary: 'Crear un nuevo color para productos (solo admin)',
    description:
      'Registra un nuevo color disponible para las variantes de productos. Los colores se usan para categorizar y diferenciar las variantes de un mismo producto. Ejemplos: Rojo, Azul marino, Verde oliva, etc.',
  })
  @ApiBody({
    type: CreateColorDto,
    description: 'Información del color a registrar',
    examples: {
      colorBasico: {
        summary: 'Color básico',
        value: {
          nombre: 'Azul marino',
          codigo_hex: '#1E3A8A',
        },
      },
      colorVibrante: {
        summary: 'Color vibrante',
        value: {
          nombre: 'Rojo cereza',
          codigo_hex: '#DC2626',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Color creado exitosamente y disponible para usar en variantes.',
    schema: {
      example: {
        id: 1,
        nombre: 'Azul marino',
        codigo_hex: '#1E3A8A',
        creado_en: '2025-08-24T10:30:00.000Z',
        actualizado_en: '2025-08-24T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o color duplicado.',
    schema: {
      example: {
        message: ['El color "Azul marino" ya existe en el sistema'],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  create(@Body() createColorDto: CreateColorDto) {
    return this.coloresService.create(createColorDto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Obtener todos los colores disponibles',
    description:
      'Retorna la lista completa de colores registrados en el sistema. Útil para mostrar opciones de colores al crear variantes de productos, en filtros de búsqueda, o en interfaces de selección de color.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista de colores obtenida exitosamente. Incluye nombre y código hexadecimal.',
    schema: {
      type: 'array',
      example: [
        {
          id: 1,
          nombre: 'Azul marino',
          codigo_hex: '#1E3A8A',
          creado_en: '2025-08-24T10:30:00.000Z',
          actualizado_en: '2025-08-24T10:30:00.000Z',
        },
        {
          id: 2,
          nombre: 'Rojo cereza',
          codigo_hex: '#DC2626',
          creado_en: '2025-08-24T11:00:00.000Z',
          actualizado_en: '2025-08-24T11:00:00.000Z',
        },
        {
          id: 3,
          nombre: 'Verde oliva',
          codigo_hex: '#84CC16',
          creado_en: '2025-08-24T11:30:00.000Z',
          actualizado_en: '2025-08-24T11:30:00.000Z',
        },
      ],
    },
  })
  findAll() {
    return this.coloresService.findAll();
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Obtener un color por ID' })
  @ApiParam({ name: 'id', description: 'ID del color', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Color encontrado.' })
  @ApiResponse({ status: 404, description: 'Color no encontrado.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const color = await this.coloresService.findOne(id);
    if (!color) {
      throw new NotFoundException(`Color con ID ${id} no encontrado`);
    }
    return color;
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar un color (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID del color', type: 'integer' })
  @ApiBody({ type: UpdateColorDto })
  @ApiResponse({ status: 200, description: 'Color actualizado.' })
  @ApiResponse({ status: 404, description: 'Color no encontrado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateColorDto: UpdateColorDto,
  ) {
    const result = await this.coloresService.update(id, updateColorDto);
    if (!result) {
      throw new NotFoundException(`Color con ID ${id} no encontrado`);
    }
    return result;
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar un color (solo admin)' })
  @ApiParam({ name: 'id', description: 'ID del color', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Color eliminado.' })
  @ApiResponse({ status: 404, description: 'Color no encontrado.' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.coloresService.remove(id);
    if (!result) {
      throw new NotFoundException(`Color con ID ${id} no encontrado`);
    }
    return result;
  }
}
