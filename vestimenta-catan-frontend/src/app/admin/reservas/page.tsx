'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Loader2,
  CheckCircle,
  XCircle,
  Package,
  Phone,
  Mail,
  Search,
  Filter,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useRequireAdmin } from '@/hooks/use-auth';
import { useReservas } from '@/hooks/use-reservas';
import { Comprobante } from '@/components/reservas/Comprobante';
import { ProductImage } from '@/components/product-image';
import type { Reserva, EstadoReserva } from '@/types/reserva';

const estadoConfig: Record<EstadoReserva, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendiente: { label: 'Pendiente', variant: 'secondary' },
  confirmado: { label: 'Confirmado', variant: 'default' },
  completado: { label: 'Completado', variant: 'outline' },
  cancelado: { label: 'Cancelado', variant: 'destructive' },
};

const formatGenero = (genero: string) => {
  switch (genero) {
    case 'ninios': return 'Ninos';
    case 'hombre': return 'Hombre';
    case 'mujer': return 'Mujer';
    default: return genero;
  }
};

const formatPrecio = (precio: number | null) => {
  if (precio === null) return '-';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(precio);
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

const PAGE_SIZE = 10;

export default function AdminReservasPage() {
  const { isAdmin, isHydrated } = useRequireAdmin();
  const {
    reservas,
    isLoading,
    error,
    meta,
    fetchAllReservas,
    confirmarReserva,
    completarReserva,
    cancelarReserva,
  } = useReservas();

  // Paginación server-side
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [reservaACancelar, setReservaACancelar] = useState<Reserva | null>(null);
  const [motivoCancelacion, setMotivoCancelacion] = useState('');
  const [procesando, setProcesando] = useState<number | null>(null);
  const [comprobanteModalOpen, setComprobanteModalOpen] = useState(false);
  const [reservaComprobante, setReservaComprobante] = useState<Reserva | null>(null);
  const comprobanteRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  // Fetch con parámetros server-side
  const fetchData = useCallback(() => {
    if (!isAdmin || !isHydrated) return;

    fetchAllReservas({
      limit: pageSize,
      offset: currentPage * pageSize,
      search: busqueda || undefined,
      estado: filtroEstado !== 'todos' ? filtroEstado as EstadoReserva : undefined,
    });
  }, [isAdmin, isHydrated, fetchAllReservas, currentPage, pageSize, busqueda, filtroEstado]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Debounce para búsqueda
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setBusqueda(value);
      setCurrentPage(0); // Reset a primera página
    }, 300);
  };

  // Cleanup timeout
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Reset página cuando cambia el filtro de estado
  const handleEstadoChange = (value: string) => {
    setFiltroEstado(value);
    setCurrentPage(0);
  };

  // Paginación helpers
  const totalRows = meta?.total ?? 0;
  const pageCount = Math.ceil(totalRows / pageSize);
  const canPreviousPage = currentPage > 0;
  const canNextPage = currentPage < pageCount - 1;

  const handleConfirmar = async (id: number) => {
    setProcesando(id);
    try {
      await confirmarReserva(id);
    } finally {
      setProcesando(null);
    }
  };

  const handleCompletar = async (id: number) => {
    setProcesando(id);
    try {
      await completarReserva(id);
    } finally {
      setProcesando(null);
    }
  };

  const handleCancelar = async () => {
    if (!reservaACancelar) return;

    setProcesando(reservaACancelar.id);
    try {
      await cancelarReserva(reservaACancelar.id, motivoCancelacion);
      setCancelModalOpen(false);
      setReservaACancelar(null);
      setMotivoCancelacion('');
    } finally {
      setProcesando(null);
    }
  };

  const abrirCancelModal = (reserva: Reserva) => {
    setReservaACancelar(reserva);
    setCancelModalOpen(true);
  };

  const abrirComprobante = (reserva: Reserva) => {
    setReservaComprobante(reserva);
    setComprobanteModalOpen(true);
  };

  const handlePrint = () => {
    if (!comprobanteRef.current) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = comprobanteRef.current.innerHTML;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Comprobante #${reservaComprobante?.id}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; }
            @media print {
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!isHydrated || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Contadores
  const pendientes = reservas.filter((r) => r.estado === 'pendiente').length;
  const confirmadas = reservas.filter((r) => r.estado === 'confirmado').length;
  const completadas = reservas.filter((r) => r.estado === 'completado').length;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gestion de Pedidos</h1>
          <p className="text-muted-foreground">
            Administra los pedidos de los clientes
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pendientes</CardDescription>
            <CardTitle className="text-3xl text-yellow-600">
              {pendientes}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Confirmados</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {confirmadas}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completados</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {completadas}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID, producto, cliente..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroEstado} onValueChange={handleEstadoChange}>
          <SelectTrigger className="w-full ssm:w-45">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="confirmado">Confirmados</SelectItem>
            <SelectItem value="completado">Completados</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de reservas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando pedidos...</span>
        </div>
      ) : error ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => fetchAllReservas()}>Reintentar</Button>
          </CardContent>
        </Card>
      ) : reservas.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No hay pedidos</h2>
            <p className="text-muted-foreground">
              {busqueda || filtroEstado !== 'todos'
                ? 'No se encontraron pedidos con los filtros aplicados'
                : 'Aun no hay pedidos registrados'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reservas.map((reserva) => {
            const config = estadoConfig[reserva.estado];
            const producto = reserva.variante?.producto;
            const talle = reserva.variante?.talle;
            const color = reserva.variante?.color;
            const usuario = reserva.usuario;
            const esProcesando = procesando === reserva.id;

            return (
              <Card key={reserva.id}>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Pedido #{reserva.id}
                        <Badge variant={config.variant}>{config.label}</Badge>
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4" />
                        {formatFecha(reserva.fecha_reserva)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      {reserva.precio_total && (
                        <>
                          <p className="text-2xl font-bold">
                            {formatPrecio(reserva.precio_total)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {reserva.cantidad} x{' '}
                            {formatPrecio(reserva.precio_unitario)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Producto */}
                    <div className="flex gap-4">
                      <div className="w-20 h-20 relative rounded-md overflow-hidden bg-muted shrink-0">
                        <ProductImage
                          src={producto?.thumbnail}
                          alt={producto?.nombre || 'Producto'}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {producto?.nombre || 'Producto'}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {producto?.genero && (
                            <Badge variant="outline" className="text-xs">
                              {formatGenero(producto.genero)}
                            </Badge>
                          )}
                          {talle && (
                            <Badge variant="outline" className="text-xs">
                              Talle {talle.nombre}
                            </Badge>
                          )}
                          {color && (
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {color.nombre}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Cantidad: {reserva.cantidad}
                        </p>
                      </div>
                    </div>

                    {/* Cliente */}
                    <div className="bg-muted p-3 rounded-lg">
                      <h4 className="font-medium mb-2">Cliente</h4>
                      {usuario ? (
                        <>
                          <p className="text-sm">
                            {usuario.nombre || usuario.apellido
                              ? `${usuario.nombre || ''} ${
                                  usuario.apellido || ''
                                }`
                              : 'Sin nombre'}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {usuario.email}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Cliente no registrado
                        </p>
                      )}
                      {reserva.telefono_contacto && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {reserva.telefono_contacto}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Notas y estados */}
                  {reserva.notas && (
                    <p className="text-sm text-muted-foreground mt-4">
                      <strong>Notas:</strong> {reserva.notas}
                    </p>
                  )}
                  {reserva.estado === 'cancelado' &&
                    reserva.motivo_cancelacion && (
                      <p className="text-sm text-destructive mt-2">
                        <strong>Motivo de cancelacion:</strong>{' '}
                        {reserva.motivo_cancelacion}
                      </p>
                    )}
                  {reserva.estado === 'confirmado' &&
                    reserva.fecha_confirmacion && (
                      <p className="text-sm text-blue-600 mt-2">
                        Confirmado el {formatFecha(reserva.fecha_confirmacion)}
                        {reserva.confirmado_por &&
                          ` por ${reserva.confirmado_por}`}
                      </p>
                    )}

                  {/* Acciones */}
                  <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                    {reserva.estado === 'pendiente' && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmar(reserva.id)}
                        disabled={esProcesando}
                      >
                        {esProcesando ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Confirmar
                      </Button>
                    )}
                    {reserva.estado === 'confirmado' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCompletar(reserva.id)}
                        disabled={esProcesando}
                      >
                        {esProcesando ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="mr-2 h-4 w-4" />
                        )}
                        Marcar como completado
                      </Button>
                    )}
                    {(reserva.estado === 'pendiente' ||
                      reserva.estado === 'confirmado') && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => abrirCancelModal(reserva)}
                        disabled={esProcesando}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => abrirComprobante(reserva)}
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Comprobante
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Paginación */}
          {totalRows > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {currentPage * pageSize + 1} a{' '}
                {Math.min((currentPage + 1) * pageSize, totalRows)} de {totalRows} pedidos
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={`${pageSize}`}
                  onValueChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(0);
                  }}
                >
                  <SelectTrigger className="h-8 w-17.5">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[10, 20, 30, 50].map((size) => (
                      <SelectItem key={size} value={`${size}`}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(0)}
                    disabled={!canPreviousPage || isLoading}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={!canPreviousPage || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm px-2">
                    {currentPage + 1} / {pageCount || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!canNextPage || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setCurrentPage(pageCount - 1)}
                    disabled={!canNextPage || isLoading}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de cancelacion */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Pedido #{reservaACancelar?.id}</DialogTitle>
            <DialogDescription>
              Esta accion no se puede deshacer. El cliente sera notificado de la
              cancelacion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo de cancelacion</Label>
              <Textarea
                id="motivo"
                placeholder="Ej: Producto no disponible, cliente solicito cancelacion..."
                value={motivoCancelacion}
                onChange={(e) => setMotivoCancelacion(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelModalOpen(false)}
              disabled={procesando !== null}
            >
              Volver
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelar}
              disabled={procesando !== null}
            >
              {procesando !== null ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmar cancelacion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de comprobante */}
      <Dialog
        open={comprobanteModalOpen}
        onOpenChange={setComprobanteModalOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comprobante de Pedido</DialogTitle>
            <DialogDescription>
              Vista previa del comprobante. Haz clic en Imprimir para generar
              una copia.
            </DialogDescription>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden">
            {reservaComprobante && (
              <Comprobante ref={comprobanteRef} reserva={reservaComprobante} />
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setComprobanteModalOpen(false)}
            >
              Cerrar
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
