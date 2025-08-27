/**
 * Browser Notification Service
 * Provides real-time notifications for assessment completion and other events
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
}

export interface AssessmentNotificationData {
  assessmentId: string;
  assessmentType: string;
  completedAt: string;
  resultUrl: string;
}

class NotificationService {
  private permission: NotificationPermission = 'default';
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'Notification' in window;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Check if notifications are supported
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Notifications not supported in this browser');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      console.log('Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Show a notification
   */
  async showNotification(options: NotificationOptions): Promise<Notification | null> {
    if (!this.isSupported) {
      console.warn('Notifications not supported');
      return null;
    }

    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icons/assessment-complete.png',
        badge: options.badge || '/icons/badge.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data,
      });

      // Auto-close after 10 seconds if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 10000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Show assessment completion notification
   */
  async showAssessmentCompleteNotification(data: AssessmentNotificationData): Promise<Notification | null> {
    const options: NotificationOptions = {
      title: '🎉 Assessment Complete!',
      body: `Your ${data.assessmentType} assessment has been completed and is ready to view.`,
      icon: '/icons/assessment-complete.png',
      tag: `assessment-${data.assessmentId}`,
      requireInteraction: true,
      data: {
        type: 'assessment-complete',
        assessmentId: data.assessmentId,
        resultUrl: data.resultUrl,
      },
    };

    const notification = await this.showNotification(options);

    if (notification) {
      // Handle notification click
      notification.onclick = () => {
        window.focus();
        window.location.href = data.resultUrl;
        notification.close();
      };
    }

    return notification;
  }

  /**
   * Show assessment processing notification
   */
  async showAssessmentProcessingNotification(assessmentType: string, estimatedTime?: string): Promise<Notification | null> {
    const options: NotificationOptions = {
      title: '⏳ Assessment Processing',
      body: `Your ${assessmentType} assessment is being processed${estimatedTime ? `. Estimated time: ${estimatedTime}` : ''}.`,
      icon: '/icons/assessment-processing.png',
      tag: 'assessment-processing',
      requireInteraction: false,
      silent: true,
    };

    return await this.showNotification(options);
  }

  /**
   * Show assessment failed notification
   */
  async showAssessmentFailedNotification(assessmentType: string, error?: string): Promise<Notification | null> {
    const options: NotificationOptions = {
      title: '❌ Assessment Failed',
      body: `Your ${assessmentType} assessment failed to process${error ? `: ${error}` : ''}. Please try again.`,
      icon: '/icons/assessment-failed.png',
      tag: 'assessment-failed',
      requireInteraction: true,
    };

    return await this.showNotification(options);
  }

  /**
   * Clear all notifications with a specific tag
   */
  clearNotificationsByTag(tag: string): void {
    // Note: There's no direct way to clear notifications by tag in the browser API
    // This is a placeholder for future implementation if needed
    console.log(`Clearing notifications with tag: ${tag}`);
  }

  /**
   * Initialize notification service and request permission if needed
   */
  async initialize(): Promise<boolean> {
    if (!this.isSupported) {
      console.log('Notifications not supported in this browser');
      return false;
    }

    if (this.permission === 'default') {
      const permission = await this.requestPermission();
      return permission === 'granted';
    }

    return this.permission === 'granted';
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;

// Export convenience functions
export const showAssessmentCompleteNotification = (data: AssessmentNotificationData) =>
  notificationService.showAssessmentCompleteNotification(data);

export const showAssessmentProcessingNotification = (assessmentType: string, estimatedTime?: string) =>
  notificationService.showAssessmentProcessingNotification(assessmentType, estimatedTime);

export const showAssessmentFailedNotification = (assessmentType: string, error?: string) =>
  notificationService.showAssessmentFailedNotification(assessmentType, error);

export const initializeNotifications = () => notificationService.initialize();

export const isNotificationSupported = () => notificationService.isNotificationSupported();

export const getNotificationPermission = () => notificationService.getPermission();
