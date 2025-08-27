'use client';

import { useEffect } from 'react';
import { initializePerformanceOptimizations, setupRoutePreloading } from '../../utils/performance';

export default function PerformanceInitializer() {
  useEffect(() => {
    // Initialize performance optimizations
    initializePerformanceOptimizations();
    setupRoutePreloading();

    // Report web vitals to analytics (if available)
    if (typeof window !== 'undefined' && 'gtag' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS((metric) => {
          (window as any).gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: 'CLS',
            value: Math.round(metric.value * 1000),
            non_interaction: true,
          });
        });

        getFID((metric) => {
          (window as any).gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: 'FID',
            value: Math.round(metric.value),
            non_interaction: true,
          });
        });

        getFCP((metric) => {
          (window as any).gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: 'FCP',
            value: Math.round(metric.value),
            non_interaction: true,
          });
        });

        getLCP((metric) => {
          (window as any).gtag('event', 'web_vitals', {
            event_category: 'Performance',
            event_label: 'LCP',
            value: Math.round(metric.value),
            non_interaction: true,
          });
        });

        getTTFB((metric) => {
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
  }, []);

  // This component doesn't render anything
  return null;
}
