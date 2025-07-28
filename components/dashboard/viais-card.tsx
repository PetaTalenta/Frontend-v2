import { Card, CardContent } from "../ui/card"
import { ViaScores } from "../../types/assessment-results"
import "../../styles/components/dashboard/viais-card.css"

interface VIAISCardProps {
  viaScores?: ViaScores
}

export function VIAISCard({ viaScores }: VIAISCardProps) {
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
  const viaData = viaScores || defaultViaScores
  const topStrengths = getTopViaStrengths(viaData, 4)

  return (
    <Card className="viais-card">
      <CardContent className="viais-card__content">
        {/* VIAIS Statistics Header */}
        <div className="viais-card__header">
          <h3 className="viais-card__title">VIAIS</h3>
          <p className="viais-card__description">Top Character Strengths</p>
          <div className="viais-card__strengths-grid">
            {topStrengths.map((strength) => (
              <div key={strength.name} className="viais-card__strength-item">
                <div className="viais-card__strength-name">{strength.name}</div>
                <div className="viais-card__strength-score">{strength.score}%</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
