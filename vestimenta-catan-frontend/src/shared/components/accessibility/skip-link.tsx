'use client';

import { cn } from '@/lib/utils';

interface SkipLinkProps {
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Skip Link Component - WCAG 2.4.1
 *
 * Permite a usuarios de teclado y screen readers saltar
 * directamente al contenido principal, evitando la navegacion repetitiva.
 *
 * El link es invisible hasta que recibe focus con Tab.
 */
export function SkipLink({
  href = '#main-content',
  className,
  children = 'Saltar al contenido principal',
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        // Oculto por defecto
        'sr-only',
        // Visible cuando tiene focus
        'focus:not-sr-only',
        'focus:fixed focus:top-4 focus:left-4 focus:z-[9999]',
        'focus:px-4 focus:py-2',
        'focus:bg-primary focus:text-primary-foreground',
        'focus:rounded-md focus:shadow-lg',
        'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        'focus:font-medium focus:text-sm',
        // Transicion suave
        'transition-all duration-150',
        className
      )}
    >
      {children}
    </a>
  );
}
