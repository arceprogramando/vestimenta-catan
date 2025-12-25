import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { Prisma } from '@prisma/client';

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

    // Obtener precio del producto y calcular total
    const precioUnitario = variante.producto.precio;
    const precioTotal = precioUnitario
      ? new Prisma.Decimal(precioUnitario.toString()).mul(createReservaDto.cantidad)
      : null;

    const reserva = await this.prisma.reservas.create({
      data: {
        variante_id: BigInt(createReservaDto.variante_id),
        usuario_id: createReservaDto.usuario_id
          ? BigInt(createReservaDto.usuario_id)
          : null,
        cantidad: createReservaDto.cantidad,
        estado: (createReservaDto.estado as any) || 'pendiente',
        notas: createReservaDto.notas,
        telefono_contacto: createReservaDto.telefono_contacto,
        precio_unitario: precioUnitario,
        precio_total: precioTotal,
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

  async update(id: number, updateReservaDto: UpdateReservaDto, updatedBy?: string) {
    // Verificar que la reserva existe y está activa
    const existing = await this.prisma.reservas.findUnique({
      where: { id: BigInt(id), is_active: true },
    });

    if (!existing) {
      throw new NotFoundException('Reserva no encontrada o fue eliminada');
    }

    // Preparar datos de actualización
    const updateData: any = {
      updated_at: new Date(),
    };

    if (updateReservaDto.variante_id !== undefined) {
      updateData.variante_id = BigInt(updateReservaDto.variante_id);
    }
    if (updateReservaDto.cantidad !== undefined) {
      updateData.cantidad = updateReservaDto.cantidad;
      // Recalcular precio total si cambia la cantidad
      if (existing.precio_unitario) {
        updateData.precio_total = new Prisma.Decimal(existing.precio_unitario.toString())
          .mul(updateReservaDto.cantidad);
      }
    }
    if (updateReservaDto.notas !== undefined) {
      updateData.notas = updateReservaDto.notas;
    }
    if (updateReservaDto.telefono_contacto !== undefined) {
      updateData.telefono_contacto = updateReservaDto.telefono_contacto;
    }

    // Manejar cambios de estado
    if (updateReservaDto.estado && updateReservaDto.estado !== existing.estado) {
      updateData.estado = updateReservaDto.estado as any;

      // Si se confirma
      if (updateReservaDto.estado === 'confirmado') {
        updateData.fecha_confirmacion = new Date();
        updateData.confirmado_por = updatedBy;
      }

      // Si se cancela
      if (updateReservaDto.estado === 'cancelado') {
        updateData.fecha_cancelacion = new Date();
        updateData.cancelado_por = updatedBy;
        updateData.motivo_cancelacion = updateReservaDto.motivo_cancelacion;
      }
    }

    const reserva = await this.prisma.reservas.update({
      where: { id: BigInt(id) },
      data: updateData,
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

  // Helper para serializar BigInt y Decimal a tipos seguros para JSON
  private serializeReserva(reserva: any) {
    return {
      id: Number(reserva.id),
      variante_id: Number(reserva.variante_id),
      usuario_id: reserva.usuario_id ? Number(reserva.usuario_id) : null,
      cantidad: reserva.cantidad,
      estado: reserva.estado,
      fecha_reserva: reserva.fecha_reserva,
      notas: reserva.notas,
      telefono_contacto: reserva.telefono_contacto,
      // Precios
      precio_unitario: reserva.precio_unitario ? Number(reserva.precio_unitario) : null,
      precio_total: reserva.precio_total ? Number(reserva.precio_total) : null,
      // Tracking de estados
      fecha_confirmacion: reserva.fecha_confirmacion,
      confirmado_por: reserva.confirmado_por,
      fecha_cancelacion: reserva.fecha_cancelacion,
      cancelado_por: reserva.cancelado_por,
      motivo_cancelacion: reserva.motivo_cancelacion,
      // Auditoría
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
          precio: reserva.variante.producto.precio ? Number(reserva.variante.producto.precio) : null,
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
