/**
 * TimerManager - Centralized timer management
 * 
 * Solves critical issues:
 * - Timer accumulation causing increased CPU usage
 * - Memory leaks dari uncancelled timers
 * - Duplicate polling requests (wasted bandwidth)
 * - Battery drain di mobile devices
 * 
 * Features:
 * - Track all timers dengan unique IDs
 * - Automatic cleanup on clear
 * - Prevent duplicate timers dengan same ID
 * - Debug utilities untuk monitor active timers
 * - Type-safe timer management
 * 
 * @module utils/timer-manager
 */

interface TimerInfo {
  id: string;
  type: 'timeout' | 'interval';
  timer: NodeJS.Timeout;
  createdAt: number;
  callback?: string; // Function name untuk debugging
}

/**
 * Centralized timer manager untuk prevent timer leaks
 */
class TimerManager {
  private timers = new Map<string, TimerInfo>();
  private debugMode = false;

  /**
   * Set a timeout dengan tracked ID
   * Automatically clears existing timer dengan same ID
   * 
   * @param id - Unique identifier untuk timer
   * @param callback - Function to execute
   * @param delay - Delay dalam milliseconds
   * @param debugName - Optional name untuk debugging
   */
  setTimeout(id: string, callback: () => void, delay: number, debugName?: string): void {
    // Clear existing timer dengan same ID
    this.clearTimeout(id);
    
    const timer = setTimeout(() => {
      callback();
      // Auto-remove dari tracking setelah execute
      this.timers.delete(id);
      
      if (this.debugMode) {
        console.log(`[TimerManager] Timeout executed: ${id}`);
      }
    }, delay);
    
    this.timers.set(id, {
      id,
      type: 'timeout',
      timer,
      createdAt: Date.now(),
      callback: debugName || callback.name || 'anonymous'
    });

    if (this.debugMode) {
      console.log(`[TimerManager] Timeout set: ${id} (${delay}ms) - ${debugName || callback.name}`);
    }
  }

  /**
   * Set an interval dengan tracked ID
   * Automatically clears existing interval dengan same ID
   * 
   * @param id - Unique identifier untuk interval
   * @param callback - Function to execute repeatedly
   * @param interval - Interval dalam milliseconds
   * @param debugName - Optional name untuk debugging
   */
  setInterval(id: string, callback: () => void, interval: number, debugName?: string): void {
    // Clear existing interval dengan same ID
    this.clearInterval(id);
    
    const timer = setInterval(() => {
      callback();
    }, interval);
    
    this.timers.set(id, {
      id,
      type: 'interval',
      timer,
      createdAt: Date.now(),
      callback: debugName || callback.name || 'anonymous'
    });

    if (this.debugMode) {
      console.log(`[TimerManager] Interval set: ${id} (${interval}ms) - ${debugName || callback.name}`);
    }
  }

  /**
   * Clear a specific timeout
   * 
   * @param id - Timer ID to clear
   */
  clearTimeout(id: string): void {
    const timerInfo = this.timers.get(id);
    if (timerInfo) {
      if (timerInfo.type === 'timeout') {
        clearTimeout(timerInfo.timer);
        this.timers.delete(id);
        
        if (this.debugMode) {
          console.log(`[TimerManager] Timeout cleared: ${id}`);
        }
      } else {
        console.warn(`[TimerManager] Timer ${id} is an interval, not a timeout. Use clearInterval instead.`);
      }
    }
  }

  /**
   * Clear a specific interval
   * 
   * @param id - Interval ID to clear
   */
  clearInterval(id: string): void {
    const timerInfo = this.timers.get(id);
    if (timerInfo) {
      if (timerInfo.type === 'interval') {
        clearInterval(timerInfo.timer);
        this.timers.delete(id);
        
        if (this.debugMode) {
          console.log(`[TimerManager] Interval cleared: ${id}`);
        }
      } else {
        console.warn(`[TimerManager] Timer ${id} is a timeout, not an interval. Use clearTimeout instead.`);
      }
    }
  }

  /**
   * Clear all timers (both timeouts and intervals)
   */
  clearAll(): void {
    const count = this.timers.size;
    
    this.timers.forEach((timerInfo) => {
      if (timerInfo.type === 'timeout') {
        clearTimeout(timerInfo.timer);
      } else {
        clearInterval(timerInfo.timer);
      }
    });
    
    this.timers.clear();
    
    if (this.debugMode || count > 0) {
      console.log(`[TimerManager] Cleared all timers (${count} total)`);
    }
  }

  /**
   * Clear all timers dengan specific prefix
   * Useful untuk clearing all timers dari specific feature
   * 
   * @param prefix - ID prefix to match
   */
  clearByPrefix(prefix: string): void {
    let count = 0;
    
    this.timers.forEach((timerInfo, id) => {
      if (id.startsWith(prefix)) {
        if (timerInfo.type === 'timeout') {
          clearTimeout(timerInfo.timer);
        } else {
          clearInterval(timerInfo.timer);
        }
        this.timers.delete(id);
        count++;
      }
    });
    
    if (this.debugMode || count > 0) {
      console.log(`[TimerManager] Cleared ${count} timers with prefix "${prefix}"`);
    }
  }

  /**
   * Check if a timer exists
   * 
   * @param id - Timer ID to check
   * @returns true if timer exists
   */
  has(id: string): boolean {
    return this.timers.has(id);
  }

  /**
   * Get active timer count
   * 
   * @returns Object dengan timeout dan interval counts
   */
  getActiveTimers(): { timeouts: number; intervals: number; total: number } {
    let timeouts = 0;
    let intervals = 0;
    
    this.timers.forEach((timerInfo) => {
      if (timerInfo.type === 'timeout') {
        timeouts++;
      } else {
        intervals++;
      }
    });
    
    return {
      timeouts,
      intervals,
      total: this.timers.size
    };
  }

  /**
   * Get detailed timer information untuk debugging
   * 
   * @returns Array of timer details
   */
  getTimerDetails(): Array<{
    id: string;
    type: 'timeout' | 'interval';
    callback: string;
    ageMs: number;
  }> {
    const now = Date.now();
    const details: Array<{
      id: string;
      type: 'timeout' | 'interval';
      callback: string;
      ageMs: number;
    }> = [];
    
    this.timers.forEach((timerInfo) => {
      details.push({
        id: timerInfo.id,
        type: timerInfo.type,
        callback: timerInfo.callback || 'unknown',
        ageMs: now - timerInfo.createdAt
      });
    });
    
    return details.sort((a, b) => b.ageMs - a.ageMs); // Sort by age, oldest first
  }

  /**
   * Enable debug mode untuk verbose logging
   * 
   * @param enabled - true to enable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    console.log(`[TimerManager] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Print current timer status to console
   */
  printStatus(): void {
    const stats = this.getActiveTimers();
    const details = this.getTimerDetails();
    
    console.log('=== TimerManager Status ===');
    console.log(`Total timers: ${stats.total}`);
    console.log(`  - Timeouts: ${stats.timeouts}`);
    console.log(`  - Intervals: ${stats.intervals}`);
    
    if (details.length > 0) {
      console.log('\nActive timers:');
      details.forEach((detail) => {
        const ageSeconds = (detail.ageMs / 1000).toFixed(1);
        console.log(`  [${detail.type}] ${detail.id} - ${detail.callback} (${ageSeconds}s old)`);
      });
    }
    
    console.log('===========================');
  }

  /**
   * Clean up stale timers (older than specified age)
   * Useful untuk detecting timer leaks
   * 
   * @param maxAgeMs - Maximum age dalam milliseconds (default: 5 minutes)
   * @returns Number of stale timers cleared
   */
  clearStaleTimers(maxAgeMs: number = 5 * 60 * 1000): number {
    const now = Date.now();
    let count = 0;
    
    this.timers.forEach((timerInfo, id) => {
      const age = now - timerInfo.createdAt;
      if (age > maxAgeMs) {
        console.warn(`[TimerManager] Clearing stale timer: ${id} (${(age / 1000).toFixed(1)}s old)`);
        
        if (timerInfo.type === 'timeout') {
          clearTimeout(timerInfo.timer);
        } else {
          clearInterval(timerInfo.timer);
        }
        
        this.timers.delete(id);
        count++;
      }
    });
    
    if (count > 0) {
      console.log(`[TimerManager] Cleared ${count} stale timers`);
    }
    
    return count;
  }
}

// Export singleton instance
export const timerManager = new TimerManager();

// Export class untuk testing
export { TimerManager };

