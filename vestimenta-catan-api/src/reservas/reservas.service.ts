import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';

// DTO para eliminación lógica
export interface SoftDeleteDto {
  deleted_by?: string;
  delete_reason?: string;
}

@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReservaDto: CreateReservaDto) {
    // Verificar que la variante existe y está activa
    const variante = await this.prisma.producto_variantes.findUnique({
      where: {
        id: BigInt(createReservaDto.variante_id),
        is_active: true,
      },
      include: {
        producto: true,
        talle: true,
        color: true,
      },
    });

    if (!variante) {
      throw new NotFoundException('Variante de producto no encontrada o inactiva');
    }

    // Verificar stock disponible
    if (variante.cantidad < createReservaDto.cantidad) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${variante.cantidad}, solicitado: ${createReservaDto.cantidad}`
      );
    }

    const reserva = await this.prisma.reservas.create({
      data: {
        variante_id: BigInt(createReservaDto.variante_id),
        usuario_id: createReservaDto.usuario_id
          ? BigInt(createReservaDto.usuario_id)
          : null,
        cantidad: createReservaDto.cantidad,
        estado: (createReservaDto.estado as any) || 'pendiente',
        notas: createReservaDto.notas,
      },
      include: {
        variante: {
          include: {
            producto: true,
            talle: true,
            color: true,
          },
        },
        usuario: true,
      },
    });

    return this.serializeReserva(reserva);
  }

  async findAll(includeDeleted = false) {
    const reservas = await this.prisma.reservas.findMany({
      where: includeDeleted ? undefined : { is_active: true },
      include: {
        variante: {
          include: {
            producto: true,
            talle: true,
            color: true,
          },
        },
        usuario: true,
      },
      orderBy: { fecha_reserva: 'desc' },
    });

    return reservas.map(reserva => this.serializeReserva(reserva));
  }

  async findByUsuario(usuarioId: number) {
    const reservas = await this.prisma.reservas.findMany({
      where: {
        usuario_id: BigInt(usuarioId),
        is_active: true,
      },
      include: {
        variante: {
          include: {
            producto: true,
            talle: true,
            color: true,
          },
        },
      },
      orderBy: { fecha_reserva: 'desc' },
    });

    return reservas.map(reserva => this.serializeReserva(reserva));
  }

  async findOne(id: number, includeDeleted = false) {
    const reserva = await this.prisma.reservas.findUnique({
      where: {
        id: BigInt(id),
        ...(includeDeleted ? {} : { is_active: true }),
      },
      include: {
        variante: {
          include: {
            producto: true,
            talle: true,
            color: true,
          },
        },
        usuario: true,
      },
    });

    if (!reserva) return null;

    return this.serializeReserva(reserva);
  }

  async update(id: number, updateReservaDto: UpdateReservaDto) {
    // Verificar que la reserva existe y está activa
    const existing = await this.findOne(id);
    if (!existing) {
      throw new NotFoundException('Reserva no encontrada o fue eliminada');
    }

    const reserva = await this.prisma.reservas.update({
      where: { id: BigInt(id) },
      data: {
        ...(updateReservaDto.variante_id && {
          variante_id: BigInt(updateReservaDto.variante_id)
        }),
        ...(updateReservaDto.cantidad !== undefined && {
          cantidad: updateReservaDto.cantidad
        }),
        ...(updateReservaDto.estado && {
          estado: updateReservaDto.estado as any
        }),
        ...(updateReservaDto.notas !== undefined && {
          notas: updateReservaDto.notas
        }),
        updated_at: new Date(),
      },
      include: {
        variante: {
          include: {
            producto: true,
            talle: true,
            color: true,
          },
        },
        usuario: true,
      },
    });

    return this.serializeReserva(reserva);
  }

  // Eliminación lógica
  async remove(id: number, softDeleteDto?: SoftDeleteDto) {
    const reserva = await this.findOne(id);
    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada o ya fue eliminada');
    }

    const deleted = await this.prisma.reservas.update({
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
      ...deleted,
      id: Number(deleted.id),
      variante_id: Number(deleted.variante_id),
      usuario_id: deleted.usuario_id ? Number(deleted.usuario_id) : null,
    };
  }

  // Restaurar reserva eliminada
  async restore(id: number) {
    const reserva = await this.prisma.reservas.findUnique({
      where: { id: BigInt(id) },
    });

    if (!reserva) {
      throw new NotFoundException('Reserva no encontrada');
    }

    if (reserva.is_active) {
      throw new BadRequestException('La reserva no está eliminada');
    }

    const restored = await this.prisma.reservas.update({
      where: { id: BigInt(id) },
      data: {
        is_active: true,
        deleted_at: null,
        deleted_by: null,
        delete_reason: null,
        updated_at: new Date(),
      },
      include: {
        variante: {
          include: {
            producto: true,
            talle: true,
            color: true,
          },
        },
        usuario: true,
      },
    });

    return this.serializeReserva(restored);
  }

  // Helper para serializar BigInt a Number en la respuesta
  private serializeReserva(reserva: any) {
    return {
      id: Number(reserva.id),
      variante_id: Number(reserva.variante_id),
      usuario_id: reserva.usuario_id ? Number(reserva.usuario_id) : null,
      cantidad: reserva.cantidad,
      estado: reserva.estado,
      fecha_reserva: reserva.fecha_reserva,
      notas: reserva.notas,
      created_at: reserva.created_at,
      updated_at: reserva.updated_at,
      is_active: reserva.is_active,
      // Variante con producto, talle, color
      variante: reserva.variante ? {
        id: Number(reserva.variante.id),
        cantidad: reserva.variante.cantidad,
        producto: reserva.variante.producto ? {
          id: reserva.variante.producto.id,
          nombre: reserva.variante.producto.nombre,
          descripcion: reserva.variante.producto.descripcion,
          genero: reserva.variante.producto.genero,
          thumbnail: reserva.variante.producto.thumbnail,
        } : null,
        talle: reserva.variante.talle ? {
          id: Number(reserva.variante.talle.id),
          nombre: reserva.variante.talle.nombre,
          orden: reserva.variante.talle.orden,
        } : null,
        color: reserva.variante.color ? {
          id: Number(reserva.variante.color.id),
          nombre: reserva.variante.color.nombre,
        } : null,
      } : null,
      // Usuario
      usuario: reserva.usuario ? {
        id: Number(reserva.usuario.id),
        email: reserva.usuario.email,
        nombre: reserva.usuario.nombre,
        apellido: reserva.usuario.apellido,
      } : null,
    };
  }
}
