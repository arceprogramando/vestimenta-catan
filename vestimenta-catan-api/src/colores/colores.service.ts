import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateColorDto } from './dto/create-color.dto';
import { UpdateColorDto } from './dto/update-color.dto';

@Injectable()
export class ColoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createColorDto: CreateColorDto) {
    const color = await this.prisma.colores.create({
      data: createColorDto,
    });

    // Convertir BigInt a number para serialización JSON
    return {
      ...color,
      id: Number(color.id),
    };
  }

  async findAll() {
    const colores = await this.prisma.colores.findMany({
      orderBy: { nombre: 'asc' },
    });

    // Convertir BigInt a number para serialización JSON
    return colores.map((color) => ({
      ...color,
      id: Number(color.id),
    }));
  }

  async findOne(id: number) {
    const color = await this.prisma.colores.findUnique({
      where: { id: BigInt(id) },
      include: {
        producto_variantes: {
          include: {
            productos: true,
            talles: true,
          },
        },
      },
    });

    if (!color) return null;

    // Convertir BigInt a number para serialización JSON
    return {
      ...color,
      id: Number(color.id),
      producto_variantes: color.producto_variantes.map((pv) => ({
        ...pv,
        id: Number(pv.id),
        color_id: Number(pv.color_id),
        talle_id: pv.talle_id ? Number(pv.talle_id) : null,
        talles: pv.talles ? { ...pv.talles, id: Number(pv.talles.id) } : null,
      })),
    };
  }

  async update(id: number, updateColorDto: UpdateColorDto) {
    // Primero verificamos si el color existe
    const existingColor = await this.prisma.colores.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingColor) {
      return null; // El controlador manejará el 404
    }

    const color = await this.prisma.colores.update({
      where: { id: BigInt(id) },
      data: updateColorDto,
    });

    // Convertir BigInt a number para serialización JSON
    return {
      ...color,
      id: Number(color.id),
    };
  }

  async remove(id: number) {
    // Primero verificamos si el color existe
    const existingColor = await this.prisma.colores.findUnique({
      where: { id: BigInt(id) },
    });

    if (!existingColor) {
      return null; // El controlador manejará el 404
    }

    const color = await this.prisma.colores.delete({
      where: { id: BigInt(id) },
    });

    // Convertir BigInt a number para serialización JSON
    return {
      ...color,
      id: Number(color.id),
    };
  }
}
