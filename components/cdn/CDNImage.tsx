'use client';

import { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';
import { getCDNUrl, getOptimizedImageUrl, checkCDNHealth } from '../../config/cdn-config';

interface CDNImageProps extends Omit<ImageProps, 'src'> {
  src: string;
  fallbackSrc?: string;
  quality?: 'high' | 'medium' | 'low' | 'thumbnail';
  enableCDN?: boolean;
  onCDNError?: (error: Error) => void;
}

export default function CDNImage({
  src,
  fallbackSrc,
  quality = 'medium',
  enableCDN = true,
  onCDNError,
  ...props
}: CDNImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [cdnAvailable, setCdnAvailable] = useState(true);

  // Check CDN health on mount
  useEffect(() => {
    if (enableCDN) {
      checkCDNHealth().then(setCdnAvailable);
    }
  }, [enableCDN]);

  // Generate optimized image URL
  useEffect(() => {
    if (enableCDN && cdnAvailable) {
      const optimizedUrl = getOptimizedImageUrl(src, {
        width: props.width as number,
        height: props.height as number,
        quality,
        format: 'webp'
      });
      setImageSrc(optimizedUrl);
    } else {
      setImageSrc(src);
    }
  }, [src, enableCDN, cdnAvailable, quality, props.width, props.height]);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);

    // Try fallback sources in order
    if (enableCDN && cdnAvailable && !hasError) {
      // First fallback: try original CDN URL without optimization
      const basicCDNUrl = getCDNUrl(src, 'image');
      if (imageSrc !== basicCDNUrl) {
        setImageSrc(basicCDNUrl);
        setHasError(false);
        return;
      }
    }

    // Second fallback: use local image
    if (imageSrc !== src) {
      setImageSrc(src);
      setHasError(false);
      return;
    }

    // Third fallback: use provided fallback
    if (fallbackSrc && imageSrc !== fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
      return;
    }

    // Report CDN error
    if (onCDNError) {
      onCDNError(new Error(`Failed to load image: ${src}`));
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  return (
    <div className="relative">
      <Image
        {...props}
        src={imageSrc}
        onError={handleError}
        onLoad={handleLoad}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${props.className || ''}`}
      />
      
      {/* Loading placeholder */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{
            width: props.width,
            height: props.height
          }}
        />
      )}
      
      {/* Error state */}
      {hasError && !isLoading && (
        <div 
          className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400 text-sm rounded"
          style={{
            width: props.width,
            height: props.height
          }}
        >
          Image unavailable
        </div>
      )}
    </div>
  );
}

/**
 * CDN-optimized avatar component
 */
export function CDNAvatar({
  src,
  alt,
  size = 40,
  className = '',
  ...props
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
} & Omit<CDNImageProps, 'width' | 'height' | 'alt'>) {
  return (
    <CDNImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality="medium"
      className={`rounded-full ${className}`}
      fallbackSrc="/images/default-avatar.png"
      {...props}
    />
  );
}

/**
 * CDN-optimized logo component
 */
export function CDNLogo({
  variant = 'default',
  size = 'medium',
  className = '',
  ...props
}: {
  variant?: 'default' | 'white' | 'dark';
  size?: 'small' | 'medium' | 'large';
  className?: string;
} & Omit<CDNImageProps, 'src' | 'width' | 'height' | 'alt'>) {
  const sizeMap = {
    small: { width: 120, height: 40 },
    medium: { width: 180, height: 60 },
    large: { width: 240, height: 80 }
  };

  const logoSrc = `/images/logo-${variant}.png`;
  const dimensions = sizeMap[size];

  return (
    <CDNImage
      src={logoSrc}
      alt="PetaTalenta Logo"
      width={dimensions.width}
      height={dimensions.height}
      quality="high"
      className={className}
      priority
      {...props}
    />
  );
}

/**
 * CDN-optimized background image component
 */
export function CDNBackgroundImage({
  src,
  children,
  className = '',
  overlay = false,
  overlayOpacity = 0.5,
  ...props
}: {
  src: string;
  children?: React.ReactNode;
  className?: string;
  overlay?: boolean;
  overlayOpacity?: number;
} & Omit<CDNImageProps, 'width' | 'height' | 'alt'>) {
  const [optimizedSrc, setOptimizedSrc] = useState<string>(src);

  useEffect(() => {
    const optimized = getOptimizedImageUrl(src, {
      width: 1920,
      quality: 'high',
      format: 'webp'
    });
    setOptimizedSrc(optimized);
  }, [src]);

  return (
    <div 
      className={`relative bg-cover bg-center bg-no-repeat ${className}`}
      style={{
        backgroundImage: `url(${optimizedSrc})`
      }}
    >
      {overlay && (
        <div 
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
