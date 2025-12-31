import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingBag } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { Producto } from '@/types/producto';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

async function getProductos(): Promise<Producto[]> {
  try {
    const res = await fetch(`${API_URL}/productos/stock-resumen`, {
      next: { revalidate: 60 }, // Revalidar cada 60 segundos (ISR)
    });

    if (!res.ok) {
      throw new Error('Error al cargar productos');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching productos:', error);
    return [];
  }
}

export default async function Home() {
  const productos = await getProductos();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-linear-to-b from-primary/10 to-background py-12 md:py-20">
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

          {productos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {productos.map((producto) => (
                <ProductCard key={producto.id} producto={producto} />
              ))}
            </div>
          ) : (
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
              { name: 'Niños', href: '/productos?genero=ninios', emoji: '🧒' },
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
