import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductImage } from '@/components/product-image';
import { Producto } from '@/types/producto';

interface ProductCardProps {
  producto: Producto;
}

function formatGenero(genero: string): string {
  if (genero === 'ninios') return 'Niños';
  return genero.charAt(0).toUpperCase() + genero.slice(1);
}

export function ProductCard({ producto }: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
      <div className="aspect-square relative bg-muted overflow-hidden">
        <ProductImage
          src={producto.thumbnail}
          alt={producto.nombre}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-lg mb-1 line-clamp-1">
          {producto.nombre}
        </h3>
        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
          {producto.descripcion}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <span className="inline-block bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
            {formatGenero(producto.genero)}
          </span>
          <span className={`text-sm font-medium ${(producto.stock_total ?? 0) > 0 ? 'text-success' : 'text-destructive'}`}>
            {(producto.stock_total ?? 0) > 0 ? `Stock: ${producto.stock_total}` : 'Sin stock'}
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
  );
}
