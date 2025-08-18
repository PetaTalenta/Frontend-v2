'use client';

import React, { forwardRef, useCallback } from 'react';
import Link from 'next/link';
import { usePrefetch, useIntersectionPrefetch } from '../../hooks/usePrefetch';

interface PrefetchLinkProps extends React.ComponentProps<typeof Link> {
  // Prefetch strategies
  prefetchOnHover?: boolean;
  prefetchOnVisible?: boolean;
  prefetchImmediately?: boolean;
  
  // Prefetch options
  prefetchPriority?: 'high' | 'low';
  prefetchDelay?: number;
  
  // Conditions
  prefetchCondition?: () => boolean;
  
  // Analytics
  trackPrefetch?: boolean;
  
  children: React.ReactNode;
  className?: string;
}

export const PrefetchLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  ({
    href,
    prefetchOnHover = true,
    prefetchOnVisible = false,
    prefetchImmediately = false,
    prefetchPriority = 'low',
    prefetchDelay = 0,
    prefetchCondition,
    trackPrefetch = false,
    children,
    className,
    onMouseEnter,
    ...props
  }, ref) => {
    const { prefetchOnHover: prefetchHover, prefetchRoute } = usePrefetch();
    
    // Get intersection ref for visible prefetching
    const intersectionRef = useIntersectionPrefetch(
      href.toString(), 
      prefetchOnVisible
    );

    // Handle immediate prefetch
    React.useEffect(() => {
      if (prefetchImmediately) {
        prefetchRoute(href.toString(), {
          priority: prefetchPriority,
          delay: prefetchDelay,
          condition: prefetchCondition
        });
      }
    }, [prefetchImmediately, href, prefetchPriority, prefetchDelay, prefetchCondition, prefetchRoute]);

    // Handle hover prefetch
    const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
      if (prefetchOnHover) {
        prefetchHover(href.toString());
        
        if (trackPrefetch) {
          console.log(`[PrefetchLink] Hover prefetch triggered for: ${href}`);
        }
      }
      
      onMouseEnter?.(e);
    }, [prefetchOnHover, href, prefetchHover, trackPrefetch, onMouseEnter]);

    // Combine refs for intersection observer
    const combinedRef = useCallback((node: HTMLAnchorElement) => {
      if (prefetchOnVisible && intersectionRef) {
        (intersectionRef as React.MutableRefObject<HTMLAnchorElement | null>).current = node;
      }
      
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    }, [ref, intersectionRef, prefetchOnVisible]);

    return (
      <Link
        ref={combinedRef}
        href={href}
        onMouseEnter={handleMouseEnter}
        className={className}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

PrefetchLink.displayName = 'PrefetchLink';

// Specialized components for common use cases
export const NavigationLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  (props, ref) => (
    <PrefetchLink
      ref={ref}
      prefetchOnHover={true}
      prefetchPriority="high"
      trackPrefetch={true}
      {...props}
    />
  )
);

NavigationLink.displayName = 'NavigationLink';

export const ContentLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  (props, ref) => (
    <PrefetchLink
      ref={ref}
      prefetchOnVisible={true}
      prefetchPriority="low"
      prefetchDelay={200}
      {...props}
    />
  )
);

ContentLink.displayName = 'ContentLink';

export const CriticalLink = forwardRef<HTMLAnchorElement, PrefetchLinkProps>(
  (props, ref) => (
    <PrefetchLink
      ref={ref}
      prefetchImmediately={true}
      prefetchPriority="high"
      trackPrefetch={true}
      {...props}
    />
  )
);

CriticalLink.displayName = 'CriticalLink';
