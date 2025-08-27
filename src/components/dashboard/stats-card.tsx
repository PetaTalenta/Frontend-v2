import { Card, CardContent } from "../ui/card"
import type { StatCard } from "../../types/dashboard"
import "../../styles/components/dashboard/stats-card.css"

interface StatsCardProps {
  stat: StatCard
}

export function StatsCard({ stat }: StatsCardProps) {
  return (
    <Card className="stats-card">
      <CardContent className="stats-card__content">
        <div className="stats-card__container">
          <div className="stats-card__text-container">
            <div className="stats-card__value">{stat.value}</div>
            <div className="stats-card__label">{stat.label}</div>
          </div>
          <div
            className="stats-card__icon-container"
            style={{ backgroundColor: stat.color }}
          >
            <img
              src={`/icons/${stat.icon}`}
              alt={stat.label}
              className="stats-card__icon"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
