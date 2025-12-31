import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';

export default function ProductoNotFound() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center">
        <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Producto no encontrado</h1>
        <p className="text-muted-foreground mb-6">
          El producto que buscas no existe o fue eliminado.
        </p>
        <Button asChild>
          <Link href="/productos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a productos
          </Link>
        </Button>
      </div>
    </div>
  );
}
