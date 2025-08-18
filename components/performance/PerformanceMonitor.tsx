'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Activity, 
  Zap, 
  Clock, 
  Eye, 
  Gauge,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface PerformanceMetrics {
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  cls: number | null; // Cumulative Layout Shift
  fid: number | null; // First Input Delay
  ttfb: number | null; // Time to First Byte
  memoryUsage: {
    used: number;
    total: number;
    limit: number;
  } | null;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: null,
    lcp: null,
    cls: null,
    fid: null,
    ttfb: null,
    memoryUsage: null
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const shouldShow = process.env.NODE_ENV === 'development' || 
                      localStorage.getItem('showPerformanceMonitor') === 'true';
    setIsVisible(shouldShow);

    if (!shouldShow) return;

    measurePerformanceMetrics();
    
    // Update metrics every 5 seconds
    const interval = setInterval(measurePerformanceMetrics, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const measurePerformanceMetrics = () => {
    // Measure FCP and LCP
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          setMetrics(prev => ({ ...prev, fcp: entry.startTime }));
        }
      }
    });
    observer.observe({ entryTypes: ['paint'] });

    // Measure LCP
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      setMetrics(prev => ({ ...prev, lcp: lastEntry.startTime }));
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    // Measure CLS
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      setMetrics(prev => ({ ...prev, cls: clsValue }));
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // Measure FID
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        setMetrics(prev => ({ ...prev, fid }));
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // Measure TTFB
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.requestStart;
      setMetrics(prev => ({ ...prev, ttfb }));
    }

    // Measure memory usage
    if ((performance as any).memory) {
      const memory = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: {
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          limit: memory.jsHeapSizeLimit
        }
      }));
    }
  };

  const getMetricStatus = (value: number | null, thresholds: { good: number; poor: number }) => {
    if (value === null) return 'unknown';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.poor) return 'needs-improvement';
    return 'poor';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-green-100 text-green-800';
      case 'needs-improvement': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatTime = (ms: number | null) => {
    if (ms === null) return 'N/A';
    return `${ms.toFixed(0)}ms`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-white/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Monitor
            </CardTitle>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={measurePerformanceMetrics}
                className="h-6 w-6 p-0"
              >
                <RefreshCw className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Core Web Vitals */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-600">Core Web Vitals</h4>
            
            {/* FCP */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-3 h-3 text-gray-500" />
                <span className="text-xs">FCP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono">{formatTime(metrics.fcp)}</span>
                <Badge className={`text-xs ${getStatusColor(getMetricStatus(metrics.fcp, { good: 1800, poor: 3000 }))}`}>
                  {getMetricStatus(metrics.fcp, { good: 1800, poor: 3000 })}
                </Badge>
              </div>
            </div>

            {/* LCP */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-gray-500" />
                <span className="text-xs">LCP</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono">{formatTime(metrics.lcp)}</span>
                <Badge className={`text-xs ${getStatusColor(getMetricStatus(metrics.lcp, { good: 2500, poor: 4000 }))}`}>
                  {getMetricStatus(metrics.lcp, { good: 2500, poor: 4000 })}
                </Badge>
              </div>
            </div>

            {/* CLS */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-gray-500" />
                <span className="text-xs">CLS</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono">{metrics.cls?.toFixed(3) || 'N/A'}</span>
                <Badge className={`text-xs ${getStatusColor(getMetricStatus(metrics.cls, { good: 0.1, poor: 0.25 }))}`}>
                  {getMetricStatus(metrics.cls, { good: 0.1, poor: 0.25 })}
                </Badge>
              </div>
            </div>

            {/* FID */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-gray-500" />
                <span className="text-xs">FID</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono">{formatTime(metrics.fid)}</span>
                <Badge className={`text-xs ${getStatusColor(getMetricStatus(metrics.fid, { good: 100, poor: 300 }))}`}>
                  {getMetricStatus(metrics.fid, { good: 100, poor: 300 })}
                </Badge>
              </div>
            </div>
          </div>

          {/* Memory Usage */}
          {metrics.memoryUsage && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-600">Memory Usage</h4>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs">Used</span>
                  <span className="text-xs font-mono">{formatBytes(metrics.memoryUsage.used)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs">Total</span>
                  <span className="text-xs font-mono">{formatBytes(metrics.memoryUsage.total)}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-blue-600 h-1 rounded-full" 
                    style={{ 
                      width: `${(metrics.memoryUsage.used / metrics.memoryUsage.limit) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {/* Network Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-gray-600">Network</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs">TTFB</span>
              <span className="text-xs font-mono">{formatTime(metrics.ttfb)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
