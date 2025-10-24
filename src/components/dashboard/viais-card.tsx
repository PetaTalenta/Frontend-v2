import React from "react"
import { Card, CardContent } from "./card"

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
    <Card className="border-[#eaecf0]" style={{ background: '#5A6BD8' }}>
      <CardContent className="flex flex-col space-y-1 p-4 sm:p-4 sm:space-y-3 lg:p-4 lg:space-y-1">
        {/* VIAIS Statistics Header */}
        <div className="text-center">
          <h3 className="text-xl font-semibold text-left text-[#ffffff] sm:text-lg lg:text-xl">VIAIS</h3>
          <p className="text-xs text-left mb-4 text-[#fcfeff] sm:text-sm sm:mb-3 lg:text-xs lg:mb-4">Kekuatan Karakter Utama</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-1 sm:gap-2 lg:grid-cols-2 lg:gap-2">
            {topStrengths.map((strength) => (
              <div key={strength.name} className="rounded-lg p-2 bg-[#f8f9fa] sm:p-3 sm:rounded-lg sm:flex sm:justify-between sm:items-center lg:p-2 lg:rounded-lg">
                <div className="text-xs font-medium truncate text-[#64707d] sm:text-sm sm:font-medium sm:flex-1 lg:text-xs lg:font-medium lg:truncate">{strength.name}</div>
                <div className="text-sm font-semibold text-[#1e1e1e] sm:text-base sm:font-bold sm:ml-auto lg:text-sm lg:font-semibold">{strength.score}%</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


export const VIAISCard = React.memo(VIAISCardComponent)
