import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { Producto } from '@/types/producto';
import { ProductosContent } from '@/app/productos/_components/productos-content';

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

export default async function ProductosPage() {
  const productos = await getProductos();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Productos</h1>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Cargando filtros...</span>
          </div>
        }
      >
        <ProductosContent initialProductos={productos} />
      </Suspense>
    </div>
  );
}
