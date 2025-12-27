'use client';

import { useRequireAdmin } from '@/hooks/use-auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { canAccessAdmin, isHydrated, isLoading } = useRequireAdmin();

  // Mostrar loading mientras se verifica la autenticacion
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si no puede acceder, useRequireAdmin ya redirige
  if (!canAccessAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <SidebarProvider className="bg-sidebar">
      <AdminSidebar />
      <div className="h-svh overflow-hidden lg:p-2 w-full">
        <div className="lg:border lg:rounded-md overflow-hidden flex flex-col items-center justify-start bg-container h-full w-full bg-background">
          <AdminHeader />
          <main className="flex-1 overflow-auto p-4 sm:p-6 w-full">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
