import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Cliente público - para endpoints que no requieren autenticación
export const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cliente autenticado - para endpoints que requieren auth
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Importante para enviar cookies (refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable para evitar múltiples refresh simultáneos
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - Agregar token a cada request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obtener token del store (se importa dinámicamente para evitar circular deps)
    const token = typeof window !== 'undefined'
      ? localStorage.getItem('accessToken')
      : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Manejar 401 y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Si es 401 y no es un retry, intentar refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // No intentar refresh si estamos en login/register/refresh
      const isAuthEndpoint = originalRequest.url?.includes('/auth/login') ||
                            originalRequest.url?.includes('/auth/register') ||
                            originalRequest.url?.includes('/auth/refresh');

      if (isAuthEndpoint) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Si ya estamos refrescando, encolar esta request
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              resolve(api(originalRequest));
            },
            reject: (err: AxiosError) => {
              reject(err);
            },
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Llamar a refresh (el refresh token va en la cookie automáticamente)
        const response = await api.post('/auth/refresh');
        const { accessToken } = response.data;

        // Guardar nuevo token
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
        }

        // Procesar cola de requests pendientes
        processQueue(null, accessToken);

        // Reintentar request original con nuevo token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falló - limpiar auth state y redirigir a login
        processQueue(refreshError as AxiosError, null);

        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          // Disparar evento para que el store sepa que debe limpiar
          window.dispatchEvent(new CustomEvent('auth:logout'));
          // Redirigir a login
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
