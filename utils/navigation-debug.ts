/**
 * Navigation debugging utilities
 * Helps track and debug navigation issues in the assessment flow
 */

export interface NavigationEvent {
  timestamp: string;
  from: string;
  to: string;
  method: 'router.push' | 'window.location.href' | 'redirect';
  success: boolean;
  error?: string;
  context?: any;
}

class NavigationDebugger {
  private events: NavigationEvent[] = [];
  private maxEvents = 50;

  logNavigation(event: Omit<NavigationEvent, 'timestamp'>) {
    const navigationEvent: NavigationEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    this.events.unshift(navigationEvent);
    
    // Keep only the last maxEvents
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // Log to console for debugging
    console.log('Navigation Debug:', navigationEvent);

    // Save to localStorage for persistence
    try {
      localStorage.setItem('navigation-debug', JSON.stringify(this.events));
    } catch (error) {
      console.warn('Failed to save navigation debug to localStorage:', error);
    }
  }

  getEvents(): NavigationEvent[] {
    return [...this.events];
  }

  getLastEvent(): NavigationEvent | null {
    return this.events[0] || null;
  }

  clearEvents() {
    this.events = [];
    try {
      localStorage.removeItem('navigation-debug');
    } catch (error) {
      console.warn('Failed to clear navigation debug from localStorage:', error);
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem('navigation-debug');
      if (stored) {
        this.events = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load navigation debug from localStorage:', error);
    }
  }

  exportDebugInfo() {
    return {
      events: this.events,
      currentUrl: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }
}

// Global instance
export const navigationDebugger = new NavigationDebugger();

// Load existing events on initialization
if (typeof window !== 'undefined') {
  navigationDebugger.loadFromStorage();
}

/**
 * Enhanced navigation function with debugging
 */
export async function debugNavigate(
  router: any,
  destination: string,
  context?: any
): Promise<boolean> {
  const from = window.location.pathname;
  
  try {
    // Try router.push first
    navigationDebugger.logNavigation({
      from,
      to: destination,
      method: 'router.push',
      success: false, // Will update if successful
      context
    });

    await router.push(destination);
    
    // Update the last event as successful
    const events = navigationDebugger.getEvents();
    if (events[0]) {
      events[0].success = true;
    }
    
    console.log('Navigation successful via router.push:', destination);
    return true;
  } catch (error) {
    console.error('Router.push failed, trying window.location.href:', error);
    
    // Update the last event with error
    const events = navigationDebugger.getEvents();
    if (events[0]) {
      events[0].error = error.message;
    }

    try {
      // Fallback to window.location.href
      navigationDebugger.logNavigation({
        from,
        to: destination,
        method: 'window.location.href',
        success: true,
        context
      });

      window.location.href = destination;
      return true;
    } catch (fallbackError) {
      navigationDebugger.logNavigation({
        from,
        to: destination,
        method: 'window.location.href',
        success: false,
        error: fallbackError.message,
        context
      });

      console.error('Both navigation methods failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Check if current navigation seems problematic
 */
export function checkNavigationHealth(): {
  isHealthy: boolean;
  issues: string[];
  recommendations: string[];
} {
  const events = navigationDebugger.getEvents();
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for recent failures
  const recentEvents = events.slice(0, 5);
  const failureCount = recentEvents.filter(e => !e.success).length;
  
  if (failureCount > 2) {
    issues.push('Multiple recent navigation failures detected');
    recommendations.push('Check browser console for router errors');
    recommendations.push('Try refreshing the page');
  }

  // Check for stuck navigation patterns
  const lastEvent = navigationDebugger.getLastEvent();
  if (lastEvent && !lastEvent.success && lastEvent.to.includes('/results/')) {
    issues.push('Failed navigation to results page detected');
    recommendations.push('Check if results page exists and is accessible');
    recommendations.push('Verify assessment submission was successful');
  }

  return {
    isHealthy: issues.length === 0,
    issues,
    recommendations
  };
}
