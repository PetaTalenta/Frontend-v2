import React from "react"
import { Card, CardContent } from "./card"
import { Progress } from "./progress"
import type { ProgressItem } from "../../types/dashboard"

interface ProgressCardProps {
  title: string
  description: string
  data: ProgressItem[]
}

function ProgressCardComponent({ title, description, data }: ProgressCardProps) {
  return (
    <Card className="bg-white border-dashboard-border">
      <CardContent className="p-4 sm:p-5 lg:p-6">
        <h3 className="font-semibold text-dashboard-text-primary text-lg sm:text-xl">{title}</h3>
        <p className="text-xs sm:text-sm mb-2 sm:mb-3 lg:mb-2 text-dashboard-text-secondary">{description}</p>

        <div className="space-y-3 sm:space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm sm:text-base">
                <span className="text-dashboard-text-secondary text-sm sm:text-base">{item.label}</span>
                <span className="font-medium text-dashboard-text-primary text-sm sm:text-base sm:font-bold">{item.value}%</span>
              </div>
              <Progress
                value={item.value}
                className="h-2 sm:h-2.5"
                style={{
                  "--progress-background": "#6475e9",
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export const ProgressCard = React.memo(ProgressCardComponent)
