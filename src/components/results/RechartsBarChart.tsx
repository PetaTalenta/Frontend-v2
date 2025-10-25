'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui-chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { ChartErrorBoundary } from './ui-chart-error-boundary';

export interface BarDataPoint {
  label: string;
  value: number;
  fullName?: string;
  description?: string;
}

export interface BarChartConfig {
  title: string;
  description: string;
  color: string;
  data: BarDataPoint[];
  icon?: React.ReactNode;
  showLabels?: boolean;
  showGrid?: boolean;
  barSize?: number;
  height?: number;
  customTooltip?: React.ReactNode;
}

interface RechartsBarChartProps {
  config: BarChartConfig;
  className?: string;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
}

// Fallback component untuk chart loading
const ChartSkeleton = ({ className = '' }: { className?: string }) => (
  <Card className={`bg-white border-gray-200/60 shadow-sm ${className}`}>
    <CardContent className="p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </CardContent>
  </Card>
);

// Error fallback untuk chart
const ChartError = ({ 
  error, 
  className = '',
  onRetry 
}: { 
  error: string; 
  className?: string;
  onRetry?: () => void;
}) => (
  <Card className={`bg-red-50 border-red-200 shadow-sm ${className}`}>
    <CardContent className="p-6">
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="p-2 bg-red-100 rounded-full">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-red-900 mb-2">
            Chart Error
          </h3>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

function RechartsBarChartComponent({ 
  config, 
  className = '', 
  loading = false, 
  error, 
  onRetry 
}: RechartsBarChartProps) {
  // Show loading state
  if (loading) {
    return <ChartSkeleton className={className} />;
  }

  // Show error state
  if (error) {
    return <ChartError error={error} className={className} onRetry={onRetry} />;
  }

  // Show no data state
  if (!config.data || config.data.length === 0) {
    return (
      <Card className={`bg-white border-amber-200 shadow-sm ${className}`}>
        <CardContent className="p-6">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <div className="p-2 bg-amber-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900 mb-2">
                Data Tidak Tersedia
              </h3>
              <p className="text-amber-700">
                Data bar chart tidak tersedia. Pastikan assessment telah selesai diproses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    value: {
      label: "Score",
      color: config.color,
    },
  };

  const maxValue = Math.max(...config.data.map(item => item.value));

  // Custom tooltip formatter
  const tooltipFormatter = (value: any, name: any) => {
    const item = config.data.find(item => item.label === name);
    return [
      `${value}%`,
      item ? `${item.fullName || item.label}${item.description ? ` - ${item.description}` : ''}` : name
    ];
  };

  return (
    <Card className={`bg-white border-gray-200/60 shadow-sm ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          {config.icon && (
            <div className="p-2 rounded-lg" style={{ backgroundColor: `${config.color}10` }}>
              {config.icon}
            </div>
          )}
          <div>
            <CardTitle className="text-lg font-semibold text-[#1f2937]">
              {config.title}
            </CardTitle>
            <p className="text-xs text-[#6b7280]">{config.description}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="relative">
          <ChartContainer config={chartConfig} className="w-full">
            <ResponsiveContainer width="100%" height={config.height || 300}>
              <BarChart 
                data={config.data} 
                margin={{ top: 20, right: 30, bottom: 60, left: 20 }}
              >
                {config.showGrid && (
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e5e7eb" 
                    vertical={false}
                  />
                )}
                <XAxis 
                  dataKey="label"
                  tick={{
                    fill: '#6b7280',
                    fontSize: 11,
                    fontWeight: 500
                  }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  domain={[0, maxValue]}
                  tick={{
                    fill: '#6b7280',
                    fontSize: 11
                  }}
                  tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={tooltipFormatter}
                    />
                  }
                />
                <Bar 
                  dataKey="value" 
                  fill={config.color}
                  barSize={config.barSize || 40}
                  radius={[4, 4, 0, 0]}
                  label={config.showLabels ? { position: 'top' } : false}
                >
                  {config.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={config.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: config.color }}>
                {Math.round(config.data.reduce((sum, item) => sum + item.value, 0) / config.data.length)}%
              </div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {maxValue}%
              </div>
              <div className="text-sm text-gray-600">Highest Score</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Wrap component with error boundary
export default React.memo(function RechartsBarChart(props: RechartsBarChartProps) {
  return (
    <ChartErrorBoundary>
      <RechartsBarChartComponent {...props} />
    </ChartErrorBoundary>
  );
});