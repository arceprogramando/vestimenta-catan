// Tipos para el Dashboard Admin

export interface DashboardStats {
  totalProductos: number;
  totalUsuarios: number;
  totalReservas: number;
  reservasPendientes: number;
  stockBajo: number;
  reservasHoy: number;
}

export interface ReservasPorDia {
  fecha: string;
  total: number;
  pendientes: number;
  confirmadas: number;
  completadas: number;
  canceladas: number;
}

export interface StockPorCategoria {
  genero: string;
  totalProductos: number;
  totalStock: number;
  stockBajo: number;
}

export interface ProductosAgregadosPorDia {
  fecha: string;
  total: number;
}

export interface AuditLog {
  id: string;
  tabla: string;
  registro_id: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE' | 'RESTORE';
  datos_antes: Record<string, unknown> | null;
  datos_despues: Record<string, unknown> | null;
  campos_modificados: string[];
  usuario_id: number | null;
  usuario_email: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface StockBajoAlerta {
  id: number;
  cantidad: number;
  producto: {
    id: number;
    nombre: string;
    genero: string;
  };
  color: {
    nombre: string;
  };
  talle: {
    nombre: string;
  } | null;
}

// Navegación del sidebar
export interface NavItem {
  title: string;
  href: string;
  icon: string;
  permission?: string;
  children?: NavItem[];
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: 'LayoutDashboard',
    permission: 'dashboard.ver',
  },
  {
    title: 'Reservas',
    href: '/admin/reservas',
    icon: 'ShoppingCart',
    permission: 'reservas.ver',
  },
  {
    title: 'Productos',
    href: '/admin/productos',
    icon: 'Package',
    permission: 'productos.ver',
  },
  {
    title: 'Stock',
    href: '/admin/stock',
    icon: 'Boxes',
    permission: 'stock.ver',
  },
  {
    title: 'Categorias',
    href: '/admin/categorias',
    icon: 'Tags',
    permission: 'categorias.ver',
    children: [
      {
        title: 'Colores',
        href: '/admin/categorias/colores',
        icon: 'Palette',
        permission: 'categorias.ver',
      },
      {
        title: 'Talles',
        href: '/admin/categorias/talles',
        icon: 'Ruler',
        permission: 'categorias.ver',
      },
    ],
  },
  {
    title: 'Usuarios',
    href: '/admin/usuarios',
    icon: 'Users',
    permission: 'usuarios.ver',
  },
  {
    title: 'Auditoria',
    href: '/admin/auditoria',
    icon: 'History',
    permission: 'auditoria.ver',
  },
];
