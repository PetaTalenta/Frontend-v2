'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Activity, 
  Zap, 
  Clock, 
  Eye, 
  Gauge,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Globe,
  Wifi
} from 'lucide-react';
// RUM monitor will be imported dynamically to avoid SSR issues

interface RUMDashboardProps {
  showInProduction?: boolean;
}

export default function RUMDashboard({ showInProduction = false }: RUMDashboardProps) {
  const [metrics, setMetrics] = useState<any>(null);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [errors, setErrors] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Show in development or when explicitly enabled
    const shouldShow = process.env.NODE_ENV === 'development' ||
                      showInProduction ||
                      localStorage.getItem('showRUMDashboard') === 'true';
    setIsVisible(shouldShow);

    if (!shouldShow) return;

    // Initialize RUM data
    const initializeRUMData = async () => {
      try {
        const { rumMonitor } = await import('../../utils/rum-monitoring');
        setMetrics(rumMonitor.getMetrics());
        setInteractions(rumMonitor.getInteractions());
        setErrors(rumMonitor.getErrors());
      } catch (error) {
        console.error('Failed to initialize RUM data:', error);
      }
    };

    initializeRUMData();

    // Update data every 5 seconds
    const interval = setInterval(async () => {
      try {
        const { rumMonitor } = await import('../../utils/rum-monitoring');
        setMetrics(rumMonitor.getMetrics());
        setInteractions(rumMonitor.getInteractions());
        setErrors(rumMonitor.getErrors());
      } catch (error) {
        console.error('Failed to update RUM data:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [showInProduction]);

  if (!isVisible || !metrics) return null;

  const getScoreColor = (score: number | null, thresholds: { good: number; poor: number }) => {
    if (score === null) return 'gray';
    if (score <= thresholds.good) return 'green';
    if (score <= thresholds.poor) return 'yellow';
    return 'red';
  };

  const formatTime = (time: number | null) => {
    if (time === null) return 'N/A';
    return `${Math.round(time)}ms`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-[80vh] overflow-auto bg-white border rounded-lg shadow-lg z-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5" />
            RUM Dashboard
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            ×
          </Button>
        </div>

        <Tabs defaultValue="vitals" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="user">User</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="vitals" className="space-y-4">
            {/* Core Web Vitals */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Core Web Vitals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">FCP</span>
                  <Badge variant={getScoreColor(metrics.fcp, { good: 1800, poor: 3000 }) as any}>
                    {formatTime(metrics.fcp)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">LCP</span>
                  <Badge variant={getScoreColor(metrics.lcp, { good: 2500, poor: 4000 }) as any}>
                    {formatTime(metrics.lcp)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">CLS</span>
                  <Badge variant={getScoreColor(metrics.cls, { good: 0.1, poor: 0.25 }) as any}>
                    {metrics.cls?.toFixed(3) || 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">FID</span>
                  <Badge variant={getScoreColor(metrics.fid, { good: 100, poor: 300 }) as any}>
                    {formatTime(metrics.fid)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">INP</span>
                  <Badge variant={getScoreColor(metrics.inp, { good: 200, poor: 500 }) as any}>
                    {formatTime(metrics.inp)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Network Info */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wifi className="h-4 w-4" />
                  Network
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Type</span>
                  <Badge variant="outline">
                    {metrics.effectiveType || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Downlink</span>
                  <span className="text-xs">{metrics.downlink || 'N/A'} Mbps</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">RTT</span>
                  <span className="text-xs">{metrics.rtt || 'N/A'}ms</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {/* Load Times */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Load Times</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">TTFB</span>
                  <span className="text-xs">{formatTime(metrics.ttfb)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">DOM Ready</span>
                  <span className="text-xs">{formatTime(metrics.domContentLoaded)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Window Load</span>
                  <span className="text-xs">{formatTime(metrics.windowLoad)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Total Blocking</span>
                  <span className="text-xs">{formatTime(metrics.totalBlockingTime)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            {metrics.memoryUsage && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Memory Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Used</span>
                    <span className="text-xs">{formatBytes(metrics.memoryUsage.used)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Total</span>
                    <span className="text-xs">{formatBytes(metrics.memoryUsage.total)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Limit</span>
                    <span className="text-xs">{formatBytes(metrics.memoryUsage.limit)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resource Performance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {metrics.resourceLoadTimes.slice(-5).map((resource, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="truncate flex-1">{resource.name.split('/').pop()}</span>
                      <Badge variant={resource.cached ? 'secondary' : 'outline'} className="text-xs">
                        {Math.round(resource.duration)}ms
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="user" className="space-y-4">
            {/* User Context */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  User Context
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Viewport</span>
                  <span className="text-xs">{metrics.viewport.width}×{metrics.viewport.height}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">DPR</span>
                  <span className="text-xs">{metrics.devicePixelRatio}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Language</span>
                  <span className="text-xs">{metrics.language}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Timezone</span>
                  <span className="text-xs">{metrics.timezone}</span>
                </div>
              </CardContent>
            </Card>

            {/* Recent Interactions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Recent Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {interactions.slice(-5).map((interaction, index) => (
                    <div key={index} className="flex justify-between items-center text-xs">
                      <span className="capitalize">{interaction.type}</span>
                      <span className="text-gray-500 truncate flex-1 mx-2">{interaction.target}</span>
                      <span className="text-gray-400">
                        {new Date(interaction.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            {/* Error Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Error Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Total Errors</span>
                  <Badge variant={errors.length > 0 ? 'destructive' : 'secondary'}>
                    {errors.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Errors */}
            {errors.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Recent Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {errors.slice(-3).map((error, index) => (
                      <div key={index} className="p-2 bg-red-50 rounded text-xs">
                        <div className="font-medium text-red-800 truncate">
                          {error.message}
                        </div>
                        <div className="text-red-600 text-xs">
                          {error.filename}:{error.lineno}
                        </div>
                        <div className="text-red-500 text-xs">
                          {new Date(error.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Session Info */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Session: {metrics.sessionId.slice(-8)}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Toggle RUM Dashboard visibility
 */
export function toggleRUMDashboard() {
  const current = localStorage.getItem('showRUMDashboard') === 'true';
  localStorage.setItem('showRUMDashboard', (!current).toString());
  window.location.reload();
}
