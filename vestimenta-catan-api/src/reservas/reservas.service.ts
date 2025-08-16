import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';

@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReservaDto: CreateReservaDto) {
    const reserva = await this.prisma.reservas.create({
      data: {
        ...createReservaDto,
        talle_id: createReservaDto.talle_id
          ? BigInt(createReservaDto.talle_id)
          : null,
        color_id: BigInt(createReservaDto.color_id),
      },
      include: {
        productos: true,
        colores: true,
        talles: true,
      },
    });

    return {
      ...reserva,
      id: Number(reserva.id),
      color_id: Number(reserva.color_id),
      talle_id: reserva.talle_id ? Number(reserva.talle_id) : null,
      colores: { ...reserva.colores, id: Number(reserva.colores.id) },
      talles: reserva.talles
        ? { ...reserva.talles, id: Number(reserva.talles.id) }
        : null,
    };
  }

  async findAll() {
    const reservas = await this.prisma.reservas.findMany({
      include: {
        productos: true,
        colores: true,
        talles: true,
      },
      orderBy: { fecha_reserva: 'desc' },
    });

    return reservas.map((reserva) => ({
      ...reserva,
      id: Number(reserva.id),
      color_id: Number(reserva.color_id),
      talle_id: reserva.talle_id ? Number(reserva.talle_id) : null,
      colores: { ...reserva.colores, id: Number(reserva.colores.id) },
      talles: reserva.talles
        ? { ...reserva.talles, id: Number(reserva.talles.id) }
        : null,
    }));
  }

  async findOne(id: number) {
    const reserva = await this.prisma.reservas.findUnique({
      where: { id: BigInt(id) },
      include: {
        productos: true,
        colores: true,
        talles: true,
      },
    });

    if (!reserva) return null;

    return {
      ...reserva,
      id: Number(reserva.id),
      color_id: Number(reserva.color_id),
      talle_id: reserva.talle_id ? Number(reserva.talle_id) : null,
      colores: { ...reserva.colores, id: Number(reserva.colores.id) },
      talles: reserva.talles
        ? { ...reserva.talles, id: Number(reserva.talles.id) }
        : null,
    };
  }

  async update(id: number, updateReservaDto: UpdateReservaDto) {
    const reserva = await this.prisma.reservas.update({
      where: { id: BigInt(id) },
      data: {
        ...updateReservaDto,
        talle_id: updateReservaDto.talle_id
          ? BigInt(updateReservaDto.talle_id)
          : undefined,
        color_id: updateReservaDto.color_id
          ? BigInt(updateReservaDto.color_id)
          : undefined,
      },
      include: {
        productos: true,
        colores: true,
        talles: true,
      },
    });

    return {
      ...reserva,
      id: Number(reserva.id),
      color_id: Number(reserva.color_id),
      talle_id: reserva.talle_id ? Number(reserva.talle_id) : null,
      colores: { ...reserva.colores, id: Number(reserva.colores.id) },
      talles: reserva.talles
        ? { ...reserva.talles, id: Number(reserva.talles.id) }
        : null,
    };
  }

  async remove(id: number) {
    const reserva = await this.prisma.reservas.delete({
      where: { id: BigInt(id) },
    });

    return {
      ...reserva,
      id: Number(reserva.id),
      color_id: Number(reserva.color_id),
      talle_id: reserva.talle_id ? Number(reserva.talle_id) : null,
    };
  }
}
