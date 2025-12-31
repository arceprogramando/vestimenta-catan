'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import type { UserRole } from '@/types/auth';

// Jerarquia de roles
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  empleado: 2,
  admin: 3,
  superadmin: 4,
};

/**
 * Hook para acceder al estado de autenticacion
 * Provee acceso al store y funciones utilitarias
 */
export function useAuth() {
  const store = useAuthStore();

  // Verifica si el usuario tiene al menos cierto nivel de rol
  const hasRole = useCallback(
    (minRole: UserRole): boolean => {
      if (!store.user) return false;
      const userLevel = ROLE_HIERARCHY[store.user.rol] || 0;
      const requiredLevel = ROLE_HIERARCHY[minRole] || 999;
      return userLevel >= requiredLevel;
    },
    [store.user]
  );

  // Verifica si tiene un permiso especifico
  const hasPermission = useCallback(
    (permission: string): boolean => {
      if (!store.user) return false;
      // superadmin tiene todos los permisos
      if (store.user.rol === 'superadmin') return true;
      // Verificar en lista de permisos
      return store.user.permisos?.includes(permission) || false;
    },
    [store.user]
  );

  // Verifica si tiene alguno de los permisos
  const hasAnyPermission = useCallback(
    (...permissions: string[]): boolean => {
      return permissions.some((p) => hasPermission(p));
    },
    [hasPermission]
  );

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

    // Role checks
    hasRole,
    hasPermission,
    hasAnyPermission,

    // Computed
    isAdmin: hasRole('admin'),
    isSuperAdmin: store.user?.rol === 'superadmin',
    isEmpleado: hasRole('empleado'),
    canAccessAdmin: hasRole('empleado'), // empleado, admin y superadmin pueden acceder
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
 * Hook para rutas que solo deben ser accesibles por admin/empleado
 * Redirige a / si no tiene rol suficiente
 */
export function useRequireAdmin(redirectTo = '/') {
  const router = useRouter();
  const { isAuthenticated, isLoading, isHydrated, canAccessAdmin, isAdmin, isSuperAdmin, hasPermission } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated && !isLoading) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && !canAccessAdmin && !isLoading) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, canAccessAdmin, isLoading, isHydrated, router, redirectTo]);

  return { isAuthenticated, isAdmin, isSuperAdmin, canAccessAdmin, isLoading, isHydrated, hasPermission };
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
