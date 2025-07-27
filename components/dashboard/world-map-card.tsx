import { Card, CardContent } from "../ui/card"
import { OceanScores } from "../../types/assessment-results"

interface WorldMapCardProps {
  title: string
  description: string
  oceanScores?: OceanScores
}

export function WorldMapCard({ title, description, oceanScores }: WorldMapCardProps) {
  // Default Ocean scores if no assessment data is available
  const defaultScores: OceanScores = {
    openness: 75,
    conscientiousness: 60,
    extraversion: 45,
    agreeableness: 80,
    neuroticism: 25
  }

  // Use provided scores or fallback to defaults
  const scores = oceanScores || defaultScores

  // Ocean data for bar chart with colors matching the current design
  const oceanData = [
    {
      trait: 'OPNS',
      score: scores.openness,
      color: '#6475e9', // Blue
    },
    {
      trait: 'CONS',
      score: scores.conscientiousness,
      color: '#6475e9', // Blue
    },
    {
      trait: 'EXTN',
      score: scores.extraversion,
      color: '#6475e9', // Blue
    },
    {
      trait: 'AGRS',
      score: scores.agreeableness,
      color: '#6475e9', // Blue
    },
    {
      trait: 'NESM',
      score: scores.neuroticism,
      color: '#a2acf2', // Light blue for neuroticism (as in original)
    },
  ]
  return (
    <Card className="bg-white border-[#eaecf0]">
      <CardContent className="flex flex-col space-y-1.5 p-6">
        <div className="flex items-center justify-center mb-4">
          <div className="w-40 h-40 rounded-full border-4 border-[#6475e9] overflow-hidden">
            <img
              src="/profile-placeholderr.jpeg"
              alt="Profile placeholder"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#1e1e1e] mb-2">{title}</h3>
          <p className="text-sm text-[#64707d] mb-4">{description}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {oceanData.map((item, index) => {
            const heightPercentage = Math.max((item.score / 100) * 100, 15) // Minimum 15% height for visibility
            return (
              <div key={item.trait} className="flex flex-col items-center gap-2 flex-1">
                <div
                  className="relative w-full rounded-lg overflow-hidden"
                  style={{ height: '128px', backgroundColor: '#F3F3F3' }}
                >
                  <div
                    className="absolute bottom-0 w-full transition-all duration-300"
                    style={{
                      height: `${heightPercentage}%`,
                      backgroundColor: item.color,
                      minHeight: '20px'
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-[#1e1e1e]">{item.trait}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
