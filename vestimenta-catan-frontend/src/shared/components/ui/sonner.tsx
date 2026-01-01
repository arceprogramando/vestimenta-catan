'use client';

import { Toaster as SonnerToaster, toast } from 'sonner';
import { useTheme } from 'next-themes';

/**
 * Toaster Component - Accesible por defecto
 *
 * Sonner incluye soporte ARIA nativo:
 * - aria-live="polite" para notificaciones normales
 * - role="alert" para errores
 * - Foco manejado correctamente
 * - Anuncios para screen readers
 */
export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as 'light' | 'dark' | 'system'}
      position="bottom-right"
      toastOptions={{
        // Duraciones accesibles (no muy rapidas)
        duration: 5000,
        // Estilos consistentes con el tema
        classNames: {
          toast:
            'group toast bg-background text-foreground border-border shadow-lg',
          title: 'text-foreground font-semibold',
          description: 'text-muted-foreground',
          actionButton:
            'bg-primary text-primary-foreground hover:bg-primary/90',
          cancelButton:
            'bg-muted text-muted-foreground hover:bg-muted/90',
          error: 'bg-destructive text-destructive-foreground border-destructive',
          success: 'bg-green-500 text-white border-green-600',
          warning: 'bg-yellow-500 text-white border-yellow-600',
          info: 'bg-blue-500 text-white border-blue-600',
        },
      }}
      // Configuracion de accesibilidad
      closeButton
      richColors
      expand
    />
  );
}

// Re-exportar toast para uso conveniente
export { toast };
