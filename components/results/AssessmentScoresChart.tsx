'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { 
  AssessmentScores, 
  getScoreInterpretation, 
  RIASEC_DESCRIPTIONS, 
  OCEAN_DESCRIPTIONS 
} from '../../types/assessment-results';
import { BarChart3, Brain, Palette, Users, Lightbulb } from 'lucide-react';

interface AssessmentScoresChartProps {
  scores: AssessmentScores;
}

export default function AssessmentScoresChart({ scores }: AssessmentScoresChartProps) {
  const ScoreBar = ({ 
    label, 
    score, 
    description 
  }: { 
    label: string; 
    score: number; 
    description?: string;
  }) => {
    const interpretation = getScoreInterpretation(score);
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <span className="font-medium text-[#1e1e1e]">{label}</span>
            {description && (
              <p className="text-xs text-[#64707d] mt-1">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="secondary" 
              style={{ backgroundColor: interpretation.color + '20', color: interpretation.color }}
              className="text-xs font-medium"
            >
              {score}
            </Badge>
            <span className="text-xs text-[#64707d]">{interpretation.label}</span>
          </div>
        </div>
        <Progress 
          value={score} 
          className="h-2"
          style={{
            '--progress-background': interpretation.color
          } as React.CSSProperties}
        />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* RIASEC Holland Codes */}
      <Card className="bg-white border-[#eaecf0]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#e7eaff] rounded-lg">
              <BarChart3 className="w-5 h-5 text-[#6475e9]" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1e1e1e]">
                RIASEC Holland Codes
              </CardTitle>
              <p className="text-xs text-[#64707d]">Tipe Kepribadian Karir</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScoreBar 
            label="Realistic (R)" 
            score={scores.riasec.realistic}
            description={RIASEC_DESCRIPTIONS.realistic}
          />
          <ScoreBar 
            label="Investigative (I)" 
            score={scores.riasec.investigative}
            description={RIASEC_DESCRIPTIONS.investigative}
          />
          <ScoreBar 
            label="Artistic (A)" 
            score={scores.riasec.artistic}
            description={RIASEC_DESCRIPTIONS.artistic}
          />
          <ScoreBar 
            label="Social (S)" 
            score={scores.riasec.social}
            description={RIASEC_DESCRIPTIONS.social}
          />
          <ScoreBar 
            label="Enterprising (E)" 
            score={scores.riasec.enterprising}
            description={RIASEC_DESCRIPTIONS.enterprising}
          />
          <ScoreBar 
            label="Conventional (C)" 
            score={scores.riasec.conventional}
            description={RIASEC_DESCRIPTIONS.conventional}
          />
        </CardContent>
      </Card>

      {/* Big Five OCEAN */}
      <Card className="bg-white border-[#eaecf0]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#e7eaff] rounded-lg">
              <Brain className="w-5 h-5 text-[#6475e9]" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1e1e1e]">
                Big Five (OCEAN)
              </CardTitle>
              <p className="text-xs text-[#64707d]">Trait Kepribadian</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <ScoreBar 
            label="Openness" 
            score={scores.ocean.openness}
            description={OCEAN_DESCRIPTIONS.openness}
          />
          <ScoreBar 
            label="Conscientiousness" 
            score={scores.ocean.conscientiousness}
            description={OCEAN_DESCRIPTIONS.conscientiousness}
          />
          <ScoreBar 
            label="Extraversion" 
            score={scores.ocean.extraversion}
            description={OCEAN_DESCRIPTIONS.extraversion}
          />
          <ScoreBar 
            label="Agreeableness" 
            score={scores.ocean.agreeableness}
            description={OCEAN_DESCRIPTIONS.agreeableness}
          />
          <ScoreBar 
            label="Neuroticism" 
            score={scores.ocean.neuroticism}
            description={OCEAN_DESCRIPTIONS.neuroticism}
          />
        </CardContent>
      </Card>

      {/* VIA Character Strengths - Top 10 */}
      <Card className="bg-white border-[#eaecf0]">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#e7eaff] rounded-lg">
              <Lightbulb className="w-5 h-5 text-[#6475e9]" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-[#1e1e1e]">
                VIA Character Strengths
              </CardTitle>
              <p className="text-xs text-[#64707d]">Top 10 Kekuatan Karakter</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Object.entries(scores.viaIs)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([key, score], index) => {
              // Convert camelCase to readable format
              const label = key.replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .replace(/Of/g, 'of');
              
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#6475e9] bg-[#e7eaff] px-2 py-1 rounded">
                      #{index + 1}
                    </span>
                    <span className="text-sm font-medium text-[#1e1e1e]">{label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-[#f3f4f6] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#6475e9] rounded-full transition-all duration-300"
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[#64707d] w-8 text-right">
                      {score}
                    </span>
                  </div>
                </div>
              );
            })}
        </CardContent>
      </Card>
    </div>
  );
}
