import React from "react"
import Image from "next/image"
import { Card, CardContent } from "./card"
import { Skeleton } from "./skeleton"
import { Button } from "./button"
import type { StatCard } from "../../types/dashboard"

// Helper function to convert hex color to CSS filter
const getIconColorFilter = (hexColor: string): string => {
  // Remove the # if present
  const color = hexColor.replace('#', '');
  
  // Convert hex to RGB
  const r = parseInt(color.substr(0, 2), 16) / 255;
  const g = parseInt(color.substr(2, 2), 16) / 255;
  const b = parseInt(color.substr(4, 2), 16) / 255;
  
  // Special case for red colors (like #DE3729)
  if (r > 0.7 && g < 0.3 && b < 0.3) {
    return 'invert(0.2) sepia(1) saturate(10) hue-rotate(-50deg) brightness(0.9)';
  }
  
  // Special case for green colors (like #00A63E)
  if (r < 0.3 && g > 0.6 && b < 0.3) {
    return 'invert(0.4) sepia(1) saturate(10) hue-rotate(90deg) brightness(0.8)';
  }
  
  // Special case for blue colors (like #6C7EEB)
  if (r < 0.5 && g < 0.6 && b > 0.7) {
    return 'invert(0.3) sepia(1) saturate(10) hue-rotate(200deg) brightness(0.8)';
  }
  
  // Default fallback
  return `invert(1) sepia(1) saturate(100) hue-rotate(${Math.round((r + g + b) * 120)}deg) brightness(${0.8 + (r + g + b) / 3})`;
};

interface StatsCardProps {
  stat?: StatCard
  isLoading?: boolean
  isError?: boolean
  onRetry?: () => void
  error?: string | null
}

function StatsCardComponent({
  stat,
  isLoading = false,
  isError = false,
  onRetry,
  error
}: StatsCardProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card className="rounded-dashboard-2xl border-dashboard-border shadow-dashboard-sm bg-white flex flex-col items-stretch justify-center gap-4 flex-wrap overflow-hidden box-border max-w-full p-0 min-h-[100px] sm:min-h-[110px]">
        <CardContent className="pt-0 px-3.5 py-3.5 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
          {stat?.id === 'token-balance' ? (
            // Token Balance loading state - centered without icon
            <div className="flex flex-col items-center justify-center gap-2 h-full">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            // Other stats loading state - with icon
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-shrink-1 box-border max-w-full flex-1">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full" />
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // Error state
  if (isError) {
    return (
      <Card className="rounded-dashboard-2xl border-dashboard-border shadow-dashboard-sm bg-white flex flex-col items-stretch justify-center gap-4 flex-wrap overflow-hidden box-border max-w-full p-0 min-h-[100px] sm:min-h-[110px]">
        <CardContent className="pt-0 px-3.5 py-3.5 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
          <div className="flex flex-col items-center justify-center gap-2 h-full">
            <div className="text-red-500 text-sm text-center">
              {error || "Failed to load data"}
            </div>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-1"
              >
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Normal state
  if (!stat) {
    return null
  }

  return (
    <Card className="rounded-dashboard-2xl border-dashboard-border shadow-dashboard-sm bg-white flex flex-col items-stretch justify-center gap-4 flex-wrap overflow-hidden box-border max-w-full p-0 min-h-[100px] sm:min-h-[110px]">
      <CardContent className="pt-0 px-3.5 py-3.5 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        {stat.id === 'token-balance' ? (
          // Token Balance card - centered without icon
          <div className="flex flex-col items-center justify-center gap-2 h-full">
            <div className="font-bold text-dashboard-text-primary text-2xl sm:text-3xl lg:text-3xl leading-tight text-center">{stat.value}</div>
            <div className="text-dashboard-text-secondary text-sm sm:text-sm lg:text-xs leading-normal text-center">{stat.label}</div>
          </div>
        ) : (
          // Other stats cards - with icon
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-shrink-1 box-border max-w-full">
              <div className="font-bold text-dashboard-text-primary text-2xl sm:text-3xl lg:text-3xl leading-tight">{stat.value}</div>
              <div className="text-dashboard-text-secondary text-sm sm:text-sm lg:text-xs leading-normal">{stat.label}</div>
            </div>
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: stat.color }}
            >
              <div
                className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 flex items-center justify-center"
                style={{
                  filter: stat.iconColor ? getIconColorFilter(stat.iconColor) : undefined
                }}
              >
                <Image
                  src={`/icons/${stat.icon}`}
                  alt={stat.label}
                  width={24}
                  height={24}
                  className="w-full h-full"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const StatsCard = React.memo(StatsCardComponent)
