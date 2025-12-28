'use client';

import { useReservasStore } from '@/stores/reservas-store';

/**
 * Hook para acceder al estado de reservas
 */
export function useReservas() {
  const store = useReservasStore();

  return {
    // State
    reservas: store.reservas,
    reservaActual: store.reservaActual,
    isLoading: store.isLoading,
    error: store.error,
    meta: store.meta,

    // Actions
    fetchMisReservas: store.fetchMisReservas,
    fetchAllReservas: store.fetchAllReservas,
    fetchReserva: store.fetchReserva,
    createReserva: store.createReserva,
    updateReserva: store.updateReserva,
    cancelarReserva: store.cancelarReserva,
    confirmarReserva: store.confirmarReserva,
    completarReserva: store.completarReserva,
    clearError: store.clearError,
    clearReservaActual: store.clearReservaActual,

    // Computed
    reservasPendientes: store.reservas.filter((r) => r.estado === 'pendiente'),
    reservasConfirmadas: store.reservas.filter((r) => r.estado === 'confirmado'),
    reservasCompletadas: store.reservas.filter((r) => r.estado === 'completado'),
    reservasCanceladas: store.reservas.filter((r) => r.estado === 'cancelado'),
  };
}
