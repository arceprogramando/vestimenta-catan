'use client';

import { useEffect, useState, useMemo } from 'react';
import { StatsCard } from './_components/stats-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Clock,
  Calendar,
  ChevronDown,
  FilePlus,
  UserPlus,
  WifiOff,
  RefreshCw,
  ServerCrash,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/axios';
import type {
  DashboardStats,
  StockBajoAlerta,
  AuditLog,
  StockPorProductoResponse,
} from '@/types/admin';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';

type Period = '7' | '30' | '90';

const periodLabels: Record<Period, string> = {
  '7': 'Ultima semana',
  '30': 'Ultimo mes',
  '90': 'Ultimo trimestre',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
    name: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const formatFecha = (fecha: string) => {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
    };

    return (
      <div className="bg-card border rounded-md p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">{formatFecha(label || '')}</p>
        <div className="grid gap-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs text-muted-foreground">{entry.name}:</span>
              <span className="text-xs font-medium">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

// Colores para el ranking de top productos
const rankColors = [
  'border-yellow-400', // 1st - Gold
  'border-gray-400',   // 2nd - Silver
  'border-amber-600',  // 3rd - Bronze
  'border-blue-400',   // 4th
  'border-purple-400', // 5th
];

const rankBgColors = [
  'bg-yellow-400/10',
  'bg-gray-400/10',
  'bg-amber-600/10',
  'bg-blue-400/10',
  'bg-purple-400/10',
];

interface TopProducto {
  id: number;
  nombre: string;
  genero: string;
  totalStock: number;
  variantes: number;
}

export default function AdminDashboardPage() {
  const { fullName } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [stockPorProducto, setStockPorProducto] = useState<StockPorProductoResponse | null>(null);
  const [stockBajo, setStockBajo] = useState<StockBajoAlerta[]>([]);
  const [ultimosCambios, setUltimosCambios] = useState<AuditLog[]>([]);
  const [topProductos, setTopProductos] = useState<TopProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('30');
  const [chartReady, setChartReady] = useState(false);

  // Table state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'nombre' | 'genero' | 'totalStock'>('totalStock');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filterGenero, setFilterGenero] = useState<string>('all');
  const itemsPerPage = 5;

  const axisColor = theme === 'dark' ? '#71717a' : '#868c98';
  const gridColor = theme === 'dark' ? '#3f3f46' : '#e2e4e9';

  // Delay chart render to avoid ResponsiveContainer warning
  useEffect(() => {
    const timer = setTimeout(() => setChartReady(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, stockProdRes, alertasRes, cambiosRes] = await Promise.all([
          api.get<DashboardStats>('/dashboard/stats'),
          api.get<StockPorProductoResponse>(`/dashboard/charts/stock-por-producto?dias=${period}`),
          api.get<StockBajoAlerta[]>('/dashboard/alertas/stock-bajo?umbral=5&limit=10'),
          api.get<AuditLog[]>('/dashboard/ultimos-cambios?limit=5'),
        ]);

        setStats(statsRes.data);
        setStockPorProducto(stockProdRes.data);
        setStockBajo(alertasRes.data);
        setUltimosCambios(cambiosRes.data);

        // Calcular top productos desde stockPorProducto
        if (stockProdRes.data?.productos) {
          // Buscar los productos con más stock desde el último día de datos
          const lastDayData = stockProdRes.data.data[stockProdRes.data.data.length - 1];
          const productosConStock = stockProdRes.data.productos.map((prod, idx) => ({
            id: idx + 1,
            nombre: prod.nombre.split(' (')[0], // Remover género del nombre
            genero: prod.nombre.match(/\(([^)]+)\)/)?.[1] || 'N/A',
            totalStock: typeof lastDayData?.[prod.nombre] === 'number'
              ? lastDayData[prod.nombre] as number
              : 0,
            variantes: 1,
          })).sort((a, b) => b.totalStock - a.totalStock);

          setTopProductos(productosConStock.slice(0, 5));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar dashboard');
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [period]);

  const formatFechaCorta = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };

  const formatFechaHora = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtered and sorted data for table
  const filteredAlerts = useMemo(() => {
    let result = [...stockBajo];

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.producto.nombre.toLowerCase().includes(term) ||
          item.color.nombre.toLowerCase().includes(term) ||
          (item.talle?.nombre?.toLowerCase().includes(term) ?? false)
      );
    }

    // Filter by genero
    if (filterGenero !== 'all') {
      result = result.filter((item) => item.producto.genero === filterGenero);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'nombre':
          comparison = a.producto.nombre.localeCompare(b.producto.nombre);
          break;
        case 'genero':
          comparison = a.producto.genero.localeCompare(b.producto.genero);
          break;
        case 'totalStock':
          comparison = a.cantidad - b.cantidad;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [stockBajo, searchTerm, filterGenero, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const paginatedAlerts = filteredAlerts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: 'nombre' | 'genero' | 'totalStock') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const isNetworkError = error?.toLowerCase().includes('network') || error?.toLowerCase().includes('failed to fetch');
  const isServerError = error?.toLowerCase().includes('500') || error?.toLowerCase().includes('server');

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-muted rounded-full" />
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium">Cargando dashboard</p>
          <p className="text-sm text-muted-foreground">Obteniendo datos del sistema...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="rounded-full bg-muted p-6">
          {isNetworkError ? (
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          ) : isServerError ? (
            <ServerCrash className="h-12 w-12 text-muted-foreground" />
          ) : (
            <AlertTriangle className="h-12 w-12 text-destructive" />
          )}
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-2">
            {isNetworkError
              ? 'Sin conexion al servidor'
              : isServerError
                ? 'Error del servidor'
                : 'Error al cargar'}
          </h2>
          <p className="text-muted-foreground mb-1">
            {isNetworkError
              ? 'No se pudo conectar con el servidor. Verifica que el backend este corriendo en el puerto 3001.'
              : isServerError
                ? 'El servidor encontro un error al procesar la solicitud.'
                : 'Ocurrio un error inesperado al cargar el dashboard.'}
          </p>
          <p className="text-xs text-muted-foreground/70 font-mono bg-muted px-3 py-1.5 rounded mt-3">
            {error}
          </p>
        </div>
        <Button onClick={handleRetry} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
            Bienvenido {fullName}!
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Aqui tienes un resumen del sistema
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-9 gap-1.5 bg-card hover:bg-card/80 border-border/50"
            asChild
          >
            <Link href="/admin/productos">
              <FilePlus className="size-4" />
              <span className="hidden sm:inline">Nuevo Producto</span>
            </Link>
          </Button>
          <Button className="h-9 gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-white border border-border/50">
            <UserPlus className="size-4" />
            <span className="hidden sm:inline">Nueva Reserva</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatsCard title="Productos" value={stats?.totalProductos || 0} icon={Package} />
        <StatsCard title="Usuarios" value={stats?.totalUsuarios || 0} icon={Users} />
        <StatsCard title="Reservas" value={stats?.totalReservas || 0} icon={ShoppingCart} />
        <StatsCard
          title="Pendientes"
          value={stats?.reservasPendientes || 0}
          icon={Clock}
          extra="activas"
        />
        <StatsCard
          title="Hoy"
          value={stats?.reservasHoy || 0}
          icon={TrendingUp}
          trend={{ value: 12, isPositive: true }}
        />
        <StatsCard
          title="Stock Bajo"
          value={stats?.stockBajo || 0}
          icon={AlertTriangle}
          valueClassName={stats?.stockBajo && stats.stockBajo > 0 ? 'text-pink-400' : undefined}
        />
      </div>

      {/* Main Chart + Top Performers - Square UI Style */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Multiline Chart - 70% width */}
        <div className="bg-card text-card-foreground rounded-lg border flex-1 lg:flex-[2.5]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-border/50">
            <div>
              <h3 className="font-semibold text-base sm:text-lg">Stock por Producto</h3>
              <p className="text-xs text-muted-foreground">Unidades agregadas por dia</p>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-1.5">
                    <Calendar className="size-3.5" />
                    <span className="text-sm">{periodLabels[period]}</span>
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(Object.keys(periodLabels) as Period[]).map((p) => (
                    <DropdownMenuItem key={p} onClick={() => setPeriod(p)}>
                      {periodLabels[p]} {period === p && '✓'}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Legend */}
          {stockPorProducto && stockPorProducto.productos.length > 0 && (
            <div className="flex flex-wrap gap-3 px-4 pt-4">
              {stockPorProducto.productos.map((prod) => (
                <div key={prod.nombre} className="flex items-center gap-1.5">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: prod.color }}
                  />
                  <span className="text-xs text-muted-foreground">{prod.nombre}</span>
                </div>
              ))}
            </div>
          )}

          <div className="p-4">
            <div className="h-72 sm:h-80 w-full">
              {chartReady && stockPorProducto && stockPorProducto.productos.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart
                    data={stockPorProducto.data}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis
                      dataKey="fecha"
                      tickFormatter={formatFechaCorta}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: axisColor }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: axisColor }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {stockPorProducto.productos.map((prod) => (
                      <Line
                        key={prod.nombre}
                        type="monotone"
                        dataKey={prod.nombre}
                        stroke={prod.color}
                        strokeWidth={2}
                        dot={false}
                        name={prod.nombre}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">No hay datos de stock por producto</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Productos Panel - 30% width */}
        <div className="bg-card text-card-foreground rounded-lg border lg:w-80 xl:w-96">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <div>
              <h3 className="font-semibold text-base">Top Productos</h3>
              <p className="text-xs text-muted-foreground">Por stock disponible</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              Top 5
            </Badge>
          </div>
          <div className="p-4">
            {topProductos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Package className="size-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Sin datos de productos</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topProductos.map((producto, index) => (
                  <div
                    key={producto.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 ${rankColors[index]} ${rankBgColors[index]} transition-all hover:scale-[1.02]`}
                  >
                    {/* Rank Badge */}
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                      index === 0 ? 'bg-yellow-400 text-yellow-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-600 text-white' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Product Avatar */}
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold">
                      {producto.nombre.charAt(0).toUpperCase()}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{producto.nombre}</p>
                      <p className="text-xs text-muted-foreground">{producto.genero}</p>
                    </div>

                    {/* Stock Badge */}
                    <Badge
                      variant={producto.totalStock > 10 ? 'default' : producto.totalStock > 0 ? 'secondary' : 'destructive'}
                      className="shrink-0"
                    >
                      {producto.totalStock} uds
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stock Bajo Management Table - Square UI Style */}
      <div className="bg-card text-card-foreground rounded-lg border">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-pink-400" />
            <div>
              <h3 className="font-semibold text-base">Gestion de Stock Bajo</h3>
              <p className="text-xs text-muted-foreground">Productos que necesitan reposicion</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-9 w-full sm:w-[200px]"
              />
            </div>

            {/* Filter */}
            <Select value={filterGenero} onValueChange={(v) => { setFilterGenero(v); setCurrentPage(1); }}>
              <SelectTrigger className="h-9 w-full sm:w-[130px]">
                <SelectValue placeholder="Genero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="mujer">Mujer</SelectItem>
                <SelectItem value="hombre">Hombre</SelectItem>
                <SelectItem value="ninios">Ninos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full" aria-label="Productos con stock bajo">
            <caption className="sr-only">
              Lista de productos con stock bajo que necesitan reposicion
            </caption>
            <thead>
              <tr className="border-b bg-muted/50">
                <th
                  scope="col"
                  className="text-left p-3 font-medium text-sm"
                  aria-sort={sortField === 'nombre' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    onClick={() => handleSort('nombre')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                    aria-label={`Ordenar por producto${sortField === 'nombre' ? `, actualmente ${sortDirection === 'asc' ? 'ascendente' : 'descendente'}` : ''}`}
                  >
                    Producto
                    <ArrowUpDown className="size-3" aria-hidden="true" />
                  </button>
                </th>
                <th
                  scope="col"
                  className="text-left p-3 font-medium text-sm hidden sm:table-cell"
                  aria-sort={sortField === 'genero' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    onClick={() => handleSort('genero')}
                    className="flex items-center gap-1 hover:text-primary transition-colors"
                    aria-label={`Ordenar por genero${sortField === 'genero' ? `, actualmente ${sortDirection === 'asc' ? 'ascendente' : 'descendente'}` : ''}`}
                  >
                    Genero
                    <ArrowUpDown className="size-3" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="text-left p-3 font-medium text-sm">Variante</th>
                <th
                  scope="col"
                  className="text-right p-3 font-medium text-sm"
                  aria-sort={sortField === 'totalStock' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    onClick={() => handleSort('totalStock')}
                    className="flex items-center gap-1 ml-auto hover:text-primary transition-colors"
                    aria-label={`Ordenar por stock${sortField === 'totalStock' ? `, actualmente ${sortDirection === 'asc' ? 'ascendente' : 'descendente'}` : ''}`}
                  >
                    Stock
                    <ArrowUpDown className="size-3" aria-hidden="true" />
                  </button>
                </th>
                <th scope="col" className="text-right p-3 font-medium text-sm">Estado</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <Package className="size-10 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      {searchTerm || filterGenero !== 'all'
                        ? 'No se encontraron resultados'
                        : 'No hay alertas de stock bajo'}
                    </p>
                  </td>
                </tr>
              ) : (
                paginatedAlerts.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={`border-b last:border-0 hover:bg-muted/30 transition-colors ${
                      idx % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'
                    }`}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {item.producto.nombre.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">{item.producto.nombre}</span>
                      </div>
                    </td>
                    <td className="p-3 hidden sm:table-cell">
                      <Badge variant="outline" className="capitalize">
                        {item.producto.genero === 'ninios' ? 'Ninos' : item.producto.genero}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {item.talle?.nombre && `Talle ${item.talle.nombre} - `}
                      {item.color.nombre}
                    </td>
                    <td className="p-3 text-right font-mono font-medium text-sm">
                      {item.cantidad}
                    </td>
                    <td className="p-3 text-right">
                      <Badge variant={item.cantidad === 0 ? 'destructive' : 'secondary'}>
                        {item.cantidad === 0 ? 'Agotado' : 'Bajo'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Mostrando {(currentPage - 1) * itemsPerPage + 1} a{' '}
              {Math.min(currentPage * itemsPerPage, filteredAlerts.length)} de{' '}
              {filteredAlerts.length} registros
            </p>
            <nav className="flex items-center gap-1" aria-label="Paginacion de tabla">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Ir a la pagina anterior"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Ir a la pagina ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </Button>
              ))}
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Ir a la pagina siguiente"
              >
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        )}
      </div>

      {/* Recent Changes */}
      <div className="bg-card text-card-foreground rounded-lg border">
        <div className="flex items-center gap-2 p-4 border-b border-border/50">
          <Clock className="size-4 text-muted-foreground" />
          <h3 className="font-semibold text-base">Ultimos Cambios</h3>
        </div>
        <div className="p-4">
          {ultimosCambios.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No hay cambios recientes</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {ultimosCambios.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col p-3 bg-muted/50 dark:bg-neutral-800/50 rounded-lg border"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant={
                        log.accion === 'CREATE'
                          ? 'default'
                          : log.accion === 'UPDATE'
                            ? 'secondary'
                            : 'destructive'
                      }
                      className="text-[10px] px-1.5"
                    >
                      {log.accion}
                    </Badge>
                    <span className="text-xs text-muted-foreground capitalize">{log.tabla}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {log.usuario_email || 'Sistema'}
                  </p>
                  <span className="text-[10px] text-muted-foreground/70 mt-1">
                    {formatFechaHora(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
