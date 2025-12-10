'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { ReservaModal } from '@/components/reservas/ReservaModal';

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

export default function ProductoDetallePage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [producto, setProducto] = useState<Producto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTalle, setSelectedTalle] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchProducto = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:3000/api/productos/${productId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Producto no encontrado');
          }
          throw new Error('Error al cargar el producto');
        }
        const data = await response.json();
        setProducto(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProducto();
    }
  }, [productId]);

  // Obtener talles y colores unicos
  const talles = producto?.producto_variantes
    .filter(v => v.talle)
    .map(v => v.talle!)
    .filter((talle, index, self) =>
      index === self.findIndex(t => t.id === talle.id)
    )
    .sort((a, b) => (a.orden || 0) - (b.orden || 0)) || [];

  const colores = producto?.producto_variantes
    .map(v => v.color)
    .filter((color, index, self) =>
      index === self.findIndex(c => c.id === color.id)
    )
    .sort((a, b) => a.nombre.localeCompare(b.nombre)) || [];

  // Obtener variante seleccionada
  const varianteSeleccionada = producto?.producto_variantes.find(v =>
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Cargando producto...</span>
        </div>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            {error || 'Producto no encontrado'}
          </h1>
          <Button onClick={() => router.push('/productos')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Button>
        </div>
      </div>
    );
  }

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
          <img
            src={producto.thumbnail}
            alt={producto.nombre}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/images/products/remera-termica-hombre-1.jpeg';
            }}
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
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Talle</h3>
              <div className="flex flex-wrap gap-2">
                {talles.map((talle) => {
                  const tieneStock = producto.producto_variantes.some(
                    v => v.talle?.id === talle.id && v.cantidad > 0
                  );
                  return (
                    <Button
                      key={talle.id}
                      variant={selectedTalle === talle.id ? 'default' : 'outline'}
                      onClick={() => setSelectedTalle(talle.id)}
                      disabled={!tieneStock}
                      className="min-w-[60px]"
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
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Color</h3>
              <div className="flex flex-wrap gap-2">
                {colores.map((color) => {
                  const tieneStock = producto.producto_variantes.some(
                    v => v.color.id === color.id &&
                    (selectedTalle === null || v.talle?.id === selectedTalle) &&
                    v.cantidad > 0
                  );
                  return (
                    <Button
                      key={color.id}
                      variant={selectedColor === color.id ? 'default' : 'outline'}
                      onClick={() => setSelectedColor(color.id)}
                      disabled={!tieneStock}
                      className="capitalize"
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
                  <span className={stockDisponible > 0 ? 'text-green-600' : 'text-destructive'}>
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
                      <span className={variante.cantidad > 5 ? 'text-green-600' : 'text-orange-500'}>
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
