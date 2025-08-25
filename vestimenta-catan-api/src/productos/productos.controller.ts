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
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

@ApiTags('productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post()
  @ApiOperation({
    summary: 'Crear un nuevo producto de vestimenta',
    description:
      'Permite registrar un nuevo producto en el inventario de vestimenta. Incluye información como nombre, descripción, género target, categoría y precio. El producto creado podrá tener variantes con diferentes talles y colores.',
  })
  @ApiBody({
    type: CreateProductoDto,
    description:
      'Datos necesarios para crear un producto. Todos los campos son requeridos.',
    examples: {
      ejemplo1: {
        summary: 'Camiseta básica',
        value: {
          nombre: 'Camiseta Básica Algodón',
          descripcion:
            'Camiseta 100% algodón, corte regular, ideal para uso diario',
          genero: 'unisex',
          categoria: 'camisetas',
          precio: 25.99,
        },
      },
      ejemplo2: {
        summary: 'Pantalón formal',
        value: {
          nombre: 'Pantalón de Vestir Slim',
          descripcion:
            'Pantalón de vestir con corte slim fit, tela premium con elastano',
          genero: 'masculino',
          categoria: 'pantalones',
          precio: 89.99,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Producto creado exitosamente. Retorna el producto con su ID asignado.',
    schema: {
      example: {
        id: 1,
        nombre: 'Camiseta Básica Algodón',
        descripcion:
          'Camiseta 100% algodón, corte regular, ideal para uso diario',
        genero: 'unisex',
        categoria: 'camisetas',
        precio: 25.99,
        creado_en: '2025-08-24T10:30:00.000Z',
        actualizado_en: '2025-08-24T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos proporcionados. Verificar campos requeridos y formatos.',
    schema: {
      example: {
        message: [
          'nombre should not be empty',
          'precio must be a positive number',
        ],
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  create(@Body() createProductoDto: CreateProductoDto) {
    return this.productosService.create(createProductoDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Obtener todos los productos base del inventario',
    description:
      'Retorna la lista de productos BASE registrados en el sistema (5 productos actualmente). Estos son los productos principales sin variantes. Para ver el stock detallado por talle y color, usar el endpoint /api/producto-variantes. Para ver el stock total agregado, usar /api/productos/stock-resumen.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista de productos base obtenida exitosamente. Total actual: 5 productos con 233 unidades totales en stock.',
    schema: {
      type: 'array',
      example: [
        {
          id: 1,
          nombre: 'remera térmica',
          descripcion: 'Remera térmica para mujer.',
          genero: 'mujer',
          thumbnail: '/images/products/remera-termica-mujer-1.jpeg',
          created_at: '2025-08-16T04:21:58.219Z',
          updated_at: '2025-08-16T04:21:58.219Z',
        },
        {
          id: 2,
          nombre: 'remera térmica',
          descripcion: 'Remera térmica para hombre.',
          genero: 'hombre',
          thumbnail: '/images/products/remera-termica-hombre-1.jpeg',
          created_at: '2025-08-16T04:21:58.219Z',
          updated_at: '2025-08-16T04:21:58.219Z',
        },
      ],
    },
  })
  findAll() {
    return this.productosService.findAll();
  }

  @Get('stock-resumen')
  @ApiOperation({
    summary: 'Obtener resumen de stock total por producto',
    description:
      'Retorna cada producto con su stock total sumando todas las variantes (talle + color). Esta consulta muestra las 233 unidades totales distribuidas entre los 5 productos. Útil para reportes de inventario y análisis de stock disponible.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Resumen de stock obtenido exitosamente. Muestra productos ordenados por stock total descendente.',
    schema: {
      type: 'array',
      example: [
        {
          id: 3,
          nombre: 'remera térmica',
          genero: 'niños unisex',
          descripcion: 'Remera térmica niños/unisex.',
          thumbnail: '/images/products/remera-termica-ninios-1.jpeg',
          stock_total: 96,
        },
        {
          id: 2,
          nombre: 'remera térmica',
          genero: 'hombre',
          descripcion: 'Remera térmica para hombre.',
          thumbnail: '/images/products/remera-termica-hombre-1.jpeg',
          stock_total: 62,
        },
        {
          id: 1,
          nombre: 'remera térmica',
          genero: 'mujer',
          descripcion: 'Remera térmica para mujer.',
          thumbnail: '/images/products/remera-termica-mujer-1.jpeg',
          stock_total: 48,
        },
        {
          id: 4,
          nombre: 'calza térmica',
          genero: 'hombre',
          descripcion: 'Calza térmica para hombre.',
          thumbnail: '/images/products/calza-termica-hombre-1.png',
          stock_total: 20,
        },
        {
          id: 5,
          nombre: 'calza térmica',
          genero: 'mujer',
          descripcion: 'Calza térmica para mujer.',
          thumbnail: '/images/products/calza-termica-hombre-1.png',
          stock_total: 7,
        },
      ],
    },
  })
  findStockResumen() {
    return this.productosService.findStockResumen();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener un producto específico por su ID',
    description:
      'Busca y retorna un producto específico basado en su ID único. Útil para mostrar detalles completos de un producto, editar información o verificar disponibilidad antes de crear variantes.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del producto a buscar',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Producto encontrado exitosamente con todos sus detalles.',
    schema: {
      example: {
        id: 1,
        nombre: 'Camiseta Básica Algodón',
        descripcion:
          'Camiseta 100% algodón, corte regular, ideal para uso diario',
        genero: 'unisex',
        categoria: 'camisetas',
        precio: 25.99,
        creado_en: '2025-08-24T10:30:00.000Z',
        actualizado_en: '2025-08-24T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No existe un producto con el ID proporcionado.',
    schema: {
      example: {
        message: 'Producto con ID 999 no encontrado',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const producto = await this.productosService.findOne(id);
    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }
    return producto;
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar información de un producto existente',
    description:
      'Permite modificar parcialmente los datos de un producto existente. Solo se actualizarán los campos proporcionados en el body. Útil para cambiar precios, descripciones, categorías o cualquier otro atributo del producto.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del producto a actualizar',
    type: 'integer',
    example: 1,
  })
  @ApiBody({
    type: UpdateProductoDto,
    description:
      'Datos a actualizar del producto. Todos los campos son opcionales.',
    examples: {
      actualizarPrecio: {
        summary: 'Actualizar solo el precio',
        value: {
          precio: 29.99,
        },
      },
      actualizarDescripcion: {
        summary: 'Actualizar descripción y categoría',
        value: {
          descripcion: 'Camiseta premium 100% algodón orgánico, corte regular',
          categoria: 'camisetas-premium',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Producto actualizado exitosamente con los nuevos datos.',
    schema: {
      example: {
        id: 1,
        nombre: 'Camiseta Básica Algodón',
        descripcion: 'Camiseta premium 100% algodón orgánico, corte regular',
        genero: 'unisex',
        categoria: 'camisetas-premium',
        precio: 29.99,
        creado_en: '2025-08-24T10:30:00.000Z',
        actualizado_en: '2025-08-24T15:45:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No existe un producto con el ID proporcionado.',
    schema: {
      example: {
        message: 'Producto con ID 999 no encontrado',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProductoDto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, updateProductoDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar un producto del inventario',
    description:
      'Elimina permanentemente un producto del sistema. ADVERTENCIA: Esta acción también eliminará todas las variantes de producto y reservas asociadas. Use con precaución ya que esta operación no es reversible.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador único del producto a eliminar',
    type: 'integer',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description:
      'Producto eliminado exitosamente junto con todas sus variantes y reservas.',
    schema: {
      example: {
        message: 'Producto con ID 1 eliminado exitosamente',
        deletedProduct: {
          id: 1,
          nombre: 'Camiseta Básica Algodón',
          categoria: 'camisetas',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No existe un producto con el ID proporcionado.',
    schema: {
      example: {
        message: 'Producto con ID 999 no encontrado',
        error: 'Not Found',
        statusCode: 404,
      },
    },
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.remove(id);
  }
}
