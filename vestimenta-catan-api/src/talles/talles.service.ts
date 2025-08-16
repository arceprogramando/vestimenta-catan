import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTalleDto } from './dto/create-talle.dto';
import { UpdateTalleDto } from './dto/update-talle.dto';

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

  async findAll() {
    const talles = await this.prisma.talles.findMany({
      orderBy: { nombre_talle: 'asc' },
    });

    return talles.map((talle) => ({
      ...talle,
      id: Number(talle.id),
    }));
  }

  async findOne(id: number) {
    const talle = await this.prisma.talles.findUnique({
      where: { id: BigInt(id) },
      include: {
        producto_variantes: {
          include: {
            productos: true,
            colores: true,
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
        colores: { ...pv.colores, id: Number(pv.colores.id) },
      })),
    };
  }

  async update(id: number, updateTalleDto: UpdateTalleDto) {
    const talle = await this.prisma.talles.update({
      where: { id: BigInt(id) },
      data: updateTalleDto,
    });

    return {
      ...talle,
      id: Number(talle.id),
    };
  }

  async remove(id: number) {
    const talle = await this.prisma.talles.delete({
      where: { id: BigInt(id) },
    });

    return {
      ...talle,
      id: Number(talle.id),
    };
  }
}
