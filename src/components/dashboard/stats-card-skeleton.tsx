import React from "react"
import { Card, CardContent } from "./card"
import { Skeleton } from "./skeleton"

interface StatsCardSkeletonProps {
  delay?: number // Staggered loading delay in ms
}

export function StatsCardSkeleton({ delay = 0 }: StatsCardSkeletonProps) {
  const [isVisible, setIsVisible] = React.useState(delay === 0)

  React.useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [delay])

  if (!isVisible) {
    return (
      <div className="rounded-dashboard-2xl border-dashboard-border shadow-dashboard-sm bg-white flex flex-col items-stretch justify-center gap-4 flex-wrap overflow-hidden box-border max-w-full p-0 min-h-[100px] sm:min-h-[110px]" />
    )
  }

  return (
    <Card className="rounded-dashboard-2xl border-dashboard-border shadow-dashboard-sm bg-white flex flex-col items-stretch justify-center gap-4 flex-wrap overflow-hidden box-border max-w-full p-0 min-h-[100px] sm:min-h-[110px]">
      <CardContent className="pt-0 px-3.5 py-3.5 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-shrink-1 box-border max-w-full flex-1">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="w-8 h-8 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full" />
        </div>
      </CardContent>
    </Card>
  )
}

export default StatsCardSkeleton