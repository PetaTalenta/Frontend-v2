// Offline support utilities for the application
import React from 'react';

interface OfflineQueueItem {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data?: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

class OfflineManager {
  private isOnline: boolean = true;
  private queue: OfflineQueueItem[] = [];
  private static instance: OfflineManager;
  private listeners: ((online: boolean) => void)[] = [];

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.setupEventListeners();
      this.loadQueueFromStorage();
    }
  }

  static getInstance(): OfflineManager {
    if (!OfflineManager.instance) {
      OfflineManager.instance = new OfflineManager();
    }
    return OfflineManager.instance;
  }

  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  public addListener(listener: (online: boolean) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (online: boolean) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Queue management for offline requests
  public addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries' | 'maxRetries'>): void {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: this.generateId(),
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3
    };

    this.queue.push(queueItem);
    this.saveQueueToStorage();
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private async processQueue(): Promise<void> {
    if (!this.isOnline || this.queue.length === 0) return;

    const failedItems: OfflineQueueItem[] = [];

    for (const item of this.queue) {
      try {
        await this.retryRequest(item);
      } catch (error) {
        console.error('Failed to retry request:', error);
        item.retries++;
        
        if (item.retries < item.maxRetries) {
          failedItems.push(item);
        }
      }
    }

    this.queue = failedItems;
    this.saveQueueToStorage();
  }

  private async retryRequest(item: OfflineQueueItem): Promise<Response> {
    const options: RequestInit = {
      method: item.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (item.data && ['POST', 'PUT', 'PATCH'].includes(item.method)) {
      options.body = JSON.stringify(item.data);
    }

    const response = await fetch(item.url, options);
    
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    return response;
  }

  private saveQueueToStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('offline_queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save queue to storage:', error);
    }
  }

  private loadQueueFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('offline_queue');
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load queue from storage:', error);
    }
  }

  public clearQueue(): void {
    this.queue = [];
    this.saveQueueToStorage();
  }

  public getQueueSize(): number {
    return this.queue.length;
  }

  // Storage utilities for offline data
  public setOfflineData(key: string, data: any): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`offline_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Failed to set offline data:', error);
    }
  }

  public getOfflineData(key: string, maxAge: number = 24 * 60 * 60 * 1000): any {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(`offline_${key}`);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      const age = Date.now() - parsed.timestamp;
      
      if (age > maxAge) {
        localStorage.removeItem(`offline_${key}`);
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.error('Failed to get offline data:', error);
      return null;
    }
  }

  public clearOfflineData(key?: string): void {
    if (typeof window === 'undefined') return;
    try {
      if (key) {
        localStorage.removeItem(`offline_${key}`);
      } else {
        // Clear all offline data
        const keys = Object.keys(localStorage);
        keys.forEach(k => {
          if (k.startsWith('offline_')) {
            localStorage.removeItem(k);
          }
        });
      }
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }
}

// Export singleton instance
export const offlineManager = OfflineManager.getInstance();

// React hook for offline status
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(() => offlineManager.getOnlineStatus());

  React.useEffect(() => {
    const listener = (online: boolean) => setIsOnline(online);
    offlineManager.addListener(listener);
    
    return () => {
      offlineManager.removeListener(listener);
    };
  }, []);

  return {
    isOnline,
    queueSize: offlineManager.getQueueSize(),
    clearQueue: () => offlineManager.clearQueue(),
  };
};

// Enhanced fetch wrapper with offline support
export const offlineFetch = async (
  url: string, 
  options: RequestInit = {},
  queueOffline: boolean = true
): Promise<Response> => {
  if (offlineManager.getOnlineStatus()) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      if (queueOffline && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
        // Queue the request for later
        offlineManager.addToQueue({
          url,
          method: (options.method || 'GET') as any,
          data: options.body ? JSON.parse(options.body as string) : undefined,
        });
      }
      throw error;
    }
  } else {
    if (queueOffline && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method || 'GET')) {
      // Queue the request for later
      offlineManager.addToQueue({
        url,
        method: (options.method || 'GET') as any,
        data: options.body ? JSON.parse(options.body as string) : undefined,
      });
    }
    throw new Error('Device is offline');
  }
};

// Offline storage helpers for specific data types
export const offlineStorage = {
  profile: {
    get: () => offlineManager.getOfflineData('profile'),
    set: (data: any) => offlineManager.setOfflineData('profile', data),
    clear: () => offlineManager.clearOfflineData('profile'),
  },
  assessments: {
    get: (id: string) => offlineManager.getOfflineData(`assessment_${id}`),
    set: (id: string, data: any) => offlineManager.setOfflineData(`assessment_${id}`, data),
    clear: (id: string) => offlineManager.clearOfflineData(`assessment_${id}`),
  },
  settings: {
    get: () => offlineManager.getOfflineData('settings'),
    set: (data: any) => offlineManager.setOfflineData('settings', data),
    clear: () => offlineManager.clearOfflineData('settings'),
  },
};