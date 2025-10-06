'use client';

import { useEffect, useState } from 'react';
import { initializePerformanceOptimizations, setupRoutePreloading } from '../../utils/performance';

export default function PerformanceInitializer() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === 'undefined') return;

    // Initialize performance optimizations
    try {
      initializePerformanceOptimizations();
      setupRoutePreloading();
    } catch (error) {
      console.error('Failed to initialize performance optimizations:', error);
    }

    // Report web vitals to analytics (if available)
    if ('gtag' in window) {
      import('web-vitals').then((webVitals) => {
        const { onCLS, onINP, onFCP, onLCP, onTTFB } = webVitals;
        
        onCLS((metric: any) => {
          (window as any).gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: 'CLS',
            value: Math.round(metric.value * 1000),
            non_interaction: true,
          });
        });

        onINP((metric: any) => {
          (window as any).gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: 'INP',
            value: Math.round(metric.value),
            non_interaction: true,
          });
        });

        onFCP((metric: any) => {
          (window as any).gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: 'FCP',
            value: Math.round(metric.value),
            non_interaction: true,
          });
        });

        onLCP((metric: any) => {
          (window as any).gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: 'LCP',
            value: Math.round(metric.value),
            non_interaction: true,
          });
        });

        onTTFB((metric: any) => {
          (window as any).gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: 'TTFB',
            value: Math.round(metric.value),
            non_interaction: true,
          });
        });
      }).catch(() => {
        // web-vitals not available, continue without it
      });
    }
  }, [isMounted]);

  // This component doesn't render anything
  return null;
}
