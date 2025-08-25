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
import { TallesService } from './talles.service';
import { CreateTalleDto } from './dto/create-talle.dto';
import { UpdateTalleDto } from './dto/update-talle.dto';

@ApiTags('talles')
@Controller('talles')
export class TallesController {
  constructor(private readonly tallesService: TallesService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo talle para productos',
    description:
      'Registra un nuevo talle disponible para las variantes de productos de vestimenta. Los talles permiten categorizar productos por tamaño. Soporta diferentes sistemas de tallaje: letras (XS, S, M, L, XL), números (36, 38, 40) o medidas específicas.',
  })
  @ApiBody({
    type: CreateTalleDto,
    description: 'Información del talle a registrar',
    examples: {
      talleLetra: {
        summary: 'Talle con letras',
        value: {
          nombre_talle: 'M',
          descripcion: 'Mediano - Pecho: 96-101cm, Cintura: 81-86cm',
          categoria_talle: 'letras',
        },
      },
      talleNumero: {
        summary: 'Talle numérico',
        value: {
          nombre_talle: '40',
          descripcion: 'Talle 40 - Corresponde a L en letras',
          categoria_talle: 'numeros',
        },
      },
      talleInfantil: {
        summary: 'Talle infantil',
        value: {
          nombre_talle: '8 años',
          descripcion: 'Para niños de 8 años - Altura: 125-130cm',
          categoria_talle: 'infantil',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Talle creado exitosamente y disponible para usar en variantes de productos.',
    schema: {
      example: {
        id: 1,
        nombre_talle: 'M',
        descripcion: 'Mediano - Pecho: 96-101cm, Cintura: 81-86cm',
        categoria_talle: 'letras',
        creado_en: '2025-08-24T10:30:00.000Z',
        actualizado_en: '2025-08-24T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o talle duplicado.',
    schema: {
      example: {
        message: ['El talle "M" ya existe en el sistema'],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  create(@Body() createTalleDto: CreateTalleDto) {
    return this.tallesService.create(createTalleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los talles' })
  @ApiResponse({ status: 200, description: 'Lista de talles.' })
  findAll() {
    return this.tallesService.findAll();
  }

  @Get(':id')
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
  @ApiOperation({ summary: 'Actualizar un talle' })
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
  @ApiOperation({ summary: 'Eliminar un talle' })
  @ApiParam({ name: 'id', description: 'ID del talle', type: 'integer' })
  @ApiResponse({ status: 200, description: 'Talle eliminado.' })
  @ApiResponse({ status: 404, description: 'Talle no encontrado.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tallesService.remove(id);
  }
}
