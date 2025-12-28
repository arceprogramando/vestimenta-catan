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
import { Public } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductoVariantesService } from './producto-variantes.service';
import { PaginationQueryDto } from '../common/dto';
import { CreateProductoVarianteDto } from './dto/create-producto-variante.dto';
import { UpdateProductoVarianteDto } from './dto/update-producto-variante.dto';
import { genero } from '@prisma/client';

@ApiTags('producto-variantes')
@ApiBearerAuth()
@Controller('producto-variantes')
export class ProductoVariantesController {
  constructor(
    private readonly productoVariantesService: ProductoVariantesService,
  ) {}

  @Post()
  @Roles('admin')
  @ApiOperation({
    summary: 'Crear una nueva variante de producto (solo admin)',
  })
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
    summary: 'Obtener variantes de productos paginadas (Stock detallado)',
    description:
      'Retorna las variantes de productos con stock específico por talle y color, con paginación y búsqueda.',
  })
  @ApiQuery({
    name: 'genero',
    required: false,
    enum: ['mujer', 'hombre', 'ninios'],
    description: 'Filtrar por género del producto',
  })
  @ApiQuery({
    name: 'productoId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de producto',
  })
  @ApiQuery({
    name: 'colorId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de color',
  })
  @ApiQuery({
    name: 'talleId',
    required: false,
    type: Number,
    description: 'Filtrar por ID de talle',
  })
  @ApiQuery({
    name: 'stockBajo',
    required: false,
    type: Number,
    description: 'Filtrar variantes con stock menor o igual a este valor',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista paginada de variantes con stock detallado.',
  })
  findAll(
    @Query() pagination: PaginationQueryDto,
    @Query('genero') generoFilter?: genero,
    @Query('productoId', new ParseIntPipe({ optional: true }))
    productoId?: number,
    @Query('colorId', new ParseIntPipe({ optional: true })) colorId?: number,
    @Query('talleId', new ParseIntPipe({ optional: true })) talleId?: number,
    @Query('stockBajo', new ParseIntPipe({ optional: true }))
    stockBajo?: number,
  ) {
    return this.productoVariantesService.findAllPaginated({
      ...pagination,
      genero: generoFilter,
      productoId,
      colorId,
      talleId,
      stockBajo,
    });
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
