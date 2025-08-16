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
import { ProductoVariantesService } from './producto-variantes.service';
import { CreateProductoVarianteDto } from './dto/create-producto-variante.dto';
import { UpdateProductoVarianteDto } from './dto/update-producto-variante.dto';

@ApiTags('producto-variantes')
@Controller('producto-variantes')
export class ProductoVariantesController {
  constructor(
    private readonly productoVariantesService: ProductoVariantesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva variante de producto' })
  @ApiBody({ type: CreateProductoVarianteDto })
  @ApiResponse({
    status: 201,
    description: 'Variante de producto creada exitosamente.',
  })
  @ApiResponse({ status: 400, description: 'Datos inválidos.' })
  create(@Body() createProductoVarianteDto: CreateProductoVarianteDto) {
    return this.productoVariantesService.create(createProductoVarianteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las variantes de productos' })
  @ApiResponse({ status: 200, description: 'Lista de variantes de productos.' })
  findAll() {
    return this.productoVariantesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una variante de producto por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID de la variante de producto',
    type: 'integer',
  })
  @ApiResponse({ status: 200, description: 'Variante de producto encontrada.' })
  @ApiResponse({
    status: 404,
    description: 'Variante de producto no encontrada.',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const variante = await this.productoVariantesService.findOne(id);
    if (!variante) {
      throw new NotFoundException(
        `Producto variante con ID ${id} no encontrado`,
      );
    }
    return variante;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una variante de producto' })
  @ApiParam({
    name: 'id',
    description: 'ID de la variante de producto',
    type: 'integer',
  })
  @ApiBody({ type: UpdateProductoVarianteDto })
  @ApiResponse({
    status: 200,
    description: 'Variante de producto actualizada.',
  })
  @ApiResponse({
    status: 404,
    description: 'Variante de producto no encontrada.',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductoVarianteDto: UpdateProductoVarianteDto,
  ) {
    return this.productoVariantesService.update(id, updateProductoVarianteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una variante de producto' })
  @ApiParam({
    name: 'id',
    description: 'ID de la variante de producto',
    type: 'integer',
  })
  @ApiResponse({ status: 200, description: 'Variante de producto eliminada.' })
  @ApiResponse({
    status: 404,
    description: 'Variante de producto no encontrada.',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productoVariantesService.remove(id);
  }
}
