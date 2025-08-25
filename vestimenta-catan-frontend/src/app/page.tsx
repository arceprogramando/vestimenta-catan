'use client';

import { useEffect, useState } from 'react';

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
        const response = await fetch('http://localhost:3000/api/productos/stock-resumen');
        
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Cargando productos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500 text-xl">
          Error: {error}
          <br />
          <span className="text-sm text-gray-500">
            Verifica que la API esté corriendo en http://localhost:3000
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Vestimenta Catán - Stock Resumen
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productos.map((producto) => (
            <div
              key={producto.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <img
                  src={producto.thumbnail}
                  alt={producto.nombre}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-image.jpg';
                  }}
                />
              </div>
              
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {producto.nombre}
                </h3>
                
                <p className="text-gray-600 mb-2">
                  {producto.descripcion}
                </p>
                
                <div className="flex justify-between items-center">
                  <span className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                    {producto.genero}
                  </span>
                  
                  <span className="text-lg font-bold text-green-600">
                    Stock: {producto.stock_total}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {productos.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No hay productos disponibles
          </div>
        )}
      </div>
    </div>
  );
}
