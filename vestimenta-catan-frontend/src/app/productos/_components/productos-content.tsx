'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { ProductCard } from '@/components/product-card';
import { Producto } from '@/types/producto';

interface ProductosContentProps {
  initialProductos: Producto[];
}

export function ProductosContent({ initialProductos }: ProductosContentProps) {
  const searchParams = useSearchParams();
  const generoFilter = searchParams.get('genero');

  const [filteredProductos, setFilteredProductos] = useState<Producto[]>(initialProductos);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenero, setSelectedGenero] = useState<string>(generoFilter || 'todos');

  useEffect(() => {
    let filtered = initialProductos;

    if (selectedGenero && selectedGenero !== 'todos') {
      filtered = filtered.filter(p =>
        p.genero.toLowerCase() === selectedGenero.toLowerCase()
      );
    }

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
      );
    }

    setFilteredProductos(filtered);
  }, [initialProductos, selectedGenero, searchTerm]);

  useEffect(() => {
    setSelectedGenero(generoFilter || 'todos');
  }, [generoFilter]);

  const generos = ['todos', 'hombre', 'mujer', 'ninios'];

  return (
    <>
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
              {genero === 'todos' ? 'Todos' : genero === 'ninios' ? 'Niños' : genero}
            </Button>
          ))}
        </div>
      </div>

      <p className="text-muted-foreground mb-4">
        {filteredProductos.length} producto(s) encontrado(s)
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProductos.map((producto) => (
          <ProductCard key={producto.id} producto={producto} />
        ))}
      </div>

      {filteredProductos.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No se encontraron productos con los filtros seleccionados
        </div>
      )}
    </>
  );
}
