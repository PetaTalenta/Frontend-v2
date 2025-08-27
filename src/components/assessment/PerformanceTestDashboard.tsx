/**
 * Performance Test Dashboard Component
 * Displays assessment performance testing results and metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  Settings,
  Gauge,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { 
  PerformanceTestResult, 
  PerformanceMetrics,
  compareAssessmentModes,
  validateAssessmentFunctionality
} from '../../utils/assessment-performance-test';

interface PerformanceTestDashboardProps {
  className?: string;
}

export default function PerformanceTestDashboard({
  className = ''
}: PerformanceTestDashboardProps) {
  
  const [isRunning, setIsRunning] = useState(false);
  const [testResult, setTestResult] = useState<PerformanceTestResult | null>(null);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } | null>(null);
  const [progress, setProgress] = useState(0);

  // Run performance tests
  const runPerformanceTest = async () => {
    setIsRunning(true);
    setProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 1000);

      const result = await compareAssessmentModes();
      
      clearInterval(progressInterval);
      setProgress(100);
      setTestResult(result);
      
    } catch (error) {
      console.error('Performance test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // Run validation tests
  const runValidation = async () => {
    try {
      const result = await validateAssessmentFunctionality();
      setValidationResult(result);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // Run validation on component mount
  useEffect(() => {
    runValidation();
  }, []);

  const getModeIcon = (mode: string) => {
    if (mode.includes('Fast-Track')) return Zap;
    if (mode.includes('Streamlined')) return Gauge;
    if (mode.includes('Enhanced')) return Settings;
    return Activity;
  };

  const getModeColor = (mode: string) => {
    if (mode.includes('Fast-Track')) return 'text-purple-600';
    if (mode.includes('Streamlined')) return 'text-green-600';
    if (mode.includes('Enhanced')) return 'text-blue-600';
    return 'text-gray-600';
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatImprovement = (improvement: number) => {
    const percentage = (improvement * 100).toFixed(1);
    return improvement > 0 ? `+${percentage}%` : `${percentage}%`;
  };

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-blue-600" />
            Assessment Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={runPerformanceTest}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? 'Running Tests...' : 'Run Performance Test'}
            </Button>
            
            <Button 
              onClick={runValidation}
              variant="outline"
              className="flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Validate Functionality
            </Button>
          </div>
          
          {isRunning && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>Testing assessment modes...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Results */}
      {validationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {validationResult.isValid ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              Functionality Validation
              <Badge variant={validationResult.isValid ? "default" : "destructive"}>
                {validationResult.isValid ? 'Passed' : 'Failed'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {validationResult.issues.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-red-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Issues Found:
                </h4>
                <ul className="space-y-1">
                  {validationResult.issues.map((issue, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                      <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {validationResult.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Recommendations:</h4>
                <ul className="space-y-1">
                  {validationResult.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                      <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Test Results */}
      {testResult && (
        <>
          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Performance Test Summary
                <Badge variant={testResult.summary.overallSuccess ? "default" : "secondary"}>
                  {testResult.summary.overallSuccess ? 'Target Met' : 'Needs Improvement'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {testResult.summary.bestMode}
                  </div>
                  <div className="text-sm text-blue-700">Fastest Mode</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatImprovement(testResult.summary.maxSpeedImprovement)}
                  </div>
                  <div className="text-sm text-green-700">Max Speed Improvement</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {testResult.summary.recommendedMode}
                  </div>
                  <div className="text-sm text-purple-700">Recommended Mode</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Baseline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-blue-600" />
                  Baseline (Enhanced Mode)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Time:</span>
                    <span className="font-medium">{formatTime(testResult.baseline.averageTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-medium">{(testResult.baseline.successRate * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Throughput:</span>
                    <span className="font-medium">{testResult.baseline.throughput.toFixed(1)} /min</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Optimized Results */}
            {testResult.optimized.map((result, index) => {
              const Icon = getModeIcon(result.mode);
              const colorClass = getModeColor(result.mode);
              
              return (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${colorClass}`} />
                      {result.mode}
                      {result.speedImprovement && result.speedImprovement > 0 && (
                        <Badge className="bg-green-100 text-green-800">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {formatImprovement(result.speedImprovement)}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Average Time:</span>
                        <span className="font-medium">{formatTime(result.averageTime)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Success Rate:</span>
                        <span className="font-medium">{(result.successRate * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Throughput:</span>
                        <span className="font-medium">{result.throughput.toFixed(1)} /min</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Speed Improvement:</span>
                        <span className={`font-medium ${
                          (result.speedImprovement || 0) > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.speedImprovement ? formatImprovement(result.speedImprovement) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
