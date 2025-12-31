'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, LogOut, User, Shield, LayoutDashboard, Bell, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

const roleLabels: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  superadmin: { label: 'Super Admin', variant: 'destructive' },
  admin: { label: 'Admin', variant: 'default' },
  empleado: { label: 'Empleado', variant: 'secondary' },
  user: { label: 'Usuario', variant: 'outline' },
};

export function AdminHeader() {
  const { user, logout, fullName, isSuperAdmin } = useAuth();
  const { theme, setTheme } = useTheme();

  if (!user) return null;

  const roleConfig = roleLabels[user.rol] || roleLabels.user;
  const initials =
    fullName
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b bg-card sticky top-0 z-10 w-full">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-2" />
        <div className="hidden sm:flex items-center gap-2 text-muted-foreground">
          <LayoutDashboard className="size-4" />
          <span className="text-sm font-medium">Panel de Administracion</span>
        </div>
        <Badge variant={roleConfig.variant} className="hidden md:inline-flex">
          {roleConfig.label}
        </Badge>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
          <Link href="/">
            <Home className="size-5" />
            <span className="sr-only">Ir al sitio</span>
          </Link>
        </Button>

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          <span className="sr-only">Notificaciones</span>
        </Button>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="relative cursor-pointer"
        >
          <Sun className="size-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Cambiar tema</span>
        </Button>

        <div className="h-5 w-px bg-border mx-2 hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.avatar_url || undefined} alt={fullName || ''} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/perfil" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Mi perfil
              </Link>
            </DropdownMenuItem>
            {isSuperAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/admin/usuarios" className="cursor-pointer">
                  <Shield className="mr-2 h-4 w-4" />
                  Gestionar roles
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
