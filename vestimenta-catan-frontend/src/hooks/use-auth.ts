'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook para acceder al estado de autenticacion
 * Provee acceso al store y funciones utilitarias
 */
export function useAuth() {
  const store = useAuthStore();

  return {
    // State
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    error: store.error,
    isHydrated: store.isHydrated,

    // Actions
    login: store.login,
    register: store.register,
    logout: store.logout,
    logoutAll: store.logoutAll,
    clearError: store.clearError,

    // Computed
    isAdmin: store.user?.rol === 'admin',
    fullName: store.user
      ? `${store.user.nombre || ''} ${store.user.apellido || ''}`.trim() || store.user.email
      : null,
  };
}

/**
 * Hook para proteger rutas que requieren autenticacion
 * Redirige a /login si no esta autenticado
 */
export function useRequireAuth(redirectTo = '/login') {
  const router = useRouter();
  const { isAuthenticated, isLoading, isHydrated } = useAuth();

  useEffect(() => {
    // Esperar a que se hidrate el estado desde localStorage
    if (!isHydrated) return;

    // Si no esta autenticado y no esta cargando, redirigir
    if (!isAuthenticated && !isLoading) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, isHydrated, router, redirectTo]);

  return { isAuthenticated, isLoading, isHydrated };
}

/**
 * Hook para rutas que solo deben ser accesibles por admin
 * Redirige a / si no es admin
 */
export function useRequireAdmin(redirectTo = '/') {
  const router = useRouter();
  const { isAuthenticated, isLoading, isHydrated, isAdmin } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated && !isLoading) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && !isAdmin && !isLoading) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isAdmin, isLoading, isHydrated, router, redirectTo]);

  return { isAuthenticated, isAdmin, isLoading, isHydrated };
}

/**
 * Hook para rutas publicas que redirigen si ya esta autenticado
 * Util para /login y /registro
 */
export function useRedirectIfAuthenticated(redirectTo = '/') {
  const router = useRouter();
  const { isAuthenticated, isHydrated } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;

    if (isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isHydrated, router, redirectTo]);

  return { isAuthenticated, isHydrated };
}
