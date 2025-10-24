import { Card, CardContent, CardHeader, CardTitle } from "./card"
import type { ChartData } from "../../types/dashboard"

interface ChartCardProps {
  title: string
  description: string
  data: ChartData[]
}

export function ChartCard({ title, description, data }: ChartCardProps) {
  const maxValue = Math.max(...data.map(item => item.value))

  return (
    <Card className="bg-white border-dashboard-border">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-dashboard-text-primary">{title}</CardTitle>
        <p className="text-sm text-dashboard-text-secondary">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-2 mb-6">
          {data.map((item, index) => {
            const height = (item.value / maxValue) * 100
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <div
                  className="relative w-dashboard-chart-bar rounded-dashboard-2xl overflow-hidden"
                  style={{ height: '128px', backgroundColor: '#F3F3F3' }}
                >
                  <div
                    className="absolute bottom-0 w-full transition-all duration-300"
                    style={{
                      height: `${height}%`,
                      backgroundColor: item.color,
                      minHeight: '20px'
                    }}
                  />
                </div>
                <div className="w-2 h-2 rounded-full bg-dashboard-background-indicator" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

