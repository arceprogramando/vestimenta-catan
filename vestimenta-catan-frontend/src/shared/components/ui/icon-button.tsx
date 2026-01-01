'use client';

import * as React from 'react';
import { Button, type ButtonProps } from './button';
import { cn } from '@/lib/utils';

interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  /**
   * Descripcion accesible del boton (REQUERIDO para accesibilidad)
   * Este texto sera leido por screen readers
   */
  'aria-label': string;

  /**
   * Icono a mostrar (el componente Lucide)
   */
  icon: React.ReactNode;

  /**
   * Estado de toggle para botones que actuan como switches
   */
  'aria-pressed'?: boolean;
}

/**
 * IconButton - Boton con solo icono accesible
 *
 * Este componente REQUIERE un aria-label para cumplir con WCAG 2.2 AAA.
 * Los botones con solo iconos necesitan texto alternativo para screen readers.
 *
 * @example
 * <IconButton
 *   aria-label="Cerrar dialogo"
 *   icon={<X className="h-4 w-4" />}
 *   onClick={handleClose}
 * />
 *
 * @example Toggle button
 * <IconButton
 *   aria-label={isActive ? 'Desactivar' : 'Activar'}
 *   aria-pressed={isActive}
 *   icon={<Star className="h-4 w-4" />}
 *   onClick={handleToggle}
 * />
 */
export function IconButton({
  'aria-label': ariaLabel,
  'aria-pressed': ariaPressed,
  icon,
  className,
  variant = 'ghost',
  size = 'icon',
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      className={cn(className)}
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
    </Button>
  );
}
