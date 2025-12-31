import { notFound } from 'next/navigation';
import { ProductoDetalle } from '@/app/productos/[id]/_components/producto-detalle';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

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

async function getProducto(id: string): Promise<Producto | null> {
  try {
    const res = await fetch(`${API_URL}/productos/${id}`, {
      next: { revalidate: 60 }, // Revalidar cada 60 segundos (ISR)
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error('Error al cargar producto');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching producto:', error);
    return null;
  }
}

// Generar metadata dinámica para SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await getProducto(id);

  if (!producto) {
    return {
      title: 'Producto no encontrado',
    };
  }

  return {
    title: `${producto.nombre} | Vestimenta Catán`,
    description: producto.descripcion || `${producto.nombre} - Ropa térmica de calidad`,
  };
}

export default async function ProductoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const producto = await getProducto(id);

  if (!producto) {
    notFound();
  }

  return <ProductoDetalle producto={producto} />;
}
