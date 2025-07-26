import { Card, CardContent } from "../ui/card"
import { Progress } from "../ui/progress"
import type { ProgressItem } from "../../types/dashboard"

interface ProgressCardProps {
  title: string
  description: string
  data: ProgressItem[]
}

export function ProgressCard({ title, description, data }: ProgressCardProps) {
  return (
    <Card className="bg-white border-[#eaecf0]">
      <CardContent className="p-6">
        <h3 className="font-semibold text-[#1e1e1e]">{title}</h3>
        <p className="text-sm text-[#64707d] mb-4">{description}</p>

        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#64707d]">{item.label}</span>
                <span className="text-[#1e1e1e] font-medium">{item.value}%</span>
              </div>
              <Progress
                value={item.value}
                className="h-2 bg-[#eaecf0]"
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
