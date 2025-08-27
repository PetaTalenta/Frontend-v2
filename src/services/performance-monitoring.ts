/**
 * Performance Monitoring Service
 * Tracks and optimizes assessment API performance
 */

interface PerformanceMetric {
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: 'started' | 'completed' | 'failed';
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  slowRequests: number;
  failedRequests: number;
  successRate: number;
}

class PerformanceMonitoringService {
  private metrics: Map<string, PerformanceMetric> = new Map();
  private completedMetrics: PerformanceMetric[] = [];
  private readonly SLOW_REQUEST_THRESHOLD = 2000; // 2 seconds
  private readonly MAX_STORED_METRICS = 100;

  /**
   * Start tracking a performance metric
   */
  startTracking(operationId: string, operation: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      operation,
      startTime: performance.now(),
      status: 'started',
      metadata,
    };

    this.metrics.set(operationId, metric);
    console.log(`[PERF] Started tracking: ${operation} (${operationId})`);
  }

  /**
   * Complete tracking a performance metric
   */
  completeTracking(operationId: string, success: boolean = true): void {
    const metric = this.metrics.get(operationId);
    if (!metric) {
      console.warn(`[PERF] No metric found for operation: ${operationId}`);
      return;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;
    metric.status = success ? 'completed' : 'failed';

    // Log performance
    if (duration > this.SLOW_REQUEST_THRESHOLD) {
      console.warn(`[PERF] Slow request: ${metric.operation} took ${duration.toFixed(2)}ms`);
    } else {
      console.log(`[PERF] Completed: ${metric.operation} in ${duration.toFixed(2)}ms`);
    }

    // Store completed metric
    this.completedMetrics.push({ ...metric });
    
    // Limit stored metrics
    if (this.completedMetrics.length > this.MAX_STORED_METRICS) {
      this.completedMetrics.shift();
    }

    // Remove from active tracking
    this.metrics.delete(operationId);
  }

  /**
   * Get performance statistics
   */
  getStats(): PerformanceStats {
    const totalRequests = this.completedMetrics.length;
    const completedRequests = this.completedMetrics.filter(m => m.status === 'completed');
    const failedRequests = this.completedMetrics.filter(m => m.status === 'failed');
    const slowRequests = this.completedMetrics.filter(m => 
      m.duration && m.duration > this.SLOW_REQUEST_THRESHOLD
    );

    const totalDuration = completedRequests.reduce((sum, m) => sum + (m.duration || 0), 0);
    const averageResponseTime = completedRequests.length > 0 ? totalDuration / completedRequests.length : 0;
    const successRate = totalRequests > 0 ? (completedRequests.length / totalRequests) * 100 : 0;

    return {
      totalRequests,
      averageResponseTime,
      slowRequests: slowRequests.length,
      failedRequests: failedRequests.length,
      successRate,
    };
  }

  /**
   * Get recent slow requests
   */
  getSlowRequests(limit: number = 10): PerformanceMetric[] {
    return this.completedMetrics
      .filter(m => m.duration && m.duration > this.SLOW_REQUEST_THRESHOLD)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, limit);
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    const stats = this.getStats();
    console.log('\n📊 Performance Summary:');
    console.log(`   Total Requests: ${stats.totalRequests}`);
    console.log(`   Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms`);
    console.log(`   Slow Requests: ${stats.slowRequests}`);
    console.log(`   Failed Requests: ${stats.failedRequests}`);
    console.log(`   Success Rate: ${stats.successRate.toFixed(1)}%`);

    if (stats.slowRequests > 0) {
      console.log('\n🐌 Recent Slow Requests:');
      this.getSlowRequests(5).forEach((metric, index) => {
        console.log(`   ${index + 1}. ${metric.operation}: ${metric.duration?.toFixed(2)}ms`);
      });
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    this.completedMetrics.length = 0;
    console.log('[PERF] Cleared all performance metrics');
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitoringService();

/**
 * Decorator for tracking function performance
 */
export function trackPerformance(operationName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      performanceMonitor.startTracking(operationId, operationName, {
        method: propertyKey,
        args: args.length,
      });

      try {
        const result = await originalMethod.apply(this, args);
        performanceMonitor.completeTracking(operationId, true);
        return result;
      } catch (error) {
        performanceMonitor.completeTracking(operationId, false);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Utility function to track async operations
 */
export async function trackAsyncOperation<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  performanceMonitor.startTracking(operationId, operationName, metadata);

  try {
    const result = await operation();
    performanceMonitor.completeTracking(operationId, true);
    return result;
  } catch (error) {
    performanceMonitor.completeTracking(operationId, false);
    throw error;
  }
}

export default performanceMonitor;
