import { Card, CardContent } from "../ui/card"
import { OceanScores, ViaScores } from "../../types/assessment-results"

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
    <Card className="bg-white border-[#eaecf0]">
      <CardContent className="flex flex-col space-y-1.5 p-6">
        {/* VIAIS Statistics Header */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-[#1e1e1e] mb-3" >VIAIS Assessment</h3>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {topStrengths.map((strength, index) => (
              <div key={strength.name} className="bg-[#f8f9fa] rounded-lg p-2">
                <div className="text-xs font-medium text-[#64707d] truncate">{strength.name}</div>
                <div className="text-sm font-semibold text-[#1e1e1e]">{strength.score}%</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[#64707d]">Top Character Strengths</p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {oceanData.map((item, index) => {
            const heightPercentage = Math.max((item.score / 100) * 100, 15) // Minimum 15% height for visibility
            return (
              <div key={item.trait} className="flex flex-col items-center gap-1 flex-1">
                {/* Percentage label positioned above the bar chart area */}
                <div className="h-6 flex items-center justify-center">
                  <span className="text-xs font-semibold text-[#1e1e1e]">
                    {item.score}%
                  </span>
                </div>
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
