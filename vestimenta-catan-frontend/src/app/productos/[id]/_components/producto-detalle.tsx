'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { ReservaModal } from '@/app/productos/[id]/_components/reserva-modal';
import { ProductImage } from '@/components/product-image';

interface Variante {
  id: number;
  color_id: number;
  talle_id: number | null;
  cantidad: number;
  color: {
    id: number;
    nombre: string;
  };
  talle: {
    id: number;
    nombre: string;
    orden: number;
  } | null;
}

interface Producto {
  id: number;
  nombre: string;
  genero: string;
  descripcion: string;
  thumbnail: string;
  is_active: boolean;
  precio: number | null;
  producto_variantes: Variante[];
}

interface ProductoDetalleProps {
  producto: Producto;
}

export function ProductoDetalle({ producto }: ProductoDetalleProps) {
  const [selectedTalle, setSelectedTalle] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Obtener talles y colores unicos
  const talles = producto.producto_variantes
    .filter(v => v.talle)
    .map(v => v.talle!)
    .filter((talle, index, self) =>
      index === self.findIndex(t => t.id === talle.id)
    )
    .sort((a, b) => (a.orden || 0) - (b.orden || 0));

  const colores = producto.producto_variantes
    .map(v => v.color)
    .filter((color, index, self) =>
      index === self.findIndex(c => c.id === color.id)
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre));

  // Obtener variante seleccionada
  const varianteSeleccionada = producto.producto_variantes.find(v =>
    (selectedTalle === null ? v.talle === null : v.talle?.id === selectedTalle) &&
    v.color.id === selectedColor
  );

  // Stock disponible para la combinacion seleccionada
  const stockDisponible = varianteSeleccionada?.cantidad || 0;

  const formatGenero = (genero: string) => {
    switch (genero) {
      case 'ninios': return 'Ninos';
      case 'hombre': return 'Hombre';
      case 'mujer': return 'Mujer';
      default: return genero;
    }
  };

  const formatPrecio = (precio: number | null) => {
    if (precio === null) return null;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(precio);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Button variant="ghost" asChild className="pl-0">
          <Link href="/productos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Link>
        </Button>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Imagen */}
        <div className="aspect-square relative bg-muted rounded-lg overflow-hidden">
          <ProductImage
            src={producto.thumbnail}
            alt={producto.nombre}
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Info */}
        <div>
          <span className="inline-block bg-secondary text-secondary-foreground text-sm px-3 py-1 rounded-full mb-4">
            {formatGenero(producto.genero)}
          </span>

          <h1 className="text-3xl font-bold mb-2">{producto.nombre}</h1>

          {/* Precio */}
          {producto.precio && (
            <p className="text-3xl font-bold text-primary mb-4">
              {formatPrecio(producto.precio)}
            </p>
          )}

          <p className="text-muted-foreground mb-6">{producto.descripcion}</p>

          {/* Selector de Talle */}
          {talles.length > 0 && (
            <div className="mb-6" role="group" aria-labelledby="talle-label">
              <h3 id="talle-label" className="font-semibold mb-3">Talle</h3>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Seleccionar talle">
                {talles.map((talle) => {
                  const tieneStock = producto.producto_variantes.some(
                    v => v.talle?.id === talle.id && v.cantidad > 0
                  );
                  const isSelected = selectedTalle === talle.id;
                  return (
                    <Button
                      key={talle.id}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => setSelectedTalle(talle.id)}
                      disabled={!tieneStock}
                      className="min-w-15"
                      aria-pressed={isSelected}
                      aria-label={`Talle ${talle.nombre}${!tieneStock ? ', sin stock' : ''}`}
                    >
                      {talle.nombre}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selector de Color */}
          {colores.length > 0 && (
            <div className="mb-6" role="group" aria-labelledby="color-label">
              <h3 id="color-label" className="font-semibold mb-3">Color</h3>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Seleccionar color">
                {colores.map((color) => {
                  const tieneStock = producto.producto_variantes.some(
                    v => v.color.id === color.id &&
                    (selectedTalle === null || v.talle?.id === selectedTalle) &&
                    v.cantidad > 0
                  );
                  const isSelected = selectedColor === color.id;
                  return (
                    <Button
                      key={color.id}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => setSelectedColor(color.id)}
                      disabled={!tieneStock}
                      className="capitalize"
                      aria-pressed={isSelected}
                      aria-label={`Color ${color.nombre}${!tieneStock ? ', sin stock' : ''}`}
                    >
                      {color.nombre}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stock */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                {selectedColor && (talles.length === 0 || selectedTalle) ? (
                  <span className={stockDisponible > 0 ? 'text-success' : 'text-destructive'}>
                    {stockDisponible > 0
                      ? `${stockDisponible} unidades disponibles`
                      : 'Sin stock para esta combinacion'
                    }
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Selecciona {talles.length > 0 && !selectedTalle ? 'un talle y ' : ''}un color para ver disponibilidad
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Boton Reservar */}
          <Button
            size="lg"
            className="w-full"
            disabled={!varianteSeleccionada || stockDisponible === 0}
            onClick={() => setModalOpen(true)}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {stockDisponible > 0 ? 'Reservar producto' : 'Sin stock'}
          </Button>

          {/* Info adicional */}
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Las reservas requieren confirmacion
          </p>
        </div>
      </div>

      {/* Tabla de stock por variante */}
      <div className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Disponibilidad por variante</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                {talles.length > 0 && <th className="text-left p-3">Talle</th>}
                <th className="text-left p-3">Color</th>
                <th className="text-right p-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {producto.producto_variantes
                .filter(v => v.cantidad > 0)
                .sort((a, b) => {
                  const talleOrder = (a.talle?.orden || 0) - (b.talle?.orden || 0);
                  if (talleOrder !== 0) return talleOrder;
                  return a.color.nombre.localeCompare(b.color.nombre);
                })
                .map((variante) => (
                  <tr key={variante.id} className="border-b hover:bg-muted/50">
                    {talles.length > 0 && (
                      <td className="p-3">{variante.talle?.nombre || '-'}</td>
                    )}
                    <td className="p-3 capitalize">{variante.color.nombre}</td>
                    <td className="p-3 text-right">
                      <span className={variante.cantidad > 5 ? 'text-success' : 'text-orange-600'}>
                        {variante.cantidad}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Reserva */}
      {varianteSeleccionada && (
        <ReservaModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          varianteId={varianteSeleccionada.id}
          productoNombre={producto.nombre}
          talleName={varianteSeleccionada.talle?.nombre}
          colorName={varianteSeleccionada.color.nombre}
          stockDisponible={stockDisponible}
          precioUnitario={producto.precio}
        />
      )}
    </div>
  );
}
