'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Tags,
  Palette,
  Ruler,
  Users,
  History,
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Settings,
  LogOut,
  Shirt,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/stores/auth-store';

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permission: 'dashboard.ver',
  },
  {
    title: 'Reservas',
    href: '/admin/reservas',
    icon: ShoppingCart,
    permission: 'reservas.ver',
  },
  {
    title: 'Productos',
    href: '/admin/productos',
    icon: Package,
    permission: 'productos.ver',
  },
  {
    title: 'Stock',
    href: '/admin/stock',
    icon: Boxes,
    permission: 'stock.ver',
  },
];

const categorias = [
  {
    id: 'colores',
    title: 'Colores',
    href: '/admin/categorias/colores',
    icon: Palette,
    permission: 'categorias.ver',
  },
  {
    id: 'talles',
    title: 'Talles',
    href: '/admin/categorias/talles',
    icon: Ruler,
    permission: 'categorias.ver',
  },
];

const adminItems = [
  {
    title: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
    permission: 'usuarios.ver',
  },
  {
    title: 'Auditoria',
    href: '/admin/auditoria',
    icon: History,
    permission: 'auditoria.ver',
  },
];

export function AdminSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { hasPermission, isSuperAdmin } = useAuth();
  const { user, logout } = useAuthStore();
  const [categoriasExpanded, setCategoriasExpanded] = React.useState(
    pathname.startsWith('/admin/categorias')
  );

  const canAccess = (permission?: string): boolean => {
    if (!permission) return true;
    if (isSuperAdmin) return true;
    return hasPermission(permission);
  };

  const isActive = (href: string): boolean => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-2.5 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2.5 w-full hover:bg-sidebar-accent rounded-md p-1 -m-1 transition-colors shrink-0">
              <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <Shirt className="size-4" />
              </div>
              <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-medium">Vestimenta Catan</span>
                <ChevronsUpDown className="size-3 text-muted-foreground" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/admin/configuracion">
                <Settings className="size-4" />
                <span>Configuracion</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
              <span>Cerrar sesion</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarHeader>

      <SidebarContent className="px-2.5">
        {/* Navegacion principal */}
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                if (!canAccess(item.permission)) return null;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      className="h-8"
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Categorias */}
        {canAccess('categorias.ver') && (
          <SidebarGroup className="p-0 mt-2">
            <SidebarGroupLabel className="flex items-center justify-between px-0 h-6">
              <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                Categorias
              </span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <Collapsible
                  open={categoriasExpanded}
                  onOpenChange={setCategoriasExpanded}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="h-8" tooltip="Categorias">
                        <Tags className="size-4" />
                        <span className="flex-1 text-sm">Categorias</span>
                        {categoriasExpanded ? (
                          <ChevronDown className="size-3" />
                        ) : (
                          <ChevronRight className="size-3" />
                        )}
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {categorias.map((cat) => {
                          if (!canAccess(cat.permission)) return null;
                          return (
                            <SidebarMenuSubItem key={cat.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isActive(cat.href)}
                              >
                                <Link href={cat.href}>
                                  <cat.icon className="size-3.5" />
                                  <span>{cat.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Administracion */}
        <SidebarGroup className="p-0 mt-2">
          <SidebarGroupLabel className="flex items-center justify-between px-0 h-6">
            <span className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
              Administracion
            </span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminItems.map((item) => {
                if (!canAccess(item.permission)) return null;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.href)}
                      className="h-8"
                      tooltip={item.title}
                    >
                      <Link href={item.href}>
                        <item.icon className="size-4" />
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-2.5 pb-3 group-data-[collapsible=icon]:hidden">
        <div className="flex items-center gap-3 rounded-lg border p-3 bg-card">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            <span className="text-sm font-medium">
              {user?.nombre?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">{user?.nombre}</span>
            <span className="text-xs text-muted-foreground truncate">
              {user?.rol}
            </span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
