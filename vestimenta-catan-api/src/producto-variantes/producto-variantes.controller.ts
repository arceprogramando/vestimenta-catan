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
import { ProductoVariantesService } from './producto-variantes.service';
import { CreateProductoVarianteDto } from './dto/create-producto-variante.dto';
import { UpdateProductoVarianteDto } from './dto/update-producto-variante.dto';

@ApiTags('producto-variantes')
@ApiBearerAuth()
@Controller('producto-variantes')
export class ProductoVariantesController {
  constructor(
    private readonly productoVariantesService: ProductoVariantesService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear una nueva variante de producto (solo admin)' })
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
  @Public()
  @ApiOperation({
    summary: 'Obtener todas las variantes de productos (Stock detallado)',
    description:
      'Retorna las variantes de productos con stock específico por talle y color.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista completa de variantes con stock detallado.',
  })
  findAll() {
    return this.productoVariantesService.findAll();
  }

  @Get(':id')
  @Public()
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
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar una variante de producto (solo admin)' })
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
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar una variante de producto (solo admin)' })
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
