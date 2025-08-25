import { Injectable } from '@nestjs/common';
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

  // Solo mostrar productos activos por defecto - SIN SOFT DELETE TEMPORALMENTE
  async findAll() {
    const productos = await this.prisma.productos.findMany({
      orderBy: { nombre: 'asc' },
    });

    return productos;
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
      FROM inventario.productos p 
      LEFT JOIN inventario.producto_variantes pv ON p.id = pv.producto_id
      GROUP BY p.id, p.nombre, p.genero, p.descripcion, p.thumbnail
      ORDER BY stock_total DESC
    `;

    // Convertir BigInt a Number para la serialización JSON
    return stockResumen.map((item) => ({
      ...item,
      stock_total: Number(item.stock_total),
    }));
  }

  async findOne(id: number) {
    const producto = await this.prisma.productos.findUnique({
      where: { id },
    });

    return producto;
  }

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    const producto = await this.findOne(id);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    return this.prisma.productos.update({
      where: { id },
      data: {
        ...updateProductoDto,
        updated_at: new Date(),
      },
    });
  }

  // Eliminación física temporal hasta regenerar cliente Prisma
  async remove(id: number) {
    const producto = await this.findOne(id);
    if (!producto) {
      throw new Error('Producto no encontrado');
    }

    return this.prisma.productos.delete({
      where: { id },
    });
  }

  // Auditoría básica
  async getAuditLog(id: number) {
    const producto = await this.prisma.productos.findUnique({
      where: { id },
      select: {
        id: true,
        nombre: true,
        created_at: true,
        updated_at: true,
      },
    });

    return producto;
  }
}
