import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, genero } from '@prisma/client';
import { CreateProductoVarianteDto } from './dto/create-producto-variante.dto';
import { UpdateProductoVarianteDto } from './dto/update-producto-variante.dto';
import { SoftDeleteDto } from '../common/interfaces';
import { PaginatedResponse, createPaginatedResponse } from '../common/dto';

// Interface para la variante con relaciones
interface VarianteWithRelations {
  id: bigint;
  producto_id: number;
  color_id: bigint;
  talle_id: bigint | null;
  cantidad: number;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  producto?: {
    id: number;
    nombre: string;
    descripcion: string | null;
    genero: string;
    thumbnail: string | null;
  } | null;
  color?: {
    id: bigint;
    nombre: string;
  } | null;
  talle?: {
    id: bigint;
    nombre: string;
    orden: number | null;
  } | null;
}

@Injectable()
export class ProductoVariantesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductoVarianteDto: CreateProductoVarianteDto) {
    const variante = await this.prisma.producto_variantes.create({
      data: {
        producto_id: createProductoVarianteDto.producto_id,
        talle_id: createProductoVarianteDto.talle_id
          ? BigInt(createProductoVarianteDto.talle_id)
          : null,
        color_id: BigInt(createProductoVarianteDto.color_id),
        cantidad: createProductoVarianteDto.cantidad || 0,
      },
      include: {
        producto: true,
        color: true,
        talle: true,
      },
    });

    return this.serializeVariante(variante);
  }

  async findAll(includeDeleted = false) {
    const variantes = await this.prisma.producto_variantes.findMany({
      where: includeDeleted ? undefined : { is_active: true },
      include: {
        producto: true,
        color: true,
        talle: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return variantes.map((variante) => this.serializeVariante(variante));
  }

  async findAllPaginated(params: {
    limit?: number;
    offset?: number;
    search?: string;
    genero?: genero;
    productoId?: number;
    colorId?: number;
    talleId?: number;
    stockBajo?: number;
    includeDeleted?: boolean;
  }): Promise<PaginatedResponse<ReturnType<typeof this.serializeVariante>>> {
    const {
      limit = 20,
      offset = 0,
      search,
      genero: generoFilter,
      productoId,
      colorId,
      talleId,
      stockBajo,
      includeDeleted = false,
    } = params;

    const where: Prisma.producto_variantesWhereInput = {
      ...(includeDeleted ? {} : { is_active: true }),
      ...(productoId && { producto_id: productoId }),
      ...(colorId && { color_id: BigInt(colorId) }),
      ...(talleId && { talle_id: BigInt(talleId) }),
      ...(stockBajo !== undefined && { cantidad: { lte: stockBajo } }),
      ...(generoFilter && { producto: { genero: generoFilter } }),
      ...(search && {
        OR: [
          {
            producto: {
              nombre: { contains: search, mode: Prisma.QueryMode.insensitive },
            },
          },
          {
            color: {
              nombre: { contains: search, mode: Prisma.QueryMode.insensitive },
            },
          },
          {
            talle: {
              nombre: { contains: search, mode: Prisma.QueryMode.insensitive },
            },
          },
        ],
      }),
    };

    const [variantes, total] = await Promise.all([
      this.prisma.producto_variantes.findMany({
        where,
        include: {
          producto: true,
          color: true,
          talle: true,
        },
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.producto_variantes.count({ where }),
    ]);

    const data = variantes.map((variante) => this.serializeVariante(variante));
    return createPaginatedResponse(data, total, limit, offset);
  }

  async findByProducto(productoId: number) {
    const variantes = await this.prisma.producto_variantes.findMany({
      where: {
        producto_id: productoId,
        is_active: true,
      },
      include: {
        color: true,
        talle: true,
      },
      orderBy: [{ talle: { orden: 'asc' } }, { color: { nombre: 'asc' } }],
    });

    return variantes.map((variante) => this.serializeVariante(variante));
  }

  async findOne(id: number, includeDeleted = false) {
    const variante = await this.prisma.producto_variantes.findUnique({
      where: {
        id: BigInt(id),
        ...(includeDeleted ? {} : { is_active: true }),
      },
      include: {
        producto: true,
        color: true,
        talle: true,
      },
    });

    if (!variante) return null;

    return this.serializeVariante(variante);
  }

  async update(
    id: number,
    updateProductoVarianteDto: UpdateProductoVarianteDto,
  ) {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Variante no encontrada o fue eliminada');
    }

    const variante = await this.prisma.producto_variantes.update({
      where: { id: BigInt(id) },
      data: {
        ...(updateProductoVarianteDto.producto_id && {
          producto_id: updateProductoVarianteDto.producto_id,
        }),
        ...(updateProductoVarianteDto.talle_id !== undefined && {
          talle_id: updateProductoVarianteDto.talle_id
            ? BigInt(updateProductoVarianteDto.talle_id)
            : null,
        }),
        ...(updateProductoVarianteDto.color_id && {
          color_id: BigInt(updateProductoVarianteDto.color_id),
        }),
        ...(updateProductoVarianteDto.cantidad !== undefined && {
          cantidad: updateProductoVarianteDto.cantidad,
        }),
        updated_at: new Date(),
      },
      include: {
        producto: true,
        color: true,
        talle: true,
      },
    });

    return this.serializeVariante(variante);
  }

  // Actualizar stock
  async updateStock(id: number, cantidad: number) {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Variante no encontrada o fue eliminada');
    }

    const variante = await this.prisma.producto_variantes.update({
      where: { id: BigInt(id) },
      data: {
        cantidad,
        updated_at: new Date(),
      },
    });

    return {
      ...variante,
      id: Number(variante.id),
      talle_id: variante.talle_id ? Number(variante.talle_id) : null,
      color_id: Number(variante.color_id),
    };
  }

  // Eliminación lógica
  async remove(id: number, softDeleteDto?: SoftDeleteDto) {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Variante no encontrada o ya fue eliminada');
    }

    const variante = await this.prisma.producto_variantes.update({
      where: { id: BigInt(id) },
      data: {
        is_active: false,
        deleted_at: new Date(),
        deleted_by: softDeleteDto?.deleted_by,
        delete_reason: softDeleteDto?.delete_reason,
        updated_at: new Date(),
      },
    });

    return {
      ...variante,
      id: Number(variante.id),
      color_id: Number(variante.color_id),
      talle_id: variante.talle_id ? Number(variante.talle_id) : null,
    };
  }

  // Restaurar variante eliminada
  async restore(id: number) {
    const variante = await this.prisma.producto_variantes.findUnique({
      where: { id: BigInt(id) },
    });

    if (!variante) {
      throw new NotFoundException('Variante no encontrada');
    }

    if (variante.is_active) {
      throw new BadRequestException('La variante no está eliminada');
    }

    const restored = await this.prisma.producto_variantes.update({
      where: { id: BigInt(id) },
      data: {
        is_active: true,
        deleted_at: null,
        deleted_by: null,
        delete_reason: null,
        updated_at: new Date(),
      },
      include: {
        producto: true,
        color: true,
        talle: true,
      },
    });

    return this.serializeVariante(restored);
  }

  // Helper para serializar BigInt a Number
  private serializeVariante(variante: VarianteWithRelations) {
    return {
      id: Number(variante.id),
      producto_id: variante.producto_id,
      color_id: Number(variante.color_id),
      talle_id: variante.talle_id ? Number(variante.talle_id) : null,
      cantidad: variante.cantidad,
      is_active: variante.is_active,
      created_at: variante.created_at,
      updated_at: variante.updated_at,
      producto: variante.producto ?? null,
      color: variante.color
        ? {
            id: Number(variante.color.id),
            nombre: variante.color.nombre,
          }
        : null,
      talle: variante.talle
        ? {
            id: Number(variante.talle.id),
            nombre: variante.talle.nombre,
            orden: variante.talle.orden,
          }
        : null,
    };
  }
}
