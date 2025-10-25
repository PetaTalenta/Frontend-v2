'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from './ui-chart';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { AlertCircle } from 'lucide-react';
import { ChartErrorBoundary } from './ui-chart-error-boundary';

export interface RadarDataPoint {
  category: string;
  fullName: string;
  score: number;
  fullMark: number;
  description?: string;
}

export interface RadarChartConfig {
  title: string;
  description: string;
  color: string;
  data: RadarDataPoint[];
  icon?: React.ReactNode;
  showLegend?: boolean;
  showStatistics?: boolean;
  customLegend?: React.ReactNode;
  customStatistics?: React.ReactNode;
}

interface BaseRadarChartProps {
  config: RadarChartConfig;
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

function BaseRadarChartComponent({ 
  config, 
  className = '', 
  loading = false, 
  error, 
  onRetry 
}: BaseRadarChartProps) {
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
                Data radar chart tidak tersedia. Pastikan assessment telah selesai diproses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    score: {
      label: "Score",
      color: config.color,
    },
  };

  // Calculate statistics
  const averageScore = Math.round(config.data.reduce((sum, item) => sum + item.score, 0) / config.data.length);
  const highestScore = Math.max(...config.data.map(item => item.score));
  const strongestItem = config.data.find(item => item.score === highestScore);

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
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[400px]">
            <RadarChart data={config.data} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => {
                    const item = config.data.find(item => item.category === name);
                    return [
                      `${value}%`,
                      item ? `${item.fullName}${item.description ? ` - ${item.description}` : ''}` : name
                    ];
                  }}
                />}
              />
              <PolarGrid
                stroke="#e2e8f0"
                strokeWidth={1}
                strokeOpacity={0.4}
                fill="none"
                gridType="polygon"
              />
              <PolarAngleAxis
                dataKey="category"
                tick={{
                  fill: '#374151',
                  fontSize: 12,
                  fontWeight: 600
                }}
                tickFormatter={(value) => value}
                className="text-[#374151]"
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{
                  fill: '#9ca3af',
                  fontSize: 10
                }}
                tickCount={6}
                axisLine={false}
                className="text-[#9ca3af]"
              />
              <Radar
                dataKey="score"
                stroke={config.color}
                fill={config.color}
                fillOpacity={0.15}
                strokeWidth={2.5}
                dot={{
                  fill: config.color,
                  strokeWidth: 2,
                  stroke: '#ffffff',
                  r: 4,
                }}
                activeDot={{
                  fill: config.color,
                  strokeWidth: 3,
                  stroke: '#ffffff',
                  r: 6,
                }}
              />
            </RadarChart>
          </ChartContainer>
        </div>

        {/* Custom Legend */}
        {config.showLegend && config.customLegend && (
          <div className="mt-4">
            {config.customLegend}
          </div>
        )}

        {/* Default Legend */}
        {config.showLegend && !config.customLegend && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-2 text-xs"
                 style={{
                   gridTemplateColumns: config.data.length <= 6 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)'
                 }}>
              {config.data.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50/50 rounded-md border border-gray-100">
                  <div className="flex flex-col">
                    <span className="font-medium text-[#374151] text-xs">{item.category}</span>
                    <span className="text-[#9ca3af] text-[10px]">{item.fullName}</span>
                  </div>
                  <span className="font-bold text-sm" style={{ color: config.color }}>{item.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Custom Statistics */}
        {config.showStatistics && config.customStatistics && (
          <div className="mt-4">
            {config.customStatistics}
          </div>
        )}

        {/* Default Statistics */}
        {config.showStatistics && !config.customStatistics && (
          <div className="mt-4">
            <div className="flex items-center justify-between p-4 rounded-lg border"
                 style={{
                   background: `linear-gradient(to right, ${config.color}05, ${config.color}10)`,
                   borderColor: `${config.color}20`
                 }}>
              <div className="text-center">
                <div className="text-xl font-bold" style={{ color: config.color }}>
                  {averageScore}
                </div>
                <div className="text-xs text-[#6b7280] font-medium">Average</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-[#059669]">
                  {highestScore}
                </div>
                <div className="text-xs text-[#6b7280] font-medium">Highest</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-bold text-[#dc2626]">
                  {strongestItem?.fullName}
                </div>
                <div className="text-xs text-[#6b7280] font-medium">Strongest</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Wrap the component with error boundary
export default React.memo(function BaseRadarChart(props: BaseRadarChartProps) {
  return (
    <ChartErrorBoundary>
      <BaseRadarChartComponent {...props} />
    </ChartErrorBoundary>
  );
});