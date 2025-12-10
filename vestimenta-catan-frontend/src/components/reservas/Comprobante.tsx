'use client';

import { forwardRef } from 'react';
import type { Reserva } from '@/types/reserva';

interface ComprobanteProps {
  reserva: Reserva;
}

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

const formatFechaCorta = (fecha: string) => {
  return new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const Comprobante = forwardRef<HTMLDivElement, ComprobanteProps>(
  ({ reserva }, ref) => {
    const producto = reserva.variante?.producto;
    const talle = reserva.variante?.talle;
    const color = reserva.variante?.color;
    const usuario = reserva.usuario;

    return (
      <div
        ref={ref}
        className="bg-white text-black p-8 max-w-[800px] mx-auto"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">VESTIMENTA CATAN</h1>
              <p className="text-sm text-gray-600">Ropa Termica</p>
              <p className="text-sm text-gray-600">San Martin de los Andes, Neuquen</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">COMPROBANTE</p>
              <p className="text-2xl font-bold text-gray-700">#{reserva.id}</p>
            </div>
          </div>
        </div>

        {/* Info del pedido */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h2 className="font-bold text-sm text-gray-500 uppercase mb-2">Datos del Cliente</h2>
            <div className="space-y-1">
              {usuario ? (
                <>
                  <p className="font-semibold">
                    {usuario.nombre || usuario.apellido
                      ? `${usuario.nombre || ''} ${usuario.apellido || ''}`
                      : 'Sin nombre'}
                  </p>
                  <p className="text-sm">{usuario.email}</p>
                </>
              ) : (
                <p className="text-sm text-gray-500">Cliente no registrado</p>
              )}
              {reserva.telefono_contacto && (
                <p className="text-sm">Tel: {reserva.telefono_contacto}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-sm text-gray-500 uppercase mb-2">Fecha del Pedido</h2>
            <p className="font-semibold">{formatFecha(reserva.fecha_reserva)}</p>
            {reserva.estado === 'confirmado' && reserva.fecha_confirmacion && (
              <p className="text-sm text-gray-600 mt-2">
                Confirmado: {formatFechaCorta(reserva.fecha_confirmacion)}
              </p>
            )}
            {reserva.estado === 'completado' && (
              <p className="text-sm text-green-700 font-semibold mt-2">
                COMPLETADO
              </p>
            )}
          </div>
        </div>

        {/* Tabla de productos */}
        <table className="w-full mb-6">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="text-left py-2 font-bold">Producto</th>
              <th className="text-center py-2 font-bold">Cant.</th>
              <th className="text-right py-2 font-bold">P. Unit.</th>
              <th className="text-right py-2 font-bold">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-200">
              <td className="py-3">
                <p className="font-semibold">{producto?.nombre || 'Producto'}</p>
                <div className="text-sm text-gray-600 space-x-2">
                  {producto?.genero && <span>{formatGenero(producto.genero)}</span>}
                  {talle && <span>| Talle {talle.nombre}</span>}
                  {color && <span className="capitalize">| {color.nombre}</span>}
                </div>
              </td>
              <td className="py-3 text-center">{reserva.cantidad}</td>
              <td className="py-3 text-right">{formatPrecio(reserva.precio_unitario)}</td>
              <td className="py-3 text-right font-semibold">{formatPrecio(reserva.precio_total)}</td>
            </tr>
          </tbody>
        </table>

        {/* Total */}
        <div className="border-t-2 border-black pt-4 mb-6">
          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between py-1">
                <span>Subtotal:</span>
                <span>{formatPrecio(reserva.precio_total)}</span>
              </div>
              <div className="flex justify-between py-2 text-xl font-bold border-t border-gray-300 mt-2">
                <span>TOTAL:</span>
                <span>{formatPrecio(reserva.precio_total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notas */}
        {reserva.notas && (
          <div className="bg-gray-100 p-4 rounded mb-6">
            <p className="text-sm font-bold text-gray-500 mb-1">Notas del cliente:</p>
            <p className="text-sm">{reserva.notas}</p>
          </div>
        )}

        {/* Estado */}
        <div className="text-center py-4 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Estado del pedido:{' '}
            <span className={`font-bold uppercase ${
              reserva.estado === 'completado' ? 'text-green-700' :
              reserva.estado === 'confirmado' ? 'text-blue-700' :
              reserva.estado === 'cancelado' ? 'text-red-700' :
              'text-yellow-700'
            }`}>
              {reserva.estado}
            </span>
          </p>
          {reserva.confirmado_por && (
            <p className="text-xs text-gray-400 mt-1">
              Confirmado por: {reserva.confirmado_por}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>Gracias por su compra</p>
          <p className="mt-1">Este comprobante no tiene valor fiscal</p>
        </div>
      </div>
    );
  }
);

Comprobante.displayName = 'Comprobante';
