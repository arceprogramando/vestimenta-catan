import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductoVarianteDto } from './dto/create-producto-variante.dto';
import { UpdateProductoVarianteDto } from './dto/update-producto-variante.dto';

@Injectable()
export class ProductoVariantesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProductoVarianteDto: CreateProductoVarianteDto) {
    const variante = await this.prisma.producto_variantes.create({
      data: {
        ...createProductoVarianteDto,
        talle_id: createProductoVarianteDto.talle_id
          ? BigInt(createProductoVarianteDto.talle_id)
          : null,
        color_id: BigInt(createProductoVarianteDto.color_id),
      },
      include: {
        productos: true,
        colores: true,
        talles: true,
      },
    });

    return {
      ...variante,
      id: Number(variante.id),
      color_id: Number(variante.color_id),
      talle_id: variante.talle_id ? Number(variante.talle_id) : null,
      colores: { ...variante.colores, id: Number(variante.colores.id) },
      talles: variante.talles
        ? { ...variante.talles, id: Number(variante.talles.id) }
        : null,
    };
  }

  async findAll() {
    const variantes = await this.prisma.producto_variantes.findMany({
      include: {
        productos: true,
        colores: true,
        talles: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return variantes.map((variante) => ({
      ...variante,
      id: Number(variante.id),
      color_id: Number(variante.color_id),
      talle_id: variante.talle_id ? Number(variante.talle_id) : null,
      colores: { ...variante.colores, id: Number(variante.colores.id) },
      talles: variante.talles
        ? { ...variante.talles, id: Number(variante.talles.id) }
        : null,
    }));
  }

  async findOne(id: number) {
    const variante = await this.prisma.producto_variantes.findUnique({
      where: { id: BigInt(id) },
      include: {
        productos: true,
        colores: true,
        talles: true,
      },
    });

    if (!variante) return null;

    return {
      ...variante,
      id: Number(variante.id),
      color_id: Number(variante.color_id),
      talle_id: variante.talle_id ? Number(variante.talle_id) : null,
      colores: { ...variante.colores, id: Number(variante.colores.id) },
      talles: variante.talles
        ? { ...variante.talles, id: Number(variante.talles.id) }
        : null,
    };
  }

  async update(
    id: number,
    updateProductoVarianteDto: UpdateProductoVarianteDto,
  ) {
    const variante = await this.prisma.producto_variantes.update({
      where: { id: BigInt(id) },
      data: {
        ...updateProductoVarianteDto,
        talle_id: updateProductoVarianteDto.talle_id
          ? BigInt(updateProductoVarianteDto.talle_id)
          : undefined,
        color_id: updateProductoVarianteDto.color_id
          ? BigInt(updateProductoVarianteDto.color_id)
          : undefined,
      },
      include: {
        productos: true,
        colores: true,
        talles: true,
      },
    });

    return {
      ...variante,
      id: Number(variante.id),
      color_id: Number(variante.color_id),
      talle_id: variante.talle_id ? Number(variante.talle_id) : null,
      colores: { ...variante.colores, id: Number(variante.colores.id) },
      talles: variante.talles
        ? { ...variante.talles, id: Number(variante.talles.id) }
        : null,
    };
  }

  async remove(id: number) {
    const variante = await this.prisma.producto_variantes.delete({
      where: { id: BigInt(id) },
    });

    return {
      ...variante,
      id: Number(variante.id),
      color_id: Number(variante.color_id),
      talle_id: variante.talle_id ? Number(variante.talle_id) : null,
    };
  }
}
