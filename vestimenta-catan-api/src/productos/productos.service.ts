import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';

interface StockResumenItem {
  id: number;
  nombre: string;
  genero: string;
  descripcion: string;
  thumbnail: string;
  stock_total: bigint;
}

// DTO para eliminación lógica
export interface SoftDeleteDto {
  deleted_by?: string;
  delete_reason?: string;
}

@Injectable()
export class ProductosService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductoDto: CreateProductoDto) {
    return this.prisma.productos.create({
      data: createProductoDto,
    });
  }

  // Modificado: Solo mostrar productos activos por defecto
  async findAll(includeDeleted = false) {
    const productos = await this.prisma.productos.findMany({
      where: includeDeleted ? undefined : { is_active: true },
      orderBy: { nombre: 'asc' },
    });

    return productos;
  }

  // Nuevo: Método para obtener productos eliminados
  async findDeleted() {
    return this.prisma.productos.findMany({
      where: { is_active: false },
      orderBy: { deleted_at: 'desc' },
    });
  }

  async findStockResumen() {
    const stockResumen = await this.prisma.$queryRaw<StockResumenItem[]>`
      SELECT
        p.id,
        p.nombre,
        p.genero,
        p.descripcion,
        p.thumbnail,
        COALESCE(SUM(pv.cantidad), 0) as stock_total
      FROM productos p
      LEFT JOIN producto_variantes pv ON p.id = pv.producto_id AND pv.is_active = true
      WHERE p.is_active = true
      GROUP BY p.id, p.nombre, p.genero, p.descripcion, p.thumbnail
      ORDER BY stock_total DESC
    `;

    // Convertir BigInt a Number para la serialización JSON
    return stockResumen.map((item) => ({
      ...item,
      stock_total: Number(item.stock_total),
    }));
  }

  // Modificado: Solo buscar entre productos activos por defecto
  async findOne(id: number, includeDeleted = false) {
    const producto = await this.prisma.productos.findUnique({
      where: {
        id,
        ...(includeDeleted ? {} : { is_active: true }),
      },
      include: {
        producto_variantes: {
          where: { is_active: true },
          include: {
            color: true,
            talle: true,
          },
          orderBy: [{ talle: { orden: 'asc' } }, { color: { nombre: 'asc' } }],
        },
      },
    });

    if (!producto) return null;

    // Serializar BigInt a Number
    return {
      ...producto,
      producto_variantes: producto.producto_variantes.map((v) => ({
        ...v,
        id: Number(v.id),
        color_id: Number(v.color_id),
        talle_id: v.talle_id ? Number(v.talle_id) : null,
        color: v.color ? { ...v.color, id: Number(v.color.id) } : null,
        talle: v.talle ? { ...v.talle, id: Number(v.talle.id) } : null,
      })),
    };
  }

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    // Verificar que el producto esté activo antes de actualizar
    const producto = await this.findOne(id);
    if (!producto) {
      throw new NotFoundException('Producto no encontrado o fue eliminado');
    }

    return this.prisma.productos.update({
      where: { id },
      data: {
        ...updateProductoDto,
        updated_at: new Date(),
      },
    });
  }

  // Nuevo: Eliminación lógica
  async remove(id: number, softDeleteDto?: SoftDeleteDto) {
    // Verificar que el producto existe y está activo
    const producto = await this.findOne(id);
    if (!producto) {
      throw new NotFoundException('Producto no encontrado o ya fue eliminado');
    }

    // Realizar eliminación lógica en transacción
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Marcar producto como eliminado
      const deletedProduct = await tx.productos.update({
        where: { id },
        data: {
          is_active: false,
          deleted_at: new Date(),
          deleted_by: softDeleteDto?.deleted_by,
          delete_reason: softDeleteDto?.delete_reason,
          updated_at: new Date(),
        },
      });

      // 2. Marcar variantes como eliminadas
      await tx.producto_variantes.updateMany({
        where: {
          producto_id: id,
          is_active: true,
        },
        data: {
          is_active: false,
          deleted_at: new Date(),
          deleted_by: softDeleteDto?.deleted_by,
          delete_reason: `Producto padre eliminado: ${softDeleteDto?.delete_reason || 'Sin razón especificada'}`,
          updated_at: new Date(),
        },
      });

      // 3. Marcar reservas asociadas a las variantes del producto como eliminadas
      const varianteIds = await tx.producto_variantes.findMany({
        where: { producto_id: id },
        select: { id: true },
      });

      if (varianteIds.length > 0) {
        await tx.reservas.updateMany({
          where: {
            variante_id: { in: varianteIds.map((v) => v.id) },
            is_active: true,
          },
          data: {
            is_active: false,
            deleted_at: new Date(),
            deleted_by: softDeleteDto?.deleted_by,
            delete_reason: `Producto eliminado: ${softDeleteDto?.delete_reason || 'Sin razón especificada'}`,
            updated_at: new Date(),
          },
        });
      }

      return deletedProduct;
    });

    return result;
  }

  // Nuevo: Restaurar producto eliminado
  async restore(id: number) {
    const producto = await this.prisma.productos.findUnique({
      where: { id },
    });

    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    if (producto.is_active) {
      throw new Error('El producto no está eliminado');
    }

    return this.prisma.productos.update({
      where: { id },
      data: {
        is_active: true,
        deleted_at: null,
        deleted_by: null,
        delete_reason: null,
        updated_at: new Date(),
      },
    });
  }

  // Nuevo: Auditoría de cambios
  async getAuditLog(id: number) {
    const producto = await this.prisma.productos.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        is_active: true,
        deleted_by: true,
        delete_reason: true,
      },
    });

    return producto;
  }
}
