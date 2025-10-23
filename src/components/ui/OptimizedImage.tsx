'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  lazy?: boolean;
  threshold?: number;
}

export default function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/placeholder.jpg',
  lazy = true,
  threshold = 100,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer untuk lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: threshold / 100 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, threshold, isInView]);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
  };

  // Placeholder component
  const Placeholder = () => (
    <div 
      className={`bg-gray-200 animate-pulse ${className}`}
      style={{ ...props.style }}
    />
  );

  // Error fallback component
  const ErrorFallback = () => (
    <div 
      className={`bg-gray-300 flex items-center justify-center ${className}`}
      style={{ ...props.style }}
    >
      <span className="text-gray-500 text-sm">Failed to load image</span>
    </div>
  );

  if (!isInView) {
    return (
      <div ref={imgRef} className={className} style={props.style}>
        <Placeholder />
      </div>
    );
  }

  if (hasError) {
    return <ErrorFallback />;
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && <Placeholder />}
      <Image
        src={hasError ? fallbackSrc : src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
}