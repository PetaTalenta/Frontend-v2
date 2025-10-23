// Service Worker Registration and Management Utility
// Phase 2 Implementation - Enhanced Caching Strategy

import React from 'react';

export interface ServiceWorkerConfig {
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;
  private config: ServiceWorkerConfig = {};
  private isSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator;

  private constructor() {}

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  // Register service worker with enhanced configuration
  async register(config: ServiceWorkerConfig = {}): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Service Worker is not supported in this browser');
      return false;
    }

    this.config = config;

    try {
      // Register the service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered successfully:', this.registration.scope);

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration!.installing;
        
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              if (config.onUpdate) {
                config.onUpdate(this.registration!);
              } else {
                this.promptUpdate();
              }
            } else if (newWorker.state === 'activated') {
              // Service Worker activated
              if (config.onSuccess) {
                config.onSuccess(this.registration!);
              }
            }
          });
        }
      });

      // Set up message listener for cache management
      navigator.serviceWorker.addEventListener('message', this.handleMessage.bind(this));

      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      if (config.onError) {
        config.onError(error as Error);
      }
      return false;
    }
  }

  // Handle messages from service worker
  private handleMessage(event: MessageEvent) {
    if (event.data && event.data.type === 'CACHE_UPDATED') {
      console.log('Cache updated:', event.data.url);
    }
  }

  // Prompt user for update
  private promptUpdate() {
    if (typeof window !== 'undefined') {
      // Create a simple update notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      notification.innerHTML = `
        <div class="flex items-center space-x-2">
          <span>New version available!</span>
          <button id="update-btn" class="bg-white text-blue-600 px-2 py-1 rounded text-sm font-medium">
            Update
          </button>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      const updateBtn = document.getElementById('update-btn');
      if (updateBtn) {
        updateBtn.addEventListener('click', () => {
          this.applyUpdate();
          notification.remove();
        });
      }
      
      // Auto-remove after 10 seconds
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove();
        }
      }, 10000);
    }
  }

  // Apply service worker update
  async applyUpdate() {
    if (this.registration && this.registration.waiting) {
      // Send message to skip waiting
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload page after update
      window.location.reload();
    }
  }

  // Unregister service worker
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return true;
    }

    try {
      const success = await this.registration.unregister();
      console.log('Service Worker unregistered:', success);
      this.registration = null;
      return success;
    } catch (error) {
      console.error('Service Worker unregistration failed:', error);
      return false;
    }
  }

  // Check if service worker is active
  isActive(): boolean {
    return this.registration !== null && this.registration.active !== null;
  }

  // Get current registration
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration;
  }

  // Cache management utilities
  async clearCache(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        this.registration!.active?.postMessage(
          { type: 'CACHE_MANAGEMENT', action: 'clearCache' },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  async updateCache(url: string): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const messageChannel = new MessageChannel();
      
      return new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data.success);
        };

        this.registration!.active?.postMessage(
          { type: 'CACHE_MANAGEMENT', action: 'updateCache', url },
          [messageChannel.port2]
        );
      });
    } catch (error) {
      console.error('Failed to update cache:', error);
      return false;
    }
  }

  // Get cache information
  async getCacheInfo(): Promise<{ name: string; size: number }[]> {
    if (!this.isSupported) {
      return [];
    }

    try {
      const cacheNames = await caches.keys();
      const cacheInfo = [];

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        cacheInfo.push({ name, size: keys.length });
      }

      return cacheInfo;
    } catch (error) {
      console.error('Failed to get cache info:', error);
      return [];
    }
  }

  // Trigger background sync
  async triggerBackgroundSync(tag: string): Promise<boolean> {
    if (!this.registration || !('sync' in this.registration)) {
      return false;
    }

    try {
      await (this.registration as any).sync.register(tag);
      return true;
    } catch (error) {
      console.error('Failed to trigger background sync:', error);
      return false;
    }
  }

  // Request push notification permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!this.isSupported || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey) as any
      });

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Utility function to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }
}

// Export singleton instance
export const serviceWorkerManager = ServiceWorkerManager.getInstance();

// React hook for service worker management
export const useServiceWorker = (config: ServiceWorkerConfig = {}) => {
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(false);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);

  React.useEffect(() => {
    const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
    setIsSupported(supported);

    if (supported) {
      serviceWorkerManager.register({
        ...config,
        onUpdate: (registration) => {
          setUpdateAvailable(true);
          if (config.onUpdate) {
            config.onUpdate(registration);
          }
        },
        onSuccess: (registration) => {
          setIsRegistered(true);
          if (config.onSuccess) {
            config.onSuccess(registration);
          }
        }
      });
    }
  }, [config]);

  return {
    isSupported,
    isRegistered,
    updateAvailable,
    applyUpdate: () => serviceWorkerManager.applyUpdate(),
    clearCache: () => serviceWorkerManager.clearCache(),
    getCacheInfo: () => serviceWorkerManager.getCacheInfo(),
    triggerBackgroundSync: (tag: string) => serviceWorkerManager.triggerBackgroundSync(tag),
    requestNotificationPermission: () => serviceWorkerManager.requestNotificationPermission(),
    subscribeToPushNotifications: (vapidKey: string) => 
      serviceWorkerManager.subscribeToPushNotifications(vapidKey)
  };
};

export default serviceWorkerManager;