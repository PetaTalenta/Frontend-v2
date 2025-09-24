'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  Zap, 
  Globe, 
  Activity, 
  Settings, 
  BarChart3,
  Clock,
  Users,
  Cpu,
  Image,
  Wifi
} from 'lucide-react';

// Optimization status will be managed locally
// NOTE: Demo-only performance utils (ab-testing, cdn-performance, rum-monitoring) have been removed.
// Minimal in-component placeholders are used instead to keep this demo functional without extra utils.

interface DemoState {
  cdnInitialized: boolean;
  rumInitialized: boolean;
  abTestingInitialized: boolean;
  workersInitialized: boolean;
  currentTest: string | null;
  calculationProgress: number;
  calculationStage: string;
}

export default function OptimizationDemo() {
  const [state, setState] = useState<DemoState>({
    cdnInitialized: true, // Assume initialized for demo
    rumInitialized: true,
    abTestingInitialized: true,
    workersInitialized: true,
    currentTest: 'web_workers', // Default test variant
    calculationProgress: 0,
    calculationStage: ''
  });

  const [cdnStats, setCdnStats] = useState<any>(null);
  const [rumStats, setRumStats] = useState<any>(null);
  const [workerStats, setWorkerStats] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    initializeOptimizations();

    // Update stats every 5 seconds
    const interval = setInterval(updateStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const initializeOptimizations = async () => {
    try {
      if (typeof window === 'undefined') return;

      // Demo-only: set a static test variant without importing ab-testing util
      const testVariant = 'web_workers';
      setState(prev => ({
        ...prev,
        currentTest: testVariant
      }));

      console.log('Demo optimizations initialized successfully');
    } catch (error) {
      console.error('Failed to initialize demo optimizations:', error);
    }
  };

  const updateStats = async () => {
    try {
      if (typeof window === 'undefined') return;

      // CDN Stats - demo placeholder
      setCdnStats({
        averageResponseTime: 120,
        averageCacheHitRate: 85,
        averageBandwidth: 42,
        averageErrorRate: 0.2,
        availability: 99.9
      });

      // RUM Stats - demo placeholder
      setRumStats({
        fcp: 1200,
        lcp: 1800,
        cls: 0.03,
        fid: 40,
        inp: 180,
        ttfb: 180,
        resourceLoadTimes: [],
        errors: [],
        interactions: [],
        sessionId: 'demo-session',
        network: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
          saveData: false
        },
        viewport: { width: 1440, height: 900 },
        devicePixelRatio: window.devicePixelRatio || 1,
        language: navigator.language || 'en-US'
      });

      // Worker Stats
      const { getComlinkWorkerStatistics } = await import('../../utils/comlink-worker-manager');
      const workerStatistics = await getComlinkWorkerStatistics();
      setWorkerStats(workerStatistics);

    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  };

  const runCalculationDemo = async () => {
    if (typeof window === 'undefined') return;

    setIsCalculating(true);
    setState(prev => ({ ...prev, calculationProgress: 0, calculationStage: 'Starting...' }));

    try {
      // Simulate calculation progress
      const stages = [
        'Initializing workers...',
        'Processing RIASEC scores...',
        'Calculating Big Five traits...',
        'Computing VIA strengths...',
        'Analyzing industry compatibility...',
        'Finalizing results...'
      ];

      const startTime = performance.now();

      for (let i = 0; i < stages.length; i++) {
        setState(prev => ({
          ...prev,
          calculationProgress: (i + 1) * (100 / stages.length),
          calculationStage: stages[i]
        }));

        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
      }

      const endTime = performance.now();
      const calculationTime = endTime - startTime;

      console.log('Demo calculation completed in', calculationTime, 'ms');

    } catch (error) {
      console.error('Calculation demo failed:', error);
    } finally {
      setIsCalculating(false);
      setState(prev => ({ ...prev, calculationProgress: 100, calculationStage: 'Complete!' }));
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🚀 Performance Optimization Demo</h1>
        <p className="text-gray-600">
          Demonstrasi implementasi CDN, RUM, A/B Testing, dan Web Workers
        </p>
      </div>

      {/* Initialization Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Initialization Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="text-sm">CDN</span>
              <Badge variant={state.cdnInitialized ? 'default' : 'secondary'}>
                {state.cdnInitialized ? 'Ready' : 'Loading'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span className="text-sm">RUM</span>
              <Badge variant={state.rumInitialized ? 'default' : 'secondary'}>
                {state.rumInitialized ? 'Ready' : 'Loading'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="text-sm">A/B Testing</span>
              <Badge variant={state.abTestingInitialized ? 'default' : 'secondary'}>
                {state.abTestingInitialized ? 'Ready' : 'Loading'}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              <span className="text-sm">Workers</span>
              <Badge variant={state.workersInitialized ? 'default' : 'secondary'}>
                {state.workersInitialized ? 'Ready' : 'Loading'}
              </Badge>
            </div>
          </div>
          
          {state.currentTest && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>A/B Test Active:</strong> You are in variant "{state.currentTest}" 
                for assessment calculation method testing.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demo Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Performance Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={runCalculationDemo}
              disabled={isCalculating || !state.workersInitialized}
              className="flex items-center gap-2"
            >
              <Cpu className="h-4 w-4" />
              {isCalculating ? 'Calculating...' : 'Run Assessment Calculation'}
            </Button>
            <Button 
              variant="outline"
              onClick={updateStats}
              className="flex items-center gap-2"
            >
              <Activity className="h-4 w-4" />
              Refresh Stats
            </Button>
          </div>

          {isCalculating && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{state.calculationStage}</span>
                <span>{Math.round(state.calculationProgress)}%</span>
              </div>
              <Progress value={state.calculationProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Tabs */}
      <Tabs defaultValue="cdn" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cdn">CDN Stats</TabsTrigger>
          <TabsTrigger value="rum">RUM Stats</TabsTrigger>
          <TabsTrigger value="workers">Worker Stats</TabsTrigger>
          <TabsTrigger value="ab">A/B Testing</TabsTrigger>
        </TabsList>

        <TabsContent value="cdn" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                CDN Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cdnStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {cdnStats.averageResponseTime}ms
                    </div>
                    <div className="text-sm text-gray-600">Avg Response Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {cdnStats.averageCacheHitRate}%
                    </div>
                    <div className="text-sm text-gray-600">Cache Hit Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {cdnStats.averageBandwidth} Mbps
                    </div>
                    <div className="text-sm text-gray-600">Bandwidth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {cdnStats.averageAvailability}%
                    </div>
                    <div className="text-sm text-gray-600">Availability</div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No CDN statistics available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rum" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real User Monitoring
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rumStats ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {rumStats.fcp ? Math.round(rumStats.fcp) : 'N/A'}ms
                    </div>
                    <div className="text-sm text-gray-600">First Contentful Paint</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {rumStats.lcp ? Math.round(rumStats.lcp) : 'N/A'}ms
                    </div>
                    <div className="text-sm text-gray-600">Largest Contentful Paint</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {rumStats.cls ? rumStats.cls.toFixed(3) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Cumulative Layout Shift</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {rumStats.fid ? Math.round(rumStats.fid) : 'N/A'}ms
                    </div>
                    <div className="text-sm text-gray-600">First Input Delay</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {rumStats.effectiveType || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Connection Type</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">
                      {rumStats.viewport ? `${rumStats.viewport.width}×${rumStats.viewport.height}` : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Viewport Size</div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No RUM data available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Web Workers Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workerStats ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {workerStats.totalWorkers}
                    </div>
                    <div className="text-sm text-gray-600">Total Workers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {workerStats.busyWorkers}
                    </div>
                    <div className="text-sm text-gray-600">Busy Workers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {workerStats.totalTasksProcessed}
                    </div>
                    <div className="text-sm text-gray-600">Tasks Processed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {Math.round(workerStats.averageTasksPerWorker)}
                    </div>
                    <div className="text-sm text-gray-600">Avg Tasks/Worker</div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No worker statistics available yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ab" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                A/B Testing Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Current Test Assignment</h4>
                  <p className="text-sm text-gray-600">
                    Test: <strong>Assessment Calculation Method</strong><br/>
                    Variant: <strong>{state.currentTest || 'Not assigned'}</strong><br/>
                    Status: <strong>{state.abTestingInitialized ? 'Active' : 'Initializing'}</strong>
                  </p>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>
                    This A/B test compares the performance of assessment calculations 
                    using Web Workers with Comlink vs. main thread execution.
                  </p>
                  <p className="mt-2">
                    Metrics being tracked: calculation time, user experience score, 
                    and overall page performance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
