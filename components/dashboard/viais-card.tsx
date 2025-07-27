import { Card, CardContent } from "../ui/card"
import { ViaScores } from "../../types/assessment-results"

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
    <Card className="bg-[#6475e9] border-[#eaecf0]">
      <CardContent className="flex flex-col space-y-1.5 p-6">
        {/* VIAIS Statistics Header */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-[#f1f1f1] text-left">VIAIS Assessment</h3>
          <p className="text-xs text-[#f1f1f1] text-left mb-2">Top Character Strengths</p>
          <div className="grid grid-cols-2 gap-2 ">
            {topStrengths.map((strength, index) => (
              <div key={strength.name} className="bg-[#f8f9fa] rounded-lg p-2">
                <div className="text-xs font-medium text-[#64707d] truncate">{strength.name}</div>
                <div className="text-sm font-semibold text-[#1e1e1e]">{strength.score}%</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
