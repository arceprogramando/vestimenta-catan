import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/axios';
import type { User, LoginCredentials, RegisterCredentials } from '@/types/auth';
import { AxiosError } from 'axios';

// Response del backend (ya no incluye accessToken)
interface AuthApiResponse {
  expiresIn: number;
  tokenType: string;
  user: User;
}

interface AuthStore {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isHydrated: false,

      setHydrated: () => set({ isHydrated: true }),

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          // El backend setea las cookies httpOnly automáticamente
          const response = await api.post<AuthApiResponse>('/auth/login', credentials);
          const { user } = response.data;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          const message = axiosError.response?.data?.message || 'Error al iniciar sesion';

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });

          throw error;
        }
      },

      loginWithGoogle: async (credential: string) => {
        set({ isLoading: true, error: null });

        try {
          // El backend setea las cookies httpOnly automáticamente
          const response = await api.post<AuthApiResponse>('/auth/google', { credential });
          const { user } = response.data;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          const message = axiosError.response?.data?.message || 'Error al iniciar sesion con Google';

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });

          throw error;
        }
      },

      register: async (credentials: RegisterCredentials) => {
        set({ isLoading: true, error: null });

        try {
          // El backend setea las cookies httpOnly automáticamente
          const response = await api.post<AuthApiResponse>('/auth/register', credentials);
          const { user } = response.data;

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          const message = axiosError.response?.data?.message || 'Error al registrar usuario';

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: message,
          });

          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          // El backend limpia las cookies httpOnly
          await api.post('/auth/logout');
        } catch {
          // Ignorar errores de logout (puede que el token ya expire)
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      logoutAll: async () => {
        set({ isLoading: true });

        try {
          // El backend limpia las cookies httpOnly
          await api.post('/auth/logout-all');
        } catch {
          // Ignorar errores
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      checkAuth: async () => {
        // Si ya tenemos usuario en el store persistido, verificar con el backend
        const { user: currentUser } = get();

        set({ isLoading: true });

        try {
          // Las cookies se envían automáticamente
          const response = await api.get<{ userId: number; email: string; rol: string }>('/auth/me');

          // Actualizar con datos del backend
          if (currentUser) {
            set({
              user: {
                ...currentUser,
                id: response.data.userId,
                email: response.data.email,
                rol: response.data.rol as 'user' | 'admin',
              },
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({
              user: {
                id: response.data.userId,
                email: response.data.email,
                rol: response.data.rol as 'user' | 'admin',
                nombre: null,
                apellido: null,
                created_at: new Date().toISOString(),
              },
              isAuthenticated: true,
              isLoading: false,
            });
          }
        } catch {
          // Si falla, limpiar estado (cookies inválidas o expiradas)
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      // Solo persistir el usuario (no tokens - están en cookies httpOnly)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

// Escuchar evento de logout forzado (desde el interceptor de axios)
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Sesion expirada',
    });
  });
}
