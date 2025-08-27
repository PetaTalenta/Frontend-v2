// User behavior tracking for predictive prefetching

interface UserAction {
  type: 'navigation' | 'hover' | 'click' | 'scroll' | 'idle' | 'focus';
  path: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface NavigationPattern {
  from: string;
  to: string;
  count: number;
  avgTimeSpent: number;
  lastOccurrence: number;
  confidence: number;
}

interface UserSession {
  sessionId: string;
  startTime: number;
  actions: UserAction[];
  patterns: NavigationPattern[];
  preferences: Record<string, any>;
}

class UserBehaviorTracker {
  private session: UserSession;
  private actionBuffer: UserAction[] = [];
  private flushInterval = 5000; // 5 seconds
  private maxBufferSize = 50;
  private storageKey = 'petatalenta_user_behavior';

  constructor() {
    this.session = this.initializeSession();
    this.loadStoredData();
    this.startPeriodicFlush();
    this.setupEventListeners();
  }

  private initializeSession(): UserSession {
    return {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      actions: [],
      patterns: [],
      preferences: {}
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        // Merge stored patterns with current session
        this.session.patterns = data.patterns || [];
        this.session.preferences = data.preferences || {};
      }
    } catch (error) {
      console.warn('[UserBehaviorTracker] Failed to load stored data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const dataToStore = {
        patterns: this.session.patterns,
        preferences: this.session.preferences,
        lastUpdated: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(dataToStore));
    } catch (error) {
      console.warn('[UserBehaviorTracker] Failed to save to storage:', error);
    }
  }

  private setupEventListeners(): void {
    // Track navigation
    if (typeof window !== 'undefined') {
      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        this.trackAction({
          type: document.hidden ? 'idle' : 'focus',
          path: window.location.pathname,
          timestamp: Date.now()
        });
      });

      // Track scroll behavior
      let scrollTimeout: NodeJS.Timeout;
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          this.trackAction({
            type: 'scroll',
            path: window.location.pathname,
            timestamp: Date.now(),
            metadata: {
              scrollY: window.scrollY,
              scrollPercent: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
            }
          });
        }, 500);
      }, { passive: true });

      // Track mouse movement for hover patterns
      let hoverTimeout: NodeJS.Timeout;
      document.addEventListener('mousemove', (e) => {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          const target = e.target as HTMLElement;
          const link = target.closest('a');
          if (link && link.href) {
            this.trackAction({
              type: 'hover',
              path: window.location.pathname,
              timestamp: Date.now(),
              metadata: {
                targetHref: link.href,
                hoverDuration: 500
              }
            });
          }
        }, 500);
      }, { passive: true });
    }
  }

  // Track user action
  trackAction(action: UserAction): void {
    this.actionBuffer.push(action);
    
    // Flush if buffer is full
    if (this.actionBuffer.length >= this.maxBufferSize) {
      this.flushActions();
    }
  }

  // Track navigation specifically
  trackNavigation(from: string, to: string, timeSpent: number): void {
    this.trackAction({
      type: 'navigation',
      path: to,
      timestamp: Date.now(),
      metadata: {
        from,
        timeSpent
      }
    });

    this.updateNavigationPattern(from, to, timeSpent);
  }

  private updateNavigationPattern(from: string, to: string, timeSpent: number): void {
    const patternKey = `${from}->${to}`;
    let pattern = this.session.patterns.find(p => p.from === from && p.to === to);

    if (!pattern) {
      pattern = {
        from,
        to,
        count: 0,
        avgTimeSpent: 0,
        lastOccurrence: 0,
        confidence: 0
      };
      this.session.patterns.push(pattern);
    }

    // Update pattern statistics
    pattern.count++;
    pattern.avgTimeSpent = (pattern.avgTimeSpent * (pattern.count - 1) + timeSpent) / pattern.count;
    pattern.lastOccurrence = Date.now();
    
    // Calculate confidence based on frequency and recency
    const totalNavigations = this.session.patterns.reduce((sum, p) => sum + p.count, 0);
    const frequency = pattern.count / totalNavigations;
    const recency = Math.max(0, 1 - (Date.now() - pattern.lastOccurrence) / (7 * 24 * 60 * 60 * 1000)); // 7 days decay
    pattern.confidence = (frequency * 0.7 + recency * 0.3) * 100;
  }

  private flushActions(): void {
    if (this.actionBuffer.length === 0) return;

    // Add actions to session
    this.session.actions.push(...this.actionBuffer);
    
    // Keep only recent actions (last 1000)
    if (this.session.actions.length > 1000) {
      this.session.actions = this.session.actions.slice(-1000);
    }

    // Clear buffer
    this.actionBuffer = [];

    // Save to storage
    this.saveToStorage();
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushActions();
    }, this.flushInterval);
  }

  // Get predicted next pages based on current path
  getPredictedPages(currentPath: string, limit: number = 3): Array<{
    path: string;
    confidence: number;
    reason: string;
  }> {
    const predictions: Array<{ path: string; confidence: number; reason: string }> = [];

    // Get patterns from current path
    const fromCurrentPath = this.session.patterns
      .filter(p => p.from === currentPath)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    fromCurrentPath.forEach(pattern => {
      predictions.push({
        path: pattern.to,
        confidence: pattern.confidence,
        reason: `Navigation pattern (${pattern.count} times, avg ${Math.round(pattern.avgTimeSpent / 1000)}s)`
      });
    });

    // Add time-based predictions
    const timeBasedPredictions = this.getTimeBasedPredictions(currentPath);
    timeBasedPredictions.forEach(pred => {
      if (!predictions.find(p => p.path === pred.path)) {
        predictions.push(pred);
      }
    });

    // Add behavior-based predictions
    const behaviorPredictions = this.getBehaviorBasedPredictions(currentPath);
    behaviorPredictions.forEach(pred => {
      if (!predictions.find(p => p.path === pred.path)) {
        predictions.push(pred);
      }
    });

    return predictions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);
  }

  private getTimeBasedPredictions(currentPath: string): Array<{
    path: string;
    confidence: number;
    reason: string;
  }> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // Simple time-based rules
    const timeRules: Record<string, Array<{ path: string; confidence: number; reason: string }>> = {
      '/dashboard': [
        ...(hour >= 9 && hour <= 17 ? [{ 
          path: '/assessment', 
          confidence: 60, 
          reason: 'Work hours - likely to start assessment' 
        }] : []),
        ...(hour >= 18 || hour <= 8 ? [{ 
          path: '/results', 
          confidence: 40, 
          reason: 'Off hours - likely to review results' 
        }] : [])
      ],
      '/assessment': [
        { path: '/results', confidence: 80, reason: 'Natural flow after assessment' }
      ]
    };

    return timeRules[currentPath] || [];
  }

  private getBehaviorBasedPredictions(currentPath: string): Array<{
    path: string;
    confidence: number;
    reason: string;
  }> {
    const recentActions = this.session.actions.slice(-20); // Last 20 actions
    const hoverActions = recentActions.filter(a => a.type === 'hover' && a.metadata?.targetHref);
    
    const predictions: Array<{ path: string; confidence: number; reason: string }> = [];

    // Analyze hover patterns
    const hoverCounts = new Map<string, number>();
    hoverActions.forEach(action => {
      const href = action.metadata?.targetHref;
      if (href) {
        const path = new URL(href, window.location.origin).pathname;
        hoverCounts.set(path, (hoverCounts.get(path) || 0) + 1);
      }
    });

    hoverCounts.forEach((count, path) => {
      if (path !== currentPath) {
        predictions.push({
          path,
          confidence: Math.min(count * 20, 70), // Max 70% confidence from hover
          reason: `Hovered ${count} times recently`
        });
      }
    });

    return predictions;
  }

  // Get user preferences
  getUserPreferences(): Record<string, any> {
    return { ...this.session.preferences };
  }

  // Update user preferences
  updatePreference(key: string, value: any): void {
    this.session.preferences[key] = value;
    this.saveToStorage();
  }

  // Get session statistics
  getSessionStats() {
    return {
      sessionId: this.session.sessionId,
      duration: Date.now() - this.session.startTime,
      totalActions: this.session.actions.length,
      patterns: this.session.patterns.length,
      topPatterns: this.session.patterns
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 5)
        .map(p => ({
          from: p.from,
          to: p.to,
          confidence: Math.round(p.confidence),
          count: p.count
        }))
    };
  }

  // Clear all data
  clearData(): void {
    this.session = this.initializeSession();
    this.actionBuffer = [];
    localStorage.removeItem(this.storageKey);
  }
}

// Singleton instance
export const userBehaviorTracker = new UserBehaviorTracker();

// Utility functions
export const behaviorUtils = {
  // Track page view
  trackPageView(path: string, referrer?: string): void {
    userBehaviorTracker.trackAction({
      type: 'navigation',
      path,
      timestamp: Date.now(),
      metadata: { referrer }
    });
  },

  // Track user engagement
  trackEngagement(path: string, action: string, metadata?: Record<string, any>): void {
    userBehaviorTracker.trackAction({
      type: 'click',
      path,
      timestamp: Date.now(),
      metadata: { action, ...metadata }
    });
  },

  // Get smart prefetch suggestions
  getSmartPrefetchSuggestions(currentPath: string): string[] {
    const predictions = userBehaviorTracker.getPredictedPages(currentPath, 5);
    return predictions
      .filter(p => p.confidence > 30) // Only high-confidence predictions
      .map(p => p.path);
  }
};
