import React from "react"
import { Card, CardContent } from "./card"
import { Progress } from "./progress"
import type { ProgressItem } from "../../types/dashboard"
import "../../styles/components/dashboard/progress-card.css"

interface ProgressCardProps {
  title: string
  description: string
  data: ProgressItem[]
}

function ProgressCardComponent({ title, description, data }: ProgressCardProps) {
  return (
    <Card className="progress-card">
      <CardContent className="progress-card__content">
        <h3 className="progress-card__title">{title}</h3>
        <p className="progress-card__description">{description}</p>

        <div className="progress-card__items">
          {data.map((item, index) => (
            <div key={index} className="progress-card__item">
              <div className="progress-card__item-header">
                <span className="progress-card__item-label">{item.label}</span>
                <span className="progress-card__item-value">{item.value}%</span>
              </div>
              <Progress
                value={item.value}
                className="progress-card__progress-bar"
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
