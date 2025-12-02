'use client';

import React, { useState, useCallback } from 'react';
import Image, { ImageProps } from 'next/image';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  showSkeleton?: boolean;
  aspectRatio?: number;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.webp',
  showSkeleton = true,
  aspectRatio,
  className = '',
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
  }, []);

  const imageSrc = hasError ? fallbackSrc : src;

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={aspectRatio ? { aspectRatio: aspectRatio.toString() } : undefined}
    >
      {showSkeleton && isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      <Image
        src={imageSrc}
        alt={alt}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  );
}

// Avatar component with optimized loading
interface AvatarImageProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackInitials?: string;
  className?: string;
}

const AVATAR_SIZES = {
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export function AvatarImage({
  src,
  alt,
  size = 'md',
  fallbackInitials,
  className = '',
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);
  const dimension = AVATAR_SIZES[size];

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-purple-500 to-blue-500 text-white font-medium rounded-full ${className}`}
        style={{ width: dimension, height: dimension }}
      >
        {fallbackInitials || alt.charAt(0).toUpperCase()}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={dimension}
      height={dimension}
      className={`rounded-full object-cover ${className}`}
      onError={() => setHasError(true)}
    />
  );
}

// Background image with blur effect
interface BackgroundImageProps {
  src: string;
  alt: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
  className?: string;
}

export function BackgroundImage({
  src,
  alt,
  children,
  overlay = true,
  overlayOpacity = 0.5,
  className = '',
}: BackgroundImageProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        priority={false}
        quality={75}
      />
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// Responsive image set for different screen sizes
interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  aspectRatio?: number;
}

export function ResponsiveImage({
  src,
  alt,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  className = '',
  aspectRatio = 16 / 9,
}: ResponsiveImageProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ aspectRatio: aspectRatio.toString() }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        quality={85}
        className={`object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}
