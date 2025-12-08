'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Package, ShoppingBag } from 'lucide-react';

export default function MisReservasPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  if (!isAuthenticated) {
    return null;
  }

  // TODO: Implementar fetch de reservas reales
  const reservas: any[] = [];

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Mis Reservas</h1>

      {reservas.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No tienes reservas</h2>
            <p className="text-muted-foreground mb-6">
              Aún no has realizado ninguna reserva de productos.
            </p>
            <Button asChild>
              <Link href="/productos">
                <ShoppingBag className="mr-2 h-4 w-4" />
                Ver Productos
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reservas.map((reserva) => (
            <Card key={reserva.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Reserva #{reserva.id}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(reserva.created_at).toLocaleDateString('es-AR')}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded text-sm ${
                    reserva.estado === 'completada' ? 'bg-green-100 text-green-800' :
                    reserva.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {reserva.estado}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {/* Detalles de la reserva */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
