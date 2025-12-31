'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, ShoppingBag, Loader2, Phone, AlertCircle } from 'lucide-react';
import { useRequireAuth } from '@/hooks/use-auth';
import { useReservas } from '@/hooks/use-reservas';
import { ProductImage } from '@/components/product-image';
import type { EstadoReserva } from '@/types/reserva';

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

export default function MisReservasPage() {
  const { isAuthenticated, isHydrated } = useRequireAuth();
  const { reservas, isLoading, error, fetchMisReservas } = useReservas();

  useEffect(() => {
    if (isAuthenticated && isHydrated) {
      fetchMisReservas();
    }
  }, [isAuthenticated, isHydrated, fetchMisReservas]);

  if (!isHydrated || !isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Mis Reservas</h1>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando reservas...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Mis Reservas</h1>
        <Card className="text-center py-12">
          <CardContent>
            <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error al cargar reservas</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => fetchMisReservas()}>Reintentar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Mis Reservas</h1>

      {reservas.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No tienes reservas</h2>
            <p className="text-muted-foreground mb-6">
              Aun no has realizado ninguna reserva de productos.
            </p>
            <Button asChild>
              <Link href="/productos">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Ver Productos
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reservas.map((reserva) => {
            const config = estadoConfig[reserva.estado];
            const producto = reserva.variante?.producto;
            const talle = reserva.variante?.talle;
            const color = reserva.variante?.color;

            return (
              <Card key={reserva.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
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
                    {reserva.precio_total && (
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatPrecio(reserva.precio_total)}</p>
                        <p className="text-sm text-muted-foreground">
                          {reserva.cantidad} x {formatPrecio(reserva.precio_unitario)}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <div className="w-24 h-24 relative rounded-md overflow-hidden bg-muted shrink-0">
                      <ProductImage
                        src={producto?.thumbnail}
                        alt={producto?.nombre || 'Producto'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{producto?.nombre || 'Producto'}</h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {producto?.genero && (
                          <Badge variant="outline">{formatGenero(producto.genero)}</Badge>
                        )}
                        {talle && <Badge variant="outline">Talle {talle.nombre}</Badge>}
                        {color && <Badge variant="outline" className="capitalize">{color.nombre}</Badge>}
                        <Badge variant="outline">Cantidad: {reserva.cantidad}</Badge>
                      </div>
                      {reserva.notas && (
                        <p className="text-sm text-muted-foreground mt-2">
                          <strong>Notas:</strong> {reserva.notas}
                        </p>
                      )}
                      {reserva.telefono_contacto && (
                        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {reserva.telefono_contacto}
                        </p>
                      )}
                      {reserva.estado === 'cancelado' && reserva.motivo_cancelacion && (
                        <p className="text-sm text-destructive mt-2">
                          <strong>Motivo de cancelacion:</strong> {reserva.motivo_cancelacion}
                        </p>
                      )}
                      {reserva.estado === 'confirmado' && reserva.fecha_confirmacion && (
                        <p className="text-sm text-green-600 mt-2">
                          Confirmado el {formatFecha(reserva.fecha_confirmacion)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
