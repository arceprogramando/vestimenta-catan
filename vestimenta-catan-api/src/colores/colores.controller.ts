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
import { ColoresService } from './colores.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@ApiTags('colores')
@Controller('colores')
export class ColoresController {
  constructor(private readonly coloresService: ColoresService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo color' })
  @ApiBody({ type: CreateColorDto })
  @ApiResponse({ status: 201, description: 'Color creado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() createColorDto: CreateColorDto) {
    return this.coloresService.create(createColorDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los colores' })
  @ApiResponse({ status: 200, description: 'Lista de colores.' })
  findAll() {
    return this.coloresService.findAll();
  }

  @Get(':id')
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
  @ApiOperation({ summary: 'Actualizar un color' })
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
  @ApiOperation({ summary: 'Eliminar un color' })
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
