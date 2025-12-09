import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/axios';
import type { User, LoginCredentials, RegisterCredentials, AuthResponse } from '@/types/auth';
import { AxiosError } from 'axios';

interface AuthStore {
  // State
  user: User | null;
  accessToken: string | null;
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
  fetchUser: () => Promise<void>;
  clearError: () => void;
  setHydrated: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      isHydrated: false,

      setHydrated: () => set({ isHydrated: true }),

      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null });

        try {
          const response = await api.post<AuthResponse>('/auth/login', credentials);
          const { accessToken, user } = response.data;

          // Guardar token en localStorage para el interceptor
          localStorage.setItem('accessToken', accessToken);

          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          const message = axiosError.response?.data?.message || 'Error al iniciar sesion';

          set({
            user: null,
            accessToken: null,
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
          const response = await api.post<AuthResponse>('/auth/google', { credential });
          const { accessToken, user } = response.data;

          // Guardar token en localStorage para el interceptor
          localStorage.setItem('accessToken', accessToken);

          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          const message = axiosError.response?.data?.message || 'Error al iniciar sesion con Google';

          set({
            user: null,
            accessToken: null,
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
          const response = await api.post<AuthResponse>('/auth/register', credentials);
          const { accessToken, user } = response.data;

          // Guardar token en localStorage para el interceptor
          localStorage.setItem('accessToken', accessToken);

          set({
            user,
            accessToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const axiosError = error as AxiosError<{ message: string }>;
          const message = axiosError.response?.data?.message || 'Error al registrar usuario';

          set({
            user: null,
            accessToken: null,
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
          await api.post('/auth/logout');
        } catch {
          // Ignorar errores de logout (puede que el token ya expire)
        } finally {
          localStorage.removeItem('accessToken');

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      logoutAll: async () => {
        set({ isLoading: true });

        try {
          await api.post('/auth/logout-all');
        } catch {
          // Ignorar errores
        } finally {
          localStorage.removeItem('accessToken');

          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      fetchUser: async () => {
        const { accessToken } = get();

        if (!accessToken) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });

        try {
          const response = await api.get<{ userId: number; email: string; rol: string }>('/auth/me');

          // El endpoint /auth/me retorna datos parciales, mantener el user existente
          const currentUser = get().user;
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
          localStorage.removeItem('accessToken');
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Cuando se rehidrata el estado, sincronizar con localStorage
        if (state?.accessToken) {
          localStorage.setItem('accessToken', state.accessToken);
        }
        state?.setHydrated();
      },
    }
  )
);

// Escuchar evento de logout forzado (desde el interceptor)
if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.setState({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: 'Sesion expirada',
    });
  });
}
