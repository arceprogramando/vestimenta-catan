'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Loader2,
  History,
  WifiOff,
  RefreshCw,
  ServerCrash,
  AlertTriangle,
} from 'lucide-react';
import { useRequireAdmin } from '@/hooks/use-auth';
import { api } from '@/lib/axios';
import { DataTable } from '@/components/ui/data-table';
import { createColumns } from './_components/columns';
import { AuditLog } from '@/types/admin';

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

export default function AdminAuditoriaPage() {
  const { isAdmin, isHydrated } = useRequireAdmin();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal para ver detalles
  const [detalleModalOpen, setDetalleModalOpen] = useState(false);
  const [logSeleccionado, setLogSeleccionado] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      // Traer todos los logs para que DataTable maneje la paginacion local
      const response = await api.get<AuditLog[]>('/audit/logs?limit=500');
      const data = Array.isArray(response.data) ? response.data : [];
      setLogs(data);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setLogs([]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && isHydrated) {
      fetchLogs();
    }
  }, [isAdmin, isHydrated, fetchLogs]);

  const verDetalle = (log: AuditLog) => {
    setLogSeleccionado(log);
    setDetalleModalOpen(true);
  };

  const columns = useMemo(() => createColumns({
    onVerDetalle: verDetalle,
  }), []);

  const filterableColumns = useMemo(() => [
    {
      id: 'tabla',
      title: 'Tabla',
      options: [
        { label: 'Usuarios', value: 'usuarios' },
        { label: 'Productos', value: 'productos' },
        { label: 'Variantes', value: 'producto_variantes' },
        { label: 'Reservas', value: 'reservas' },
        { label: 'Colores', value: 'colores' },
        { label: 'Talles', value: 'talles' },
      ],
    },
    {
      id: 'accion',
      title: 'Accion',
      options: [
        { label: 'Crear', value: 'CREATE' },
        { label: 'Actualizar', value: 'UPDATE' },
        { label: 'Eliminar', value: 'DELETE' },
      ],
    },
  ], []);

  if (!isHydrated || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

      {/* Tabla */}
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
          <CardDescription>
            Registro de todas las acciones realizadas en el sistema
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
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <History className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No hay registros de auditoria</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={logs}
              searchKey="usuario_email"
              searchPlaceholder="Buscar por tabla, ID o usuario..."
              filterableColumns={filterableColumns}
              pageSize={20}
            />
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
