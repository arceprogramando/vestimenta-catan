'use client';

import { useEffect, useState } from 'react';
import { StatsCard } from '@/components/admin/StatsCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/axios';
import type {
  DashboardStats,
  ReservasPorDia,
  StockPorCategoria,
  StockBajoAlerta,
  AuditLog,
} from '@/types/admin';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
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

export default function AdminDashboardPage() {
  const { fullName } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reservasChart, setReservasChart] = useState<ReservasPorDia[]>([]);
  const [stockChart, setStockChart] = useState<StockPorCategoria[]>([]);
  const [stockBajo, setStockBajo] = useState<StockBajoAlerta[]>([]);
  const [ultimosCambios, setUltimosCambios] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('30');

  const axisColor = theme === 'dark' ? '#71717a' : '#868c98';
  const gridColor = theme === 'dark' ? '#3f3f46' : '#e2e4e9';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [statsRes, reservasRes, stockRes, alertasRes, cambiosRes] = await Promise.all([
          api.get<DashboardStats>('/dashboard/stats'),
          api.get<ReservasPorDia[]>(`/dashboard/charts/reservas?dias=${period}`),
          api.get<StockPorCategoria[]>('/dashboard/charts/stock'),
          api.get<StockBajoAlerta[]>('/dashboard/alertas/stock-bajo?umbral=5&limit=10'),
          api.get<AuditLog[]>('/dashboard/ultimos-cambios?limit=5'),
        ]);

        setStats(statsRes.data);
        setReservasChart(reservasRes.data);
        setStockChart(stockRes.data);
        setStockBajo(alertasRes.data);
        setUltimosCambios(cambiosRes.data);
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

  const isNetworkError = error?.toLowerCase().includes('network') || error?.toLowerCase().includes('failed to fetch');
  const isServerError = error?.toLowerCase().includes('500') || error?.toLowerCase().includes('server');

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    // El useEffect se re-ejecuta automáticamente cuando loading cambia
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

      {/* Charts Row */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
        {/* Reservas Chart */}
        <div className="bg-card text-card-foreground rounded-lg border flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-border/50">
            <h3 className="font-medium text-sm sm:text-base">Reservas</h3>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 gap-1.5">
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
          <div className="p-4">
            <div className="h-50 sm:h-62.5 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={reservasChart}
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
                  <defs>
                    <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#gradientTotal)"
                    name="Total"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stock Chart */}
        <div className="bg-card text-card-foreground rounded-lg border w-full lg:w-100">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-border/50">
            <h3 className="font-medium text-sm sm:text-base">Stock por Categoria</h3>
          </div>
          <div className="p-4">
            <div className="h-50 sm:h-62.5 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stockChart}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="genero"
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
                  <Bar dataKey="totalStock" fill="#22c55e" name="Stock Total" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="stockBajo" fill="#ec4899" name="Stock Bajo" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Bajo Alerts */}
        <div className="bg-card text-card-foreground rounded-lg border">
          <div className="flex items-center gap-2 p-4 border-b border-border/50">
            <AlertTriangle className="size-4 text-pink-400" />
            <h3 className="font-medium text-sm sm:text-base">Alertas de Stock Bajo</h3>
            <Badge variant="secondary" className="ml-auto">
              {stockBajo.length}
            </Badge>
          </div>
          <div className="p-4">
            {stockBajo.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No hay alertas de stock bajo
              </p>
            ) : (
              <div className="space-y-3">
                {stockBajo.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-muted/50 dark:bg-neutral-800/50 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.producto.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.talle?.nombre && `Talle ${item.talle.nombre} - `}
                        {item.color.nombre}
                      </p>
                    </div>
                    <Badge variant={item.cantidad === 0 ? 'destructive' : 'secondary'}>
                      {item.cantidad} uds
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Changes */}
        <div className="bg-card text-card-foreground rounded-lg border">
          <div className="flex items-center gap-2 p-4 border-b border-border/50">
            <Clock className="size-4 text-muted-foreground" />
            <h3 className="font-medium text-sm sm:text-base">Ultimos Cambios</h3>
          </div>
          <div className="p-4">
            {ultimosCambios.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No hay cambios recientes</p>
            ) : (
              <div className="space-y-3">
                {ultimosCambios.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start justify-between p-3 bg-muted/50 dark:bg-neutral-800/50 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium text-sm capitalize">
                        {log.accion.toLowerCase()} en {log.tabla}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log.usuario_email || 'Sistema'}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatFechaHora(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
