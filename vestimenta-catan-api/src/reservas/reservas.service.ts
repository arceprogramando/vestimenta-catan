import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReservaDto } from './dto/create-reserva.dto';
import { UpdateReservaDto } from './dto/update-reserva.dto';
import { estado_reserva, Prisma } from '@prisma/client';
import { SoftDeleteDto } from '../common/interfaces';
import { DecimalLike } from '../common/types';
import { PaginatedResponse, createPaginatedResponse } from '../common/dto';

// Interface para datos de actualización de reserva
interface ReservaUpdateData {
  updated_at: Date;
  variante_id?: bigint;
  cantidad?: number;
  precio_total?: number | null;
  notas?: string | null;
  telefono_contacto?: string | null;
  estado?: estado_reserva;
  fecha_confirmacion?: Date;
  confirmado_por?: string;
  fecha_cancelacion?: Date;
  cancelado_por?: string;
  motivo_cancelacion?: string;
}

// Interface para la reserva con relaciones
interface ReservaWithRelations {
  id: bigint;
  variante_id: bigint;
  usuario_id: bigint | null;
  cantidad: number;
  estado: estado_reserva;
  fecha_reserva: Date;
  notas: string | null;
  telefono_contacto: string | null;
  precio_unitario: DecimalLike | null;
  precio_total: DecimalLike | null;
  fecha_confirmacion: Date | null;
  confirmado_por: string | null;
  fecha_cancelacion: Date | null;
  cancelado_por: string | null;
  motivo_cancelacion: string | null;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  variante?: {
    id: bigint;
    cantidad: number;
    producto?: {
      id: number;
      nombre: string;
      descripcion: string | null;
      genero: string;
      thumbnail: string | null;
      precio: DecimalLike | null;
    } | null;
    talle?: {
      id: bigint;
      nombre: string;
      orden: number | null;
    } | null;
    color?: {
      id: bigint;
      nombre: string;
    } | null;
  } | null;
  usuario?: {
    id: bigint;
    email: string;
    nombre: string | null;
    apellido: string | null;
  } | null;
}

@Injectable()
export class ReservasService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReservaDto: CreateReservaDto) {
    // Usamos una transacción con bloqueo pesimista para evitar race conditions
    // Esto garantiza que el check de stock y la creación de reserva sean atómicos
    return await this.prisma.$transaction(async (tx) => {
      // SELECT FOR UPDATE: bloquea la fila hasta que termine la transacción
      // Esto previene que otra transacción lea/modifique el stock mientras procesamos
      const varianteRows = await tx.$queryRaw<
        Array<{
          id: bigint;
          producto_id: number;
          cantidad: number;
          is_active: boolean;
        }>
      >`
        SELECT id, producto_id, cantidad, is_active
        FROM producto_variantes
        WHERE id = ${BigInt(createReservaDto.variante_id)}
        AND is_active = true
        FOR UPDATE
      `;

      if (varianteRows.length === 0) {
        throw new NotFoundException(
          'Variante de producto no encontrada o inactiva',
        );
      }

      const varianteData = varianteRows[0];

      // Verificar stock disponible (ahora con datos bloqueados/consistentes)
      if (varianteData.cantidad < createReservaDto.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${varianteData.cantidad}, solicitado: ${createReservaDto.cantidad}`,
        );
      }

      // Obtener producto para el precio
      const producto = await tx.productos.findUnique({
        where: { id: varianteData.producto_id },
      });

      // Obtener precio unitario del producto (Prisma Decimal tiene método toNumber)
      const precioUnitario = this.extractDecimal(producto?.precio);
      const precioTotal = precioUnitario
        ? precioUnitario.toNumber() * createReservaDto.cantidad
        : null;

      // Crear la reserva dentro de la misma transacción
      const reserva = await tx.reservas.create({
        data: {
          variante_id: BigInt(createReservaDto.variante_id),
          usuario_id: createReservaDto.usuario_id
            ? BigInt(createReservaDto.usuario_id)
            : null,
          cantidad: createReservaDto.cantidad,
          estado: (createReservaDto.estado as estado_reserva) || 'pendiente',
          notas: createReservaDto.notas,
          telefono_contacto: createReservaDto.telefono_contacto,
          precio_unitario: precioUnitario?.toNumber() ?? null,
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
    });
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

    return reservas.map((reserva) => this.serializeReserva(reserva));
  }

  async findAllPaginated(params: {
    limit?: number;
    offset?: number;
    search?: string;
    estado?: estado_reserva;
    includeDeleted?: boolean;
  }): Promise<PaginatedResponse<ReturnType<typeof this.serializeReserva>>> {
    const {
      limit = 20,
      offset = 0,
      search,
      estado,
      includeDeleted = false,
    } = params;

    const where: Prisma.reservasWhereInput = {
      ...(includeDeleted ? {} : { is_active: true }),
      ...(estado && { estado }),
      ...(search && {
        OR: [
          { notas: { contains: search, mode: Prisma.QueryMode.insensitive } },
          {
            telefono_contacto: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            usuario: {
              OR: [
                {
                  email: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  nombre: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
                {
                  apellido: {
                    contains: search,
                    mode: Prisma.QueryMode.insensitive,
                  },
                },
              ],
            },
          },
          {
            variante: {
              producto: {
                nombre: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          },
        ],
      }),
    };

    const [reservas, total] = await Promise.all([
      this.prisma.reservas.findMany({
        where,
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
        take: limit,
        skip: offset,
      }),
      this.prisma.reservas.count({ where }),
    ]);

    const data = reservas.map((reserva) => this.serializeReserva(reserva));
    return createPaginatedResponse(data, total, limit, offset);
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

    return reservas.map((reserva) => this.serializeReserva(reserva));
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

  async update(
    id: number,
    updateReservaDto: UpdateReservaDto,
    updatedBy?: string,
  ) {
    // Verificar que la reserva existe y está activa
    const existing = await this.prisma.reservas.findUnique({
      where: { id: BigInt(id), is_active: true },
    });

    if (!existing) {
      throw new NotFoundException('Reserva no encontrada o fue eliminada');
    }

    // Preparar datos de actualización
    const updateData: ReservaUpdateData = {
      updated_at: new Date(),
    };

    if (updateReservaDto.variante_id !== undefined) {
      updateData.variante_id = BigInt(updateReservaDto.variante_id);
    }
    if (updateReservaDto.cantidad !== undefined) {
      updateData.cantidad = updateReservaDto.cantidad;
      // Recalcular precio total si cambia la cantidad
      if (existing.precio_unitario) {
        updateData.precio_total =
          Number(existing.precio_unitario) * updateReservaDto.cantidad;
      } else {
        // Si no hay precio_unitario, limpiar precio_total para evitar datos inconsistentes
        // Ej: cantidad=5 con precio_total viejo de cuando era cantidad=2
        updateData.precio_total = null;
      }
    }
    if (updateReservaDto.notas !== undefined) {
      updateData.notas = updateReservaDto.notas;
    }
    if (updateReservaDto.telefono_contacto !== undefined) {
      updateData.telefono_contacto = updateReservaDto.telefono_contacto;
    }

    // Manejar cambios de estado
    if (
      updateReservaDto.estado &&
      updateReservaDto.estado !== existing.estado
    ) {
      updateData.estado = updateReservaDto.estado as estado_reserva;

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
  private serializeReserva(reserva: ReservaWithRelations) {
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
      precio_unitario: reserva.precio_unitario
        ? Number(reserva.precio_unitario)
        : null,
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
      variante: reserva.variante
        ? {
            id: Number(reserva.variante.id),
            cantidad: reserva.variante.cantidad,
            producto: reserva.variante.producto
              ? {
                  id: reserva.variante.producto.id,
                  nombre: reserva.variante.producto.nombre,
                  descripcion: reserva.variante.producto.descripcion,
                  genero: reserva.variante.producto.genero,
                  thumbnail: reserva.variante.producto.thumbnail,
                  precio: reserva.variante.producto.precio
                    ? Number(reserva.variante.producto.precio)
                    : null,
                }
              : null,
            talle: reserva.variante.talle
              ? {
                  id: Number(reserva.variante.talle.id),
                  nombre: reserva.variante.talle.nombre,
                  orden: reserva.variante.talle.orden,
                }
              : null,
            color: reserva.variante.color
              ? {
                  id: Number(reserva.variante.color.id),
                  nombre: reserva.variante.color.nombre,
                }
              : null,
          }
        : null,
      // Usuario
      usuario: reserva.usuario
        ? {
            id: Number(reserva.usuario.id),
            email: reserva.usuario.email,
            nombre: reserva.usuario.nombre,
            apellido: reserva.usuario.apellido,
          }
        : null,
    };
  }

  // Helper para extraer Decimal de Prisma de forma segura
  private extractDecimal(value: unknown): DecimalLike | null {
    if (
      value !== null &&
      value !== undefined &&
      typeof value === 'object' &&
      'toNumber' in value &&
      typeof (value as DecimalLike).toNumber === 'function'
    ) {
      return value as DecimalLike;
    }
    return null;
  }
}
