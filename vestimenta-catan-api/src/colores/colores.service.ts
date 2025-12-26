import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';
import { SoftDeleteDto } from '../common/interfaces';

@Injectable()
export class ColoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createColorDto: CreateColorDto) {
    const color = await this.prisma.colores.create({
      data: createColorDto,
    });

    return {
      ...color,
      id: Number(color.id),
    };
  }

  async findAll(includeDeleted = false) {
    const colores = await this.prisma.colores.findMany({
      where: includeDeleted ? undefined : { is_active: true },
      orderBy: { nombre: 'asc' },
    });

    return colores.map((color) => ({
      ...color,
      id: Number(color.id),
    }));
  }

  async findOne(id: number, includeDeleted = false) {
    const color = await this.prisma.colores.findUnique({
      where: {
        id: BigInt(id),
        ...(includeDeleted ? {} : { is_active: true }),
      },
      include: {
        producto_variantes: {
          where: { is_active: true },
          include: {
            producto: true,
            talle: true,
          },
        },
      },
    });

    if (!color) return null;

    return {
      ...color,
      id: Number(color.id),
      producto_variantes: color.producto_variantes.map((pv) => ({
        ...pv,
        id: Number(pv.id),
        color_id: Number(pv.color_id),
        talle_id: pv.talle_id ? Number(pv.talle_id) : null,
        talle: pv.talle ? { ...pv.talle, id: Number(pv.talle.id) } : null,
      })),
    };
  }

  async update(id: number, updateColorDto: UpdateColorDto) {
    const existingColor = await this.findOne(id);
    if (!existingColor) {
      throw new NotFoundException('Color no encontrado o fue eliminado');
    }

    const color = await this.prisma.colores.update({
      where: { id: BigInt(id) },
      data: {
        ...updateColorDto,
        updated_at: new Date(),
      },
    });

    return {
      ...color,
      id: Number(color.id),
    };
  }

  // Eliminación lógica
  async remove(id: number, softDeleteDto?: SoftDeleteDto) {
    const existingColor = await this.findOne(id);
    if (!existingColor) {
      throw new NotFoundException('Color no encontrado o ya fue eliminado');
    }

    const color = await this.prisma.colores.update({
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
      ...color,
      id: Number(color.id),
    };
  }

  // Restaurar color eliminado
  async restore(id: number) {
    const color = await this.prisma.colores.findUnique({
      where: { id: BigInt(id) },
    });

    if (!color) {
      throw new NotFoundException('Color no encontrado');
    }

    if (color.is_active) {
      throw new Error('El color no está eliminado');
    }

    const restored = await this.prisma.colores.update({
      where: { id: BigInt(id) },
      data: {
        is_active: true,
        deleted_at: null,
        deleted_by: null,
        delete_reason: null,
        updated_at: new Date(),
      },
    });

    return {
      ...restored,
      id: Number(restored.id),
    };
  }
}
