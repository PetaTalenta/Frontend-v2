import React from "react"
import { Card, CardContent } from "./card"
import "../../styles/components/dashboard/viais-card.css"

// Type definition for ViaScores
interface ViaScores {
  creativity: number;
  curiosity: number;
  judgment: number;
  loveOfLearning: number;
  perspective: number;
  bravery: number;
  perseverance: number;
  honesty: number;
  zest: number;
  love: number;
  kindness: number;
  socialIntelligence: number;
  teamwork: number;
  fairness: number;
  leadership: number;
  forgiveness: number;
  humility: number;
  prudence: number;
  selfRegulation: number;
  appreciationOfBeauty: number;
  gratitude: number;
  hope: number;
  humor: number;
  spirituality: number;
}

interface VIAISCardProps {
  viaScores?: ViaScores
}

function VIAISCardComponent({ viaScores }: VIAISCardProps) {
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
          <p className="viais-card__description">Kekuatan Karakter Utama</p>
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


export const VIAISCard = React.memo(VIAISCardComponent)
