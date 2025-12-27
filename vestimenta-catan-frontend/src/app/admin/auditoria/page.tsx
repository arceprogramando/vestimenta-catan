'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  Search,
  History,
  Eye,
  ChevronLeft,
  ChevronRight,
  WifiOff,
  RefreshCw,
  ServerCrash,
  AlertTriangle,
} from 'lucide-react';
import { useRequireAdmin } from '@/hooks/use-auth';
import { api } from '@/lib/axios';

interface AuditLog {
  id: string;
  tabla: string;
  registro_id: string;
  accion: string;
  usuario_email: string | null;
  datos_antes: Record<string, unknown> | null;
  datos_despues: Record<string, unknown> | null;
  campos_modificados: string[] | null;
  ip_address: string | null;
  created_at: string;
}

const accionConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  CREATE: { label: 'Crear', variant: 'default' },
  UPDATE: { label: 'Actualizar', variant: 'secondary' },
  DELETE: { label: 'Eliminar', variant: 'destructive' },
  RESTORE: { label: 'Restaurar', variant: 'outline' },
};

const formatFecha = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const LIMIT = 20;

export default function AdminAuditoriaPage() {
  const { isAdmin, isHydrated } = useRequireAdmin();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroTabla, setFiltroTabla] = useState<string>('todos');
  const [filtroAccion, setFiltroAccion] = useState<string>('todos');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // Modal para ver detalles
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [logSeleccionado, setLogSeleccionado] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        limit: LIMIT.toString(),
        offset: offset.toString(),
      });

      if (filtroTabla !== 'todos') params.append('tabla', filtroTabla);
      if (filtroAccion !== 'todos') params.append('accion', filtroAccion);

      const response = await api.get<AuditLog[]>(`/audit/logs?${params}`);
      const data = Array.isArray(response.data) ? response.data : [];
      setLogs(data);
      setHasMore(data.length === LIMIT);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setLogs([]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [offset, filtroTabla, filtroAccion]);

  useEffect(() => {
    if (isAdmin && isHydrated) {
      fetchLogs();
    }
  }, [isAdmin, isHydrated, fetchLogs]);

  const logsFiltrados = logs.filter((log) => {
    if (busqueda) {
      const searchLower = busqueda.toLowerCase();
      return (
        log.tabla.toLowerCase().includes(searchLower) ||
        log.registro_id.includes(searchLower) ||
        log.usuario_email?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const verDetalle = (log: AuditLog) => {
    setLogSeleccionado(log);
    setDetalleModalOpen(true);
  };

  if (!isHydrated || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tablas = ['usuarios', 'productos', 'producto_variantes', 'reservas', 'colores', 'talles'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Auditoria del Sistema</h1>
          <p className="text-muted-foreground">Historial de cambios y acciones</p>
        </div>
        <Badge variant="outline" className="text-sm">
          {logs.length} registros
        </Badge>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por tabla, ID o usuario..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroTabla} onValueChange={(v) => { setFiltroTabla(v); setOffset(0); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Tabla" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las tablas</SelectItem>
            {tablas.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filtroAccion} onValueChange={(v) => { setFiltroAccion(v); setOffset(0); }}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Accion" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas</SelectItem>
            <SelectItem value="CREATE">Crear</SelectItem>
            <SelectItem value="UPDATE">Actualizar</SelectItem>
            <SelectItem value="DELETE">Eliminar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
          <CardDescription>
            Mostrando {logsFiltrados.length} registros
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="rounded-full bg-muted p-4">
                {error.toLowerCase().includes('network') ? (
                  <WifiOff className="h-8 w-8 text-muted-foreground" />
                ) : error.toLowerCase().includes('500') ? (
                  <ServerCrash className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                )}
              </div>
              <div className="text-center">
                <p className="font-medium mb-1">
                  {error.toLowerCase().includes('network')
                    ? 'Sin conexion al servidor'
                    : 'Error al cargar los logs'}
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {error.toLowerCase().includes('network')
                    ? 'Verifica que el backend este corriendo'
                    : error}
                </p>
              </div>
              <Button onClick={fetchLogs} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </Button>
            </div>
          ) : logsFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay registros de auditoria</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Accion</TableHead>
                      <TableHead>Tabla</TableHead>
                      <TableHead>Registro ID</TableHead>
                      <TableHead className="text-right">Detalle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logsFiltrados.map((log) => {
                      const config = accionConfig[log.accion] || { label: log.accion, variant: 'outline' as const };
                      return (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                            {formatFecha(log.created_at)}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">
                              {log.usuario_email || 'Sistema'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant={config.variant}>{config.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                              {log.tabla}
                            </code>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.registro_id}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => verDetalle(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginacion */}
              {(offset > 0 || hasMore) && (
                <div className="flex items-center justify-between pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Pagina {Math.floor(offset / LIMIT) + 1}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOffset((o) => Math.max(0, o - LIMIT))}
                      disabled={offset === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setOffset((o) => o + LIMIT)}
                      disabled={!hasMore}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal Detalle */}
      <Dialog open={detalleModalOpen} onOpenChange={setDetalleModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle del Registro</DialogTitle>
            <DialogDescription>
              {logSeleccionado && (
                <>
                  {accionConfig[logSeleccionado.accion]?.label || logSeleccionado.accion} en{' '}
                  <code>{logSeleccionado.tabla}</code> #{logSeleccionado.registro_id}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {logSeleccionado && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fecha</p>
                  <p className="font-medium">{formatFecha(logSeleccionado.created_at)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Usuario</p>
                  <p className="font-medium">{logSeleccionado.usuario_email || 'Sistema'}</p>
                </div>
                {logSeleccionado.ip_address && (
                  <div>
                    <p className="text-muted-foreground">IP</p>
                    <p className="font-mono text-xs">{logSeleccionado.ip_address}</p>
                  </div>
                )}
              </div>

              {logSeleccionado.campos_modificados && logSeleccionado.campos_modificados.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Campos modificados</p>
                  <div className="flex flex-wrap gap-1">
                    {logSeleccionado.campos_modificados.map((campo) => (
                      <Badge key={campo} variant="outline" className="text-xs">
                        {campo}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {logSeleccionado.datos_antes && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Datos anteriores</p>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(logSeleccionado.datos_antes, null, 2)}
                  </pre>
                </div>
              )}

              {logSeleccionado.datos_despues && (
                <div>
                  <p className="text-muted-foreground text-sm mb-2">Datos nuevos</p>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(logSeleccionado.datos_despues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
