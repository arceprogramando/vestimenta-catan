'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ShoppingCart, CheckCircle } from 'lucide-react';
import { useReservas } from '@/hooks/use-reservas';
import { useAuth } from '@/hooks/use-auth';
import { FormError } from '@/components/form';
import { useLiveRegion } from '@/components/accessibility';

interface ReservaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  varianteId: number;
  productoNombre: string;
  talleName?: string;
  colorName?: string;
  stockDisponible: number;
  precioUnitario?: number | null;
}

export function ReservaModal({
  open,
  onOpenChange,
  varianteId,
  productoNombre,
  talleName,
  colorName,
  stockDisponible,
  precioUnitario,
}: ReservaModalProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { createReserva, isLoading, error, clearError } = useReservas();
  const { announce } = useLiveRegion();

  const [cantidad, setCantidad] = useState(1);
  const [telefono, setTelefono] = useState('');
  const [notas, setNotas] = useState('');
  const [success, setSuccess] = useState(false);
  const [reservaId, setReservaId] = useState<number | null>(null);

  const precioTotal = precioUnitario ? precioUnitario * cantidad : null;

  const formatPrecio = (precio: number | null) => {
    if (precio === null) return '-';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(precio);
  };

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      clearError();
      const reserva = await createReserva({
        variante_id: varianteId,
        cantidad,
        telefono_contacto: telefono || undefined,
        notas: notas || undefined,
      });
      setSuccess(true);
      setReservaId(reserva.id);
      // Anunciar exito a screen readers
      announce(`Pedido numero ${reserva.id} realizado correctamente`);
    } catch {
      // Error ya manejado en el store
      announce('Error al procesar el pedido', 'assertive');
    }
  };

  const handleClose = () => {
    if (success) {
      setCantidad(1);
      setTelefono('');
      setNotas('');
      setSuccess(false);
      setReservaId(null);
    }
    clearError();
    onOpenChange(false);
  };

  const handleVerReservas = () => {
    handleClose();
    router.push('/mis-reservas');
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-10 w-10 text-success" />
            </div>
            <DialogTitle className="text-center">Pedido realizado</DialogTitle>
            <DialogDescription className="text-center">
              Tu pedido #{reservaId} ha sido registrado correctamente.
              Te contactaremos pronto para confirmar la disponibilidad.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={handleClose} className="w-full sm:w-auto">
              Seguir comprando
            </Button>
            <Button onClick={handleVerReservas} className="w-full sm:w-auto">
              Ver mis pedidos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Realizar pedido</DialogTitle>
          <DialogDescription>
            Completa los datos para reservar este producto. Te contactaremos para confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info del producto */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="font-medium">{productoNombre}</p>
            <div className="flex gap-2 text-sm text-muted-foreground mt-1">
              {talleName && <span>Talle: {talleName}</span>}
              {colorName && <span className="capitalize">Color: {colorName}</span>}
            </div>
            {precioUnitario && (
              <p className="text-lg font-bold mt-2">{formatPrecio(precioUnitario)}</p>
            )}
          </div>

          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="cantidad">Cantidad</Label>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                disabled={cantidad <= 1}
                aria-label="Disminuir cantidad"
              >
                <span aria-hidden="true">-</span>
              </Button>
              <Input
                id="cantidad"
                type="number"
                min={1}
                max={stockDisponible}
                value={cantidad}
                onChange={(e) => setCantidad(Math.min(stockDisponible, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-20 text-center"
                aria-describedby="cantidad-hint"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setCantidad(Math.min(stockDisponible, cantidad + 1))}
                disabled={cantidad >= stockDisponible}
                aria-label="Aumentar cantidad"
              >
                <span aria-hidden="true">+</span>
              </Button>
              <span id="cantidad-hint" className="text-sm text-muted-foreground">
                (max: {stockDisponible})
              </span>
            </div>
          </div>

          {/* Total */}
          {precioTotal && (
            <div className="flex justify-between items-center py-2 border-t">
              <span className="font-medium">Total:</span>
              <span className="text-xl font-bold">{formatPrecio(precioTotal)}</span>
            </div>
          )}

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="telefono">Telefono de contacto (opcional)</Label>
            <Input
              id="telefono"
              type="tel"
              placeholder="+54 9 2972 123456"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas adicionales (opcional)</Label>
            <Textarea
              id="notas"
              placeholder="Ej: Preferencia de horario para retiro..."
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error */}
          <FormError id="reserva-error" message={error} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || cantidad < 1}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Confirmar pedido
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
