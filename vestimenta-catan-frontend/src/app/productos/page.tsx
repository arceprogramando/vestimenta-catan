'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, Filter } from 'lucide-react';

interface Producto {
  id: number;
  nombre: string;
  genero: string;
  descripcion: string;
  thumbnail: string;
  stock_total: number;
}

export default function ProductosPage() {
  const searchParams = useSearchParams();
  const generoFilter = searchParams.get('genero');

  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenero, setSelectedGenero] = useState<string>(generoFilter || 'todos');

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:3000/api/productos/stock-resumen');
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();
        setProductos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  useEffect(() => {
    let filtered = productos;

    if (selectedGenero && selectedGenero !== 'todos') {
      filtered = filtered.filter(p =>
        p.genero.toLowerCase() === selectedGenero.toLowerCase()
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProductos(filtered);
  }, [productos, selectedGenero, searchTerm]);

  useEffect(() => {
    if (generoFilter) {
      setSelectedGenero(generoFilter);
    }
  }, [generoFilter]);

  const generos = ['todos', 'hombre', 'mujer', 'ninos'];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Productos</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {generos.map((genero) => (
            <Button
              key={genero}
              variant={selectedGenero === genero ? 'default' : 'outline'}
              onClick={() => setSelectedGenero(genero)}
              className="capitalize"
            >
              {genero === 'todos' ? 'Todos' : genero === 'ninos' ? 'Niños' : genero}
            </Button>
          ))}
        </div>
      </div>

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
            Verifica que la API esté corriendo
          </p>
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="text-muted-foreground mb-4">
            {filteredProductos.length} producto(s) encontrado(s)
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProductos.map((producto) => (
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

          {filteredProductos.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No se encontraron productos con los filtros seleccionados
            </div>
          )}
        </>
      )}
    </div>
  );
}
