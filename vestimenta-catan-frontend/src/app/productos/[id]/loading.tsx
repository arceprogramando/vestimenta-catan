import { Loader2 } from 'lucide-react';

export default function ProductoDetalleLoading() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando producto...</span>
      </div>
    </div>
  );
}
