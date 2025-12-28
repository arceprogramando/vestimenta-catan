import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardStats {
  totalProductos: number;
  totalUsuarios: number;
  totalReservas: number;
  reservasPendientes: number;
  stockBajo: number;
  reservasHoy: number;
}

export interface ReservasPorDia {
  fecha: string;
  total: number;
  pendientes: number;
  confirmadas: number;
  completadas: number;
  canceladas: number;
}

export interface StockPorCategoria {
  genero: string;
  totalProductos: number;
  totalStock: number;
  stockBajo: number;
}

export interface ProductosAgregadosPorDia {
  fecha: string;
  total: number;
}

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Obtiene estadísticas generales del dashboard
   */
  async getStats(): Promise<DashboardStats> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const [
      totalProductos,
      totalUsuarios,
      totalReservas,
      reservasPendientes,
      stockBajo,
      reservasHoy,
    ] = await Promise.all([
      // Total productos activos
      this.prisma.productos.count({
        where: { is_active: true },
      }),

      // Total usuarios activos
      this.prisma.usuarios.count({
        where: { is_active: true },
      }),

      // Total reservas (no canceladas)
      this.prisma.reservas.count({
        where: {
          is_active: true,
          estado: { not: 'cancelado' },
        },
      }),

      // Reservas pendientes
      this.prisma.reservas.count({
        where: {
          is_active: true,
          estado: 'pendiente',
        },
      }),

      // Variantes con stock bajo (< 5)
      this.prisma.producto_variantes.count({
        where: {
          is_active: true,
          cantidad: { lt: 5 },
        },
      }),

      // Reservas creadas hoy
      this.prisma.reservas.count({
        where: {
          is_active: true,
          created_at: { gte: hoy },
        },
      }),
    ]);

    return {
      totalProductos,
      totalUsuarios,
      totalReservas,
      reservasPendientes,
      stockBajo,
      reservasHoy,
    };
  }

  /**
   * Obtiene datos para gráfico de reservas por día (últimos 30 días)
   */
  async getReservasPorDia(dias: number = 30): Promise<ReservasPorDia[]> {
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    desde.setHours(0, 0, 0, 0);

    const reservas = await this.prisma.reservas.findMany({
      where: {
        created_at: { gte: desde },
        is_active: true,
      },
      select: {
        created_at: true,
        estado: true,
      },
    });

    // Agrupar por día
    const porDia: Record<string, ReservasPorDia> = {};

    // Inicializar todos los días
    for (let i = 0; i <= dias; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const key = fecha.toISOString().split('T')[0];
      porDia[key] = {
        fecha: key,
        total: 0,
        pendientes: 0,
        confirmadas: 0,
        completadas: 0,
        canceladas: 0,
      };
    }

    // Contar reservas
    for (const reserva of reservas) {
      const fecha = reserva.created_at.toISOString().split('T')[0];
      if (porDia[fecha]) {
        porDia[fecha].total++;
        switch (reserva.estado) {
          case 'pendiente':
            porDia[fecha].pendientes++;
            break;
          case 'confirmado':
            porDia[fecha].confirmadas++;
            break;
          case 'completado':
            porDia[fecha].completadas++;
            break;
          case 'cancelado':
            porDia[fecha].canceladas++;
            break;
        }
      }
    }

    // Ordenar por fecha ascendente
    return Object.values(porDia).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  /**
   * Obtiene datos para gráfico de stock por categoría (género)
   */
  async getStockPorCategoria(): Promise<StockPorCategoria[]> {
    const productos = await this.prisma.productos.findMany({
      where: { is_active: true },
      include: {
        producto_variantes: {
          where: { is_active: true },
          select: { cantidad: true },
        },
      },
    });

    const porGenero: Record<string, StockPorCategoria> = {
      mujer: {
        genero: 'Mujer',
        totalProductos: 0,
        totalStock: 0,
        stockBajo: 0,
      },
      hombre: {
        genero: 'Hombre',
        totalProductos: 0,
        totalStock: 0,
        stockBajo: 0,
      },
      ninios: {
        genero: 'Niños',
        totalProductos: 0,
        totalStock: 0,
        stockBajo: 0,
      },
    };

    for (const producto of productos) {
      const genero = producto.genero;
      if (porGenero[genero]) {
        porGenero[genero].totalProductos++;
        for (const variante of producto.producto_variantes) {
          porGenero[genero].totalStock += variante.cantidad;
          if (variante.cantidad < 5) {
            porGenero[genero].stockBajo++;
          }
        }
      }
    }

    return Object.values(porGenero);
  }

  /**
   * Obtiene los últimos cambios de auditoría
   */
  async getUltimosCAmbios(limit: number = 10) {
    // Usamos query directa ya que audit_log no está en PrismaService
    const logs = await this.prisma.$queryRaw<
      Array<{
        id: bigint;
        tabla: string;
        registro_id: string;
        accion: string;
        usuario_email: string | null;
        created_at: Date;
      }>
    >`
      SELECT id, tabla, registro_id, accion, usuario_email, created_at
      FROM audit_log
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    return logs.map((log) => ({
      ...log,
      id: log.id.toString(),
    }));
  }

  /**
   * Obtiene datos para gráfico de productos agregados por día (últimos N días)
   * Cuenta variantes de productos creadas por día
   */
  async getProductosAgregadosPorDia(
    dias: number = 30,
  ): Promise<ProductosAgregadosPorDia[]> {
    const desde = new Date();
    desde.setDate(desde.getDate() - dias);
    desde.setHours(0, 0, 0, 0);

    const variantes = await this.prisma.producto_variantes.findMany({
      where: {
        created_at: { gte: desde },
      },
      select: {
        created_at: true,
      },
    });

    // Agrupar por día
    const porDia: Record<string, ProductosAgregadosPorDia> = {};

    // Inicializar todos los días
    for (let i = 0; i <= dias; i++) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const key = fecha.toISOString().split('T')[0];
      porDia[key] = {
        fecha: key,
        total: 0,
      };
    }

    // Contar variantes creadas
    for (const variante of variantes) {
      const fecha = variante.created_at.toISOString().split('T')[0];
      if (porDia[fecha]) {
        porDia[fecha].total++;
      }
    }

    // Ordenar por fecha ascendente
    return Object.values(porDia).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  /**
   * Obtiene variantes con stock bajo para alertas
   */
  async getStockBajoAlertas(umbral: number = 5, limit: number = 20) {
    const variantes = await this.prisma.producto_variantes.findMany({
      where: {
        is_active: true,
        cantidad: { lt: umbral },
      },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            genero: true,
          },
        },
        color: {
          select: {
            id: true,
            nombre: true,
          },
        },
        talle: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: { cantidad: 'asc' },
      take: limit,
    });

    // Convertir BigInt a string para serialización JSON
    return variantes.map((v) => ({
      id: v.id.toString(),
      producto_id: v.producto_id,
      talle_id: v.talle_id?.toString() || null,
      color_id: v.color_id.toString(),
      cantidad: v.cantidad,
      producto: v.producto,
      color: v.color
        ? { id: v.color.id.toString(), nombre: v.color.nombre }
        : null,
      talle: v.talle
        ? { id: v.talle.id.toString(), nombre: v.talle.nombre }
        : null,
    }));
  }
}
