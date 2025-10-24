import React from "react"
import { Card, CardContent } from "./card"
import { OceanScores } from "../../types/assessment-results"

interface OceanCardProps {
  oceanScores?: OceanScores
}

function OceanCardComponent({ oceanScores }: OceanCardProps) {
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
      color: '#a2acf2', // Blue
    },
    {
      trait: 'EXTN',
      score: scores.extraversion,
      color: '#6475e9', // Blue
    },
    {
      trait: 'AGRS',
      score: scores.agreeableness,
      color: '#a2acf2', // Blue
    },
    {
      trait: 'NESM',
      score: scores.neuroticism,
      color: '#6475e9', // Light blue for neuroticism (as in original)
    },
  ]

  return (
    <Card className="bg-white border-[#eaecf0]">
      <CardContent className="flex flex-col space-y-1.5 p-6 sm:p-4 sm:space-y-3 lg:p-4 lg:space-y-1.5">
        {/* OCEAN Header */}
        <div className="text-center mb-0">
          <h3 className="text-lg font-semibold text-left text-[#1e1e1e] sm:text-lg sm:font-semibold lg:text-lg lg:font-semibold lg:text-left">OCEAN</h3>
          <p className="text-xs text-left text-[#64707d] sm:text-sm sm:mb-3 lg:text-xs lg:mb-0">Lima Sifat Kepribadian Utama</p>
        </div>

        {/* OCEAN Bar Chart */}
        <div className="flex items-center justify-center gap-2 sm:gap-2 lg:gap-2">
          {oceanData.map((item) => {
            const heightPercentage = Math.max((item.score / 100) * 100, 15) // Minimum 15% height for visibility
            return (
              <div key={item.trait} className="flex flex-col items-center gap-1 flex-1 sm:gap-2 lg:gap-1">
                {/* Percentage label positioned above the bar chart area */}
                <div className="h-6 flex items-center justify-center sm:h-5 lg:h-6">
                  <span className="text-xs font-semibold text-[#1e1e1e] sm:text-sm sm:font-bold lg:text-xs lg:font-semibold">
                    {item.score}%
                  </span>
                </div>
                <div
                  className="relative w-full rounded-lg overflow-hidden transition-all duration-300"
                  style={{ height: '110px', backgroundColor: '#f3f3f3' }}
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
                <span className="text-xs font-medium text-[#1e1e1e] sm:text-sm sm:font-medium lg:text-xs lg:font-medium">{item.trait}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export const OceanCard = React.memo(OceanCardComponent)
