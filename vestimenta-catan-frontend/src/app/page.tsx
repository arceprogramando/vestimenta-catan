'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Loader2 } from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  genero: string;
  descripcion: string;
  thumbnail: string;
  stock_total: number;
}

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          'http://localhost:3000/api/productos/stock-resumen'
        );

        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setProductos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
        console.error('Error fetching productos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Vestimenta Catán
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ropa térmica de calidad para toda la familia.
            Perfecta para el frío patagónico.
          </p>
          <Button size="lg" asChild>
            <Link href="/productos">
              <ShoppingBag className="mr-2 h-5 w-5" />
              Ver Productos
            </Link>
          </Button>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            Nuestros Productos
          </h2>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Cargando productos...</span>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-destructive mb-2">Error: {error}</p>
              <p className="text-sm text-muted-foreground">
                Verifica que la API esté corriendo en http://localhost:3000
              </p>
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productos.map((producto) => (
                <Card key={producto.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative bg-muted">
                    <img
                      src={producto.thumbnail}
                      alt={producto.nombre}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/images/products/remera-termica-hombre-1.jpeg';
                      }}
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                      {producto.nombre}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {producto.descripcion}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="inline-block bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded capitalize">
                        {producto.genero}
                      </span>
                      <span className={`text-sm font-medium ${producto.stock_total > 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {producto.stock_total > 0 ? `Stock: ${producto.stock_total}` : 'Sin stock'}
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Button className="w-full" variant="outline" asChild>
                      <Link href={`/productos/${producto.id}`}>
                        Ver detalle
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {!loading && !error && productos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No hay productos disponibles
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-12 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
            Categorías
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Hombre', href: '/productos?genero=hombre', emoji: '👔' },
              { name: 'Mujer', href: '/productos?genero=mujer', emoji: '👗' },
              { name: 'Niños', href: '/productos?genero=ninos', emoji: '🧒' },
            ].map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group"
              >
                <Card className="text-center p-8 hover:shadow-lg transition-all hover:scale-105">
                  <span className="text-5xl mb-4 block">{category.emoji}</span>
                  <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
