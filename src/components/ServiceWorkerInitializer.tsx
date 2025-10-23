'use client';

import { useEffect } from 'react';
import { serviceWorkerManager } from '@/lib/serviceWorker';

export function ServiceWorkerInitializer() {
  useEffect(() => {
    // Only register service worker in production and on client side
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      serviceWorkerManager.register({
        onSuccess: (registration) => {
          console.log('Service Worker registered successfully:', registration.scope);
        },
        onUpdate: (registration) => {
          console.log('Service Worker update available:', registration);
          // You can show a custom update notification here
        },
        onError: (error) => {
          console.error('Service Worker registration failed:', error);
        }
      });
    }
  }, []);

  return null; // This component doesn't render anything
}