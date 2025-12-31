'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center gap-4">
      <AlertTriangle className="h-12 w-12 text-destructive" />
      <h2 className="text-xl font-semibold">Algo salió mal</h2>
      <p className="text-muted-foreground text-center max-w-md">
        {error.message || 'Ocurrió un error inesperado'}
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
