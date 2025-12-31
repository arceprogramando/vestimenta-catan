'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="rounded-full bg-muted p-6">
        <AlertTriangle className="h-12 w-12 text-destructive" />
      </div>
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">Error en el panel</h2>
        <p className="text-muted-foreground">{error.message}</p>
      </div>
      <Button onClick={reset} variant="outline" className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Reintentar
      </Button>
    </div>
  );
}
