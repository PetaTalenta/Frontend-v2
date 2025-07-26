import { Card, CardContent } from "../ui/card"
import type { StatCard } from "../../types/dashboard"

interface StatsCardProps {
  stat: StatCard
}

export function StatsCard({ stat }: StatsCardProps) {
  return (
    <Card className="rounded-2xl border text-card-foreground shadow-sm bg-white border-[#eaecf0]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-[#1e1e1e]">{stat.value}</div>
            <div className="text-xs text-[#64707d]">{stat.label}</div>
          </div>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: stat.color }}
          >
            <img
              src={`/icons/${stat.icon}`}
              alt={stat.label}
              className="w-6 h-6"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
