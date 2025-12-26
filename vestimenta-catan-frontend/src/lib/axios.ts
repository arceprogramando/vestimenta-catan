import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Cliente público - para endpoints que no requieren autenticación
export const publicApi = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Necesario para cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Cliente autenticado - para endpoints que requieren auth
// Las cookies httpOnly se envían automáticamente con withCredentials: true
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Las cookies se envían automáticamente
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable para evitar múltiples refresh simultáneos
let isRefreshing = false;
let failedQueue: Array<{
  resolve: () => void;
  reject: (error: AxiosError) => void;
}> = [];

const processQueue = (error: AxiosError | null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  failedQueue = [];
};

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
            resolve: () => {
              // Reintentar con las nuevas cookies (se envían automáticamente)
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
        // Llamar a refresh (cookies se envían y reciben automáticamente)
        await api.post('/auth/refresh');

        // Procesar cola de requests pendientes
        processQueue(null);

        // Reintentar request original (las nuevas cookies ya están seteadas)
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh falló - limpiar auth state y redirigir a login
        processQueue(refreshError as AxiosError);

        if (typeof window !== 'undefined') {
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
