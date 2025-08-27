/**
 * Utility functions untuk monitoring dan optimasi performa animasi
 */

// 1. Performance Monitor untuk animasi
export class AnimationPerformanceMonitor {
  private static instance: AnimationPerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();
  private isMonitoring = false;

  static getInstance(): AnimationPerformanceMonitor {
    if (!AnimationPerformanceMonitor.instance) {
      AnimationPerformanceMonitor.instance = new AnimationPerformanceMonitor();
    }
    return AnimationPerformanceMonitor.instance;
  }

  startMonitoring(animationId: string) {
    if (typeof window === 'undefined' || !('performance' in window)) return;
    
    this.isMonitoring = true;
    const startTime = performance.now();
    
    if (!this.metrics.has(animationId)) {
      this.metrics.set(animationId, []);
    }
    
    this.metrics.get(animationId)?.push(startTime);
  }

  endMonitoring(animationId: string) {
    if (typeof window === 'undefined' || !('performance' in window)) return;
    
    const endTime = performance.now();
    const times = this.metrics.get(animationId);
    
    if (times && times.length > 0) {
      const startTime = times[times.length - 1];
      const duration = endTime - startTime;
      
      // Log jika animasi terlalu lambat (> 16ms untuk 60fps)
      if (duration > 16) {
        console.warn(`Animation "${animationId}" took ${duration.toFixed(2)}ms (target: <16ms)`);
      }
      
      // Update metrics
      times[times.length - 1] = duration;
    }
  }

  getMetrics(animationId: string) {
    return this.metrics.get(animationId) || [];
  }

  getAverageTime(animationId: string): number {
    const times = this.metrics.get(animationId) || [];
    if (times.length === 0) return 0;
    
    const sum = times.reduce((acc, time) => acc + time, 0);
    return sum / times.length;
  }

  clearMetrics(animationId?: string) {
    if (animationId) {
      this.metrics.delete(animationId);
    } else {
      this.metrics.clear();
    }
  }
}

// 2. Hook untuk monitoring performa animasi
export const useAnimationPerformance = (animationId: string) => {
  const monitor = AnimationPerformanceMonitor.getInstance();

  const startMonitoring = () => monitor.startMonitoring(animationId);
  const endMonitoring = () => monitor.endMonitoring(animationId);
  const getMetrics = () => monitor.getMetrics(animationId);
  const getAverageTime = () => monitor.getAverageTime(animationId);

  return {
    startMonitoring,
    endMonitoring,
    getMetrics,
    getAverageTime
  };
};

// 3. Deteksi device capabilities
export const getDeviceCapabilities = () => {
  if (typeof window === 'undefined') {
    return {
      supportsGPU: false,
      isLowEndDevice: true,
      prefersReducedMotion: false,
      connectionSpeed: 'slow'
    };
  }

  // Deteksi GPU support
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  const supportsGPU = !!gl;

  // Deteksi low-end device berdasarkan hardware concurrency
  const isLowEndDevice = navigator.hardwareConcurrency <= 2;

  // Deteksi prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Deteksi connection speed
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
  const connectionSpeed = connection ? 
    (connection.effectiveType === '4g' ? 'fast' : 
     connection.effectiveType === '3g' ? 'medium' : 'slow') : 'unknown';

  return {
    supportsGPU,
    isLowEndDevice,
    prefersReducedMotion,
    connectionSpeed
  };
};

// 4. Adaptive animation configuration
export const getAdaptiveAnimationConfig = () => {
  const capabilities = getDeviceCapabilities();

  if (capabilities.prefersReducedMotion) {
    return {
      duration: 0,
      enabled: false,
      useGPU: false
    };
  }

  if (capabilities.isLowEndDevice || capabilities.connectionSpeed === 'slow') {
    return {
      duration: 0.2,
      enabled: true,
      useGPU: capabilities.supportsGPU,
      reduceComplexity: true
    };
  }

  return {
    duration: 0.3,
    enabled: true,
    useGPU: capabilities.supportsGPU,
    reduceComplexity: false
  };
};

// 5. Frame rate monitor
export class FrameRateMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private fps = 0;
  private isRunning = false;

  start() {
    this.isRunning = true;
    this.lastTime = performance.now();
    this.frameCount = 0;
    this.measure();
  }

  stop() {
    this.isRunning = false;
  }

  private measure = () => {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    this.frameCount++;

    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      
      // Log warning jika FPS di bawah 50
      if (this.fps < 50) {
        console.warn(`Low FPS detected: ${this.fps}fps (target: 60fps)`);
      }

      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    requestAnimationFrame(this.measure);
  };

  getFPS(): number {
    return this.fps;
  }
}

// 6. Animation optimization utilities
export const optimizeAnimationProps = (props: any) => {
  const config = getAdaptiveAnimationConfig();

  if (!config.enabled) {
    return {};
  }

  const optimized = { ...props };

  // Adjust duration based on device capabilities
  if (optimized.transition) {
    optimized.transition.duration = config.duration;
  }

  // Add GPU acceleration hints
  if (config.useGPU) {
    optimized.style = {
      ...optimized.style,
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden',
      perspective: 1000
    };
  }

  // Reduce complexity for low-end devices
  if (config.reduceComplexity) {
    // Simplify easing
    if (optimized.transition?.ease) {
      optimized.transition.ease = 'easeOut';
    }

    // Remove complex transforms
    if (optimized.animate) {
      const { rotate, skew, ...simpleAnimations } = optimized.animate;
      optimized.animate = simpleAnimations;
    }
  }

  return optimized;
};

// 7. Performance testing utilities
export const runAnimationPerformanceTest = async (
  animationFunction: () => Promise<void>,
  iterations = 10
) => {
  const results: number[] = [];
  const monitor = new FrameRateMonitor();

  for (let i = 0; i < iterations; i++) {
    monitor.start();
    const startTime = performance.now();
    
    await animationFunction();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    results.push(duration);
    monitor.stop();
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const averageTime = results.reduce((sum, time) => sum + time, 0) / results.length;
  const minTime = Math.min(...results);
  const maxTime = Math.max(...results);

  return {
    averageTime: Math.round(averageTime * 100) / 100,
    minTime: Math.round(minTime * 100) / 100,
    maxTime: Math.round(maxTime * 100) / 100,
    results
  };
};
