'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  priority?: boolean;
  sizes?: string;
}

const FALLBACK_IMAGE = '/images/products/remera-termica-hombre-1.jpeg';

export function ProductImage({
  src,
  alt,
  className = '',
  fill = false,
  width,
  height,
  priority = false,
  sizes,
}: ProductImageProps) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK_IMAGE);
    }
  };

  // Si es una URL externa, usar img nativo para evitar problemas de dominio
  const isExternal = imgSrc.startsWith('http') && !imgSrc.includes('localhost');

  // Sizes por defecto para imágenes con fill
  const defaultSizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  if (isExternal) {
    // Para URLs externas usamos img nativo con unoptimized
    return (
      <Image
        src={imgSrc}
        alt={alt}
        className={className}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        sizes={fill ? (sizes || defaultSizes) : undefined}
        onError={handleError}
        unoptimized
        priority={priority}
      />
    );
  }

  return (
    <Image
      src={imgSrc}
      alt={alt}
      className={className}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={fill ? (sizes || defaultSizes) : undefined}
      onError={handleError}
      priority={priority}
    />
  );
}
