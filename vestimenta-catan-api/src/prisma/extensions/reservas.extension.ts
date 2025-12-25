import { Prisma, estado_reserva } from '@prisma/client';

/**
 * Estados que permiten cancelación
 */
const CANCELABLE_STATES: estado_reserva[] = ['pendiente', 'confirmado'];

/**
 * Extensión para métodos de estado y campos computados en reservas
 */
export const reservasExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: 'reservas',
    model: {
      reservas: {
        /**
         * Confirma una reserva pendiente
         */
        async confirmar(id: bigint, confirmedBy?: string) {
          return client.reservas.update({
            where: { id },
            data: {
              estado: 'confirmado',
              fecha_confirmacion: new Date(),
              confirmado_por: confirmedBy ?? null,
              updated_at: new Date(),
            },
          });
        },

        /**
         * Cancela una reserva con motivo
         */
        async cancelar(id: bigint, motivo: string, canceladoPor?: string) {
          return client.reservas.update({
            where: { id },
            data: {
              estado: 'cancelado',
              fecha_cancelacion: new Date(),
              cancelado_por: canceladoPor ?? null,
              motivo_cancelacion: motivo,
              updated_at: new Date(),
            },
          });
        },

        /**
         * Marca una reserva como completada
         */
        async completar(id: bigint) {
          return client.reservas.update({
            where: { id },
            data: {
              estado: 'completado',
              updated_at: new Date(),
            },
          });
        },
      },
    },
    result: {
      reservas: {
        /**
         * Indica si la reserva está pendiente
         */
        isPending: {
          needs: { estado: true },
          compute(reserva: { estado: estado_reserva }): boolean {
            return reserva.estado === 'pendiente';
          },
        },

        /**
         * Indica si la reserva está confirmada
         */
        isConfirmed: {
          needs: { estado: true },
          compute(reserva: { estado: estado_reserva }): boolean {
            return reserva.estado === 'confirmado';
          },
        },

        /**
         * Indica si la reserva puede ser cancelada
         */
        canCancel: {
          needs: { estado: true },
          compute(reserva: { estado: estado_reserva }): boolean {
            return CANCELABLE_STATES.includes(reserva.estado);
          },
        },
      },
    },
  });
});
