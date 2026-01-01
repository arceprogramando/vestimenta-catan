'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

type Politeness = 'polite' | 'assertive';

interface LiveRegionContextType {
  announce: (message: string, politeness?: Politeness) => void;
}

const LiveRegionContext = createContext<LiveRegionContextType | null>(null);

/**
 * Hook para anunciar mensajes a screen readers
 *
 * @example
 * const { announce } = useLiveRegion();
 * announce('Formulario enviado correctamente'); // polite (default)
 * announce('Error: campo requerido', 'assertive'); // assertive para errores
 */
export function useLiveRegion() {
  const context = useContext(LiveRegionContext);
  if (!context) {
    throw new Error('useLiveRegion debe usarse dentro de LiveRegionProvider');
  }
  return context;
}

interface LiveRegionProviderProps {
  children: React.ReactNode;
}

/**
 * Live Region Provider - WCAG 4.1.3
 *
 * Provee un contexto para anunciar mensajes dinamicos a usuarios
 * de screen readers sin interrumpir su flujo de lectura.
 *
 * Debe envolver la aplicacion en el layout principal.
 */
export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  // Refs para limpiar mensajes despues de anunciarlos
  const politeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const assertiveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const announce = useCallback((message: string, politeness: Politeness = 'polite') => {
    if (politeness === 'assertive') {
      // Limpiar timeout anterior si existe
      if (assertiveTimeoutRef.current) {
        clearTimeout(assertiveTimeoutRef.current);
      }
      // Forzar re-anuncio limpiando primero
      setAssertiveMessage('');
      requestAnimationFrame(() => {
        setAssertiveMessage(message);
      });
      // Limpiar despues de 5 segundos
      assertiveTimeoutRef.current = setTimeout(() => {
        setAssertiveMessage('');
      }, 5000);
    } else {
      if (politeTimeoutRef.current) {
        clearTimeout(politeTimeoutRef.current);
      }
      setPoliteMessage('');
      requestAnimationFrame(() => {
        setPoliteMessage(message);
      });
      politeTimeoutRef.current = setTimeout(() => {
        setPoliteMessage('');
      }, 5000);
    }
  }, []);

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      <LiveRegion message={politeMessage} politeness="polite" />
      <LiveRegion message={assertiveMessage} politeness="assertive" />
    </LiveRegionContext.Provider>
  );
}

interface LiveRegionProps {
  message: string;
  politeness: Politeness;
}

/**
 * Componente Live Region individual
 *
 * Renderiza un div invisible que anuncia cambios a screen readers.
 * - polite: espera a que el SR termine de leer antes de anunciar
 * - assertive: interrumpe inmediatamente para anunciar (usar para errores)
 */
export function LiveRegion({ message, politeness }: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
