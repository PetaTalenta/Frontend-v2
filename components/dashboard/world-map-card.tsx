import { Card, CardContent } from "../ui/card"
import { OceanScores, ViaScores } from "../../types/assessment-results"
import "../../styles/components/dashboard/world-map-card.css"

interface WorldMapCardProps {
  title: string
  description: string
  oceanScores?: OceanScores
  viaScores?: ViaScores
}

export function WorldMapCard({ title, description, oceanScores, viaScores }: WorldMapCardProps) {
  // Default Ocean scores if no assessment data is available
  const defaultScores: OceanScores = {
    openness: 75,
    conscientiousness: 60,
    extraversion: 45,
    agreeableness: 80,
    neuroticism: 25
  }

  // Default VIAIS scores from latest assessment
  const defaultViaScores: ViaScores = {
    creativity: 92,
    curiosity: 89,
    judgment: 78,
    loveOfLearning: 85,
    perspective: 74,
    bravery: 65,
    perseverance: 82,
    honesty: 88,
    zest: 58,
    love: 76,
    kindness: 84,
    socialIntelligence: 69,
    teamwork: 71,
    fairness: 86,
    leadership: 63,
    forgiveness: 79,
    humility: 72,
    prudence: 68,
    selfRegulation: 75,
    appreciationOfBeauty: 91,
    gratitude: 83,
    hope: 77,
    humor: 64,
    spirituality: 52
  }

  // Helper function to get top VIAIS strengths
  const getTopViaStrengths = (scores: ViaScores, count: number = 4) => {
    const strengthNames: { [key: string]: string } = {
      creativity: 'Creativity',
      curiosity: 'Curiosity',
      judgment: 'Judgment',
      loveOfLearning: 'Love of Learning',
      perspective: 'Perspective',
      bravery: 'Bravery',
      perseverance: 'Perseverance',
      honesty: 'Honesty',
      zest: 'Zest',
      love: 'Love',
      kindness: 'Kindness',
      socialIntelligence: 'Social Intelligence',
      teamwork: 'Teamwork',
      fairness: 'Fairness',
      leadership: 'Leadership',
      forgiveness: 'Forgiveness',
      humility: 'Humility',
      prudence: 'Prudence',
      selfRegulation: 'Self Regulation',
      appreciationOfBeauty: 'Appreciation of Beauty',
      gratitude: 'Gratitude',
      hope: 'Hope',
      humor: 'Humor',
      spirituality: 'Spirituality'
    }

    return Object.entries(scores)
      .sort(([,a], [,b]) => b - a)
      .slice(0, count)
      .map(([key, score]) => ({
        name: strengthNames[key] || key,
        score: score
      }))
  }

  // Use provided scores or fallback to defaults
  const scores = oceanScores || defaultScores
  const viaData = viaScores || defaultViaScores
  const topStrengths = getTopViaStrengths(viaData, 4)

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
    <Card className="world-map-card">
      <CardContent className="world-map-card__content">
        {/* VIAIS Statistics Header */}
        <div className="world-map-card__viais-header">
          <h3 className="world-map-card__viais-title">VIAIS Assessment</h3>
          <div className="world-map-card__strengths-grid">
            {topStrengths.map((strength) => (
              <div key={strength.name} className="world-map-card__strength-item">
                <div className="world-map-card__strength-name">{strength.name}</div>
                <div className="world-map-card__strength-score">{strength.score}%</div>
              </div>
            ))}
          </div>
          <p className="world-map-card__viais-description">Top Character Strengths</p>
        </div>

        <div className="world-map-card__ocean-container">
          {oceanData.map((item) => {
            const heightPercentage = Math.max((item.score / 100) * 100, 15) // Minimum 15% height for visibility
            return (
              <div key={item.trait} className="world-map-card__ocean-bar-item">
                {/* Percentage label positioned above the bar chart area */}
                <div className="world-map-card__ocean-percentage-container">
                  <span className="world-map-card__ocean-percentage">
                    {item.score}%
                  </span>
                </div>
                <div
                  className="world-map-card__ocean-bar-background"
                  style={{ height: '128px', backgroundColor: '#F3F3F3' }}
                >
                  <div
                    className="world-map-card__ocean-bar-fill"
                    style={{
                      height: `${heightPercentage}%`,
                      backgroundColor: item.color,
                      minHeight: '20px'
                    }}
                  />
                </div>
                <span className="world-map-card__ocean-trait-label">{item.trait}</span>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
