'use client';

import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  id?: string;
  message?: string | null;
  className?: string;
}

/**
 * Form Error Component - WCAG 3.3.1
 *
 * Muestra mensajes de error de forma accesible:
 * - role="alert" para anuncio inmediato a screen readers
 * - aria-live="assertive" para interrumpir y anunciar
 * - Icono + texto para usuarios visuales
 * - ID para vincular con aria-describedby en inputs
 *
 * @example
 * <Input aria-describedby="email-error" aria-invalid={!!error} />
 * <FormError id="email-error" message={error} />
 */
export function FormError({ id, message, className }: FormErrorProps) {
  if (!message) return null;

  return (
    <div
      id={id}
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex items-center gap-2 text-sm text-destructive',
        'p-3 rounded-md bg-destructive/10',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

interface FormFieldErrorProps {
  id?: string;
  message?: string | null;
  className?: string;
}

/**
 * Form Field Error - Error inline para campos individuales
 *
 * Mas compacto que FormError, ideal para errores de validacion por campo.
 */
export function FormFieldError({ id, message, className }: FormFieldErrorProps) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className={cn('text-sm text-destructive mt-1', className)}
    >
      {message}
    </p>
  );
}
