import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTalleDto } from './dto/create-talle.dto';
import { UpdateTalleDto } from './dto/update-talle.dto';

// DTO para eliminación lógica
export interface SoftDeleteDto {
  deleted_by?: string;
  delete_reason?: string;
}

@Injectable()
export class TallesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTalleDto: CreateTalleDto) {
    const talle = await this.prisma.talles.create({
      data: createTalleDto,
    });

    return {
      ...talle,
      id: Number(talle.id),
    };
  }

  async findAll(includeDeleted = false) {
    const talles = await this.prisma.talles.findMany({
      where: includeDeleted ? undefined : { is_active: true },
      orderBy: [{ orden: 'asc' }, { nombre: 'asc' }],
    });

    return talles.map((talle) => ({
      ...talle,
      id: Number(talle.id),
    }));
  }

  async findOne(id: number, includeDeleted = false) {
    const talle = await this.prisma.talles.findUnique({
      where: {
        id: BigInt(id),
        ...(includeDeleted ? {} : { is_active: true }),
      },
      include: {
        producto_variantes: {
          where: { is_active: true },
          include: {
            producto: true,
            color: true,
          },
        },
      },
    });

    if (!talle) return null;

    return {
      ...talle,
      id: Number(talle.id),
      producto_variantes: talle.producto_variantes.map((pv) => ({
        ...pv,
        id: Number(pv.id),
        color_id: Number(pv.color_id),
        talle_id: pv.talle_id ? Number(pv.talle_id) : null,
        color: pv.color ? { ...pv.color, id: Number(pv.color.id) } : null,
      })),
    };
  }

  async update(id: number, updateTalleDto: UpdateTalleDto) {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Talle no encontrado o fue eliminado');
    }

    const talle = await this.prisma.talles.update({
      where: { id: BigInt(id) },
      data: {
        ...updateTalleDto,
        updated_at: new Date(),
      },
    });

    return {
      ...talle,
      id: Number(talle.id),
    };
  }

  // Eliminación lógica
  async remove(id: number, softDeleteDto?: SoftDeleteDto) {
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Talle no encontrado o ya fue eliminado');
    }

    const talle = await this.prisma.talles.update({
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
      ...talle,
      id: Number(talle.id),
    };
  }

  // Restaurar talle eliminado
  async restore(id: number) {
    const talle = await this.prisma.talles.findUnique({
      where: { id: BigInt(id) },
    });

    if (!talle) {
      throw new NotFoundException('Talle no encontrado');
    }

    if (talle.is_active) {
      throw new BadRequestException('El talle no está eliminado');
    }

    const restored = await this.prisma.talles.update({
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
