import { Card, CardContent } from "../ui/card"
import { OceanScores } from "../../types/assessment-results"
import "../../styles/components/dashboard/ocean-card.css"

interface OceanCardProps {
  oceanScores?: OceanScores
}

export function OceanCard({ oceanScores }: OceanCardProps) {
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
    <Card className="ocean-card">
      <CardContent className="ocean-card__content">
        {/* OCEAN Header */}
        <div className="ocean-card__header">
          <h3 className="ocean-card__title">OCEAN</h3>
          <p className="ocean-card__description">Lima Sifat Kepribadian Utama</p>
        </div>

        {/* OCEAN Bar Chart */}
        <div className="ocean-card__chart-container">
          {oceanData.map((item) => {
            const heightPercentage = Math.max((item.score / 100) * 100, 15) // Minimum 15% height for visibility
            return (
              <div key={item.trait} className="ocean-card__bar-item">
                {/* Percentage label positioned above the bar chart area */}
                <div className="ocean-card__percentage-container">
                  <span className="ocean-card__percentage">
                    {item.score}%
                  </span>
                </div>
                <div
                  className="ocean-card__bar-background"
                  style={{ height: '128px', backgroundColor: '#F3F3F3' }}
                >
                  <div
                    className="ocean-card__bar-fill"
                    style={{
                      height: `${heightPercentage}%`,
                      backgroundColor: item.color,
                      minHeight: '20px'
                    }}
                  />
                </div>
                <span className="ocean-card__trait-label">{item.trait}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
