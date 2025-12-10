import { create } from 'zustand';
import { api } from '@/lib/axios';
import type { Reserva, CreateReservaDto, UpdateReservaDto } from '@/types/reserva';
import { AxiosError } from 'axios';

interface ReservasStore {
  // State
  reservas: Reserva[];
  reservaActual: Reserva | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMisReservas: () => Promise<void>;
  fetchAllReservas: () => Promise<Reserva[]>;
  fetchReserva: (id: number) => Promise<Reserva | null>;
  createReserva: (data: CreateReservaDto) => Promise<Reserva>;
  updateReserva: (id: number, data: UpdateReservaDto) => Promise<Reserva>;
  cancelarReserva: (id: number, motivo?: string) => Promise<Reserva>;
  confirmarReserva: (id: number) => Promise<Reserva>;
  completarReserva: (id: number) => Promise<Reserva>;
  clearError: () => void;
  clearReservaActual: () => void;
}

export const useReservasStore = create<ReservasStore>((set, get) => ({
  // Initial state
  reservas: [],
  reservaActual: null,
  isLoading: false,
  error: null,

  fetchMisReservas: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<Reserva[]>('/reservas/mis-reservas');
      set({
        reservas: response.data,
        isLoading: false,
      });
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Error al cargar reservas';

      set({
        reservas: [],
        isLoading: false,
        error: message,
      });
    }
  },

  fetchAllReservas: async () => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<Reserva[]>('/reservas');
      set({
        reservas: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Error al cargar reservas';

      set({
        reservas: [],
        isLoading: false,
        error: message,
      });
      return [];
    }
  },

  fetchReserva: async (id: number) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.get<Reserva>(`/reservas/${id}`);
      set({
        reservaActual: response.data,
        isLoading: false,
      });
      return response.data;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Error al cargar la reserva';

      set({
        reservaActual: null,
        isLoading: false,
        error: message,
      });
      return null;
    }
  },

  createReserva: async (data: CreateReservaDto) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.post<Reserva>('/reservas', data);
      const nuevaReserva = response.data;

      // Agregar la nueva reserva a la lista
      set((state) => ({
        reservas: [nuevaReserva, ...state.reservas],
        reservaActual: nuevaReserva,
        isLoading: false,
      }));

      return nuevaReserva;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Error al crear la reserva';

      set({
        isLoading: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  updateReserva: async (id: number, data: UpdateReservaDto) => {
    set({ isLoading: true, error: null });

    try {
      const response = await api.patch<Reserva>(`/reservas/${id}`, data);
      const reservaActualizada = response.data;

      // Actualizar en la lista
      set((state) => ({
        reservas: state.reservas.map((r) =>
          r.id === id ? reservaActualizada : r
        ),
        reservaActual: reservaActualizada,
        isLoading: false,
      }));

      return reservaActualizada;
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      const message = axiosError.response?.data?.message || 'Error al actualizar la reserva';

      set({
        isLoading: false,
        error: message,
      });

      throw new Error(message);
    }
  },

  cancelarReserva: async (id: number, motivo?: string) => {
    return get().updateReserva(id, {
      estado: 'cancelado',
      motivo_cancelacion: motivo,
    });
  },

  confirmarReserva: async (id: number) => {
    return get().updateReserva(id, { estado: 'confirmado' });
  },

  completarReserva: async (id: number) => {
    return get().updateReserva(id, { estado: 'completado' });
  },

  clearError: () => set({ error: null }),

  clearReservaActual: () => set({ reservaActual: null }),
}));
