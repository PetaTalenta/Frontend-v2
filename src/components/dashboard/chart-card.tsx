import { Card, CardContent, CardHeader, CardTitle } from "./card"
import type { ChartData } from "../../types/dashboard"
import "../../styles/components/dashboard/chart-card.css"

interface ChartCardProps {
  title: string
  description: string
  data: ChartData[]
}

export function ChartCard({ title, description, data }: ChartCardProps) {
  const maxValue = Math.max(...data.map(item => item.value))

  return (
    <Card className="chart-card">
      <CardHeader className="chart-card__header">
        <CardTitle className="chart-card__title">{title}</CardTitle>
        <p className="chart-card__description">{description}</p>
      </CardHeader>
      <CardContent className="chart-card__content">
        <div className="chart-card__chart-container">
          {data.map((item, index) => {
            const height = (item.value / maxValue) * 100
            return (
              <div key={index} className="chart-card__bar-item">
                <div
                  className="chart-card__bar-background"
                  style={{ height: '128px', backgroundColor: '#F3F3F3' }}
                >
                  <div
                    className="chart-card__bar-fill"
                    style={{
                      height: `${height}%`,
                      backgroundColor: item.color,
                      minHeight: '20px'
                    }}
                  />
                </div>
                <div className="chart-card__bar-indicator" />
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

