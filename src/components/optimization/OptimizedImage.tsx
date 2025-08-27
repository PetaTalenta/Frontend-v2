'use client';

import { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '../../lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  showPlaceholder?: boolean;
  placeholderClassName?: string;
  onLoadComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Komponen gambar yang dioptimalkan dengan:
 * - Lazy loading otomatis
 * - Placeholder loading state
 * - Fallback image support
 * - Format modern (WebP/AVIF) otomatis
 * - Responsive sizing
 */
export default function OptimizedImage({
  src,
  alt,
  className,
  fallbackSrc = '/placeholder.svg',
  showPlaceholder = true,
  placeholderClassName,
  onLoadComplete,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoadComplete?.();
  }, [onLoadComplete]);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);

    // Try fallback if current src is not already the fallback
    if (currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setHasError(false);
      setIsLoading(true);
    } else {
      onError?.(new Error(`Failed to load image: ${src}`));
    }
  }, [currentSrc, fallbackSrc, src, onError]);

  return (
    <div className="relative overflow-hidden">
      <Image
        {...props}
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
      />

      {/* Loading placeholder */}
      {showPlaceholder && isLoading && (
        <div
          className={cn(
            'absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center',
            placeholderClassName
          )}
          style={{
            width: props.width,
            height: props.height
          }}
        >
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && !isLoading && (
        <div
          className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-sm"
          style={{
            width: props.width,
            height: props.height
          }}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <div>Image unavailable</div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Avatar component yang dioptimalkan
 */
export function OptimizedAvatar({
  src,
  alt,
  size = 40,
  className,
  ...props
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
} & Omit<OptimizedImageProps, 'width' | 'height'>) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full object-cover', className)}
      fallbackSrc="/profile-placeholder.jpeg"
      {...props}
    />
  );
}

/**
 * Logo component yang dioptimalkan
 */
export function OptimizedLogo({
  variant = 'default',
  size = 'medium',
  className,
  priority = false,
  ...props
}: {
  variant?: 'default' | 'white' | 'dark';
  size?: 'small' | 'medium' | 'large';
  className?: string;
  priority?: boolean;
} & Omit<OptimizedImageProps, 'src' | 'width' | 'height' | 'alt'>) {
  const sizeMap = {
    small: { width: 120, height: 40 },
    medium: { width: 180, height: 60 },
    large: { width: 240, height: 80 }
  };

  const logoSrc = variant === 'default' ? '/logo.png' : `/logo-${variant}.png`;
  const dimensions = sizeMap[size];

  return (
    <OptimizedImage
      src={logoSrc}
      alt="PetaTalenta Logo"
      width={dimensions.width}
      height={dimensions.height}
      priority={priority}
      className={className}
      fallbackSrc="/placeholder-logo.png"
      {...props}
    />
  );
}