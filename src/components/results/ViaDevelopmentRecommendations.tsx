'use client';

import React from 'react';
import { Card, CardContent } from './ui-card';
import { Badge } from './ui-badge';
import { Button } from './ui-button';
import { BookOpen, Target, Users, Briefcase, Lightbulb, ArrowRight } from 'lucide-react';
import { ViaScores, VIA_CATEGORIES } from '../../data/dummy-assessment-data';

interface ViaDevelopmentRecommendationsProps {
  viaScores: ViaScores;
  topStrengths: Array<{ strength: keyof ViaScores; score: number; category: string }>;
}

export default function ViaDevelopmentRecommendations({ viaScores, topStrengths }: ViaDevelopmentRecommendationsProps) {
  // Get top 3 strengths and bottom 3 strengths
  const top3Strengths = topStrengths.slice(0, 3);
  const bottom3Strengths = topStrengths.slice(-3).reverse();

  // Development recommendations based on VIA strengths
  const developmentRecommendations = {
    creativity: {
      activities: [
        'Ambil kelas seni atau desain kreatif',
        'Mulai journaling ide-ide kreatif',
        'Ikuti workshop brainstorming dan ide generation',
        'Coba teknik problem-solving yang berbeda'
      ],
      careers: ['Desainer Grafis', 'Content Creator', 'UX Designer', 'Art Director'],
      resources: [
        { title: 'Creative Confidence', author: 'Tom & David Kelley' },
        { title: 'The War of Art', author: 'Steven Pressfield' },
        { title: 'Big Magic', author: 'Elizabeth Gilbert' }
      ]
    },
    curiosity: {
      activities: [
        'Ambil kursus online di bidang baru',
        'Baca buku dari berbagai genre',
        'Hadiri seminar atau webinar',
        'Tanya "mengapa" lebih sering dalam diskusi'
      ],
      careers: ['Researcher', 'Journalist', 'Data Analyst', 'Consultant'],
      resources: [
        { title: 'A Curious Mind', author: 'Brian Grazer' },
        { title: 'The Power of Why', author: 'Amanda Lang' },
        { title: 'Curious', author: 'Ian Leslie' }
      ]
    },
    judgment: {
      activities: [
        'Praktikkan decision-making framework',
        'Ikuti debate club atau diskusi terstruktur',
        'Analisis case studies bisnis',
        'Minta feedback pada keputusan yang dibuat'
      ],
      careers: ['Judge', 'Management Consultant', 'Policy Advisor', 'Investment Analyst'],
      resources: [
        { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman' },
        { title: 'Decisive', author: 'Chip & Dan Heath' },
        { title: 'The Art of Thinking Clearly', author: 'Rolf Dobelli' }
      ]
    },
    loveOfLearning: {
      activities: [
        'Buat rencana pembelajaran pribadi',
        'Ikuti program sertifikasi',
        'Join learning communities',
        'Teach others what you learn'
      ],
      careers: ['Teacher', 'Professor', 'Training Manager', 'Learning & Development Specialist'],
      resources: [
        { title: 'Make It Stick', author: 'Peter Brown' },
        { title: 'Ultralearning', author: 'Scott Young' },
        { title: 'The Learning Mindset', author: 'Dr. Shirley Leung' }
      ]
    },
    perspective: {
      activities: [
        'Cari mentor yang lebih berpengalaman',
        'Praktikkan active listening',
        'Tulis refleksi harian tentang pengalaman',
        'Volunteer untuk peran mentoring'
      ],
      careers: ['Executive Coach', 'Counselor', 'Spiritual Director', 'Life Coach'],
      resources: [
        { title: 'Man\'s Search for Meaning', author: 'Viktor Frankl' },
        { title: 'The Road to Character', author: 'David Brooks' },
        { title: 'Wisdom from a Monk', author: 'Jay Shetty' }
      ]
    },
    bravery: {
      activities: [
        'Ambil proyek di luar comfort zone',
        'Praktikkan public speaking',
        'Tegas dalam menyampaikan pendapat',
        'Hadapi ketakutan secara bertahap'
      ],
      careers: ['Entrepreneur', 'Firefighter', 'Military Officer', 'Emergency Responder'],
      resources: [
        { title: 'Daring Greatly', author: 'Brené Brown' },
        { title: 'Fearless', author: 'Max Lucado' },
        { title: 'The Courage to Be Disliked', author: 'Ichiro Kishimi' }
      ]
    },
    perseverance: {
      activities: [
        'Set goal jangka panjang dan milestone',
        'Praktikkan consistency habits',
        'Bangun support system',
        'Celebrate small wins'
      ],
      careers: ['Athlete', 'Research Scientist', 'Startup Founder', 'Mountain Climber'],
      resources: [
        { title: 'Grit', author: 'Angela Duckworth' },
        { title: 'The Obstacle is the Way', author: 'Ryan Holiday' },
        { title: 'Can\'t Hurt Me', author: 'David Goggins' }
      ]
    },
    honesty: {
      activities: [
        'Praktikkan transparency dalam komunikasi',
        'Review personal values regularly',
        'Seek feedback tentang integritas',
        'Build trust through consistent actions'
      ],
      careers: ['Auditor', 'Compliance Officer', 'Ethics Officer', 'Judge'],
      resources: [
        { title: 'The Integrity Advantage', author: 'Adrian Gostick' },
        { title: 'Radical Candor', author: 'Kim Scott' },
        { title: 'The Speed of Trust', author: 'Stephen Covey' }
      ]
    },
    zest: {
      activities: [
        'Start hari dengan exercise',
        'Fokus pada positive experiences',
        'Surround yourself dengan energetic people',
        'Set exciting goals'
      ],
      careers: ['Motivational Speaker', 'Event Planner', 'Fitness Instructor', 'Sales Manager'],
      resources: [
        { title: 'The Energy Bus', author: 'Jon Gordon' },
        { title: 'Positive Intelligence', author: 'Shirzad Chamine' },
        { title: 'The Happiness Advantage', author: 'Shawn Achor' }
      ]
    },
    love: {
      activities: [
        'Build deeper relationships',
        'Praktikkan active listening',
        'Show appreciation regularly',
        'Invest time in loved ones'
      ],
      careers: ['Counselor', 'Social Worker', 'Therapist', 'HR Manager'],
      resources: [
        { title: 'The 5 Love Languages', author: 'Gary Chapman' },
        { title: 'Daring Greatly', author: 'Brené Brown' },
        { title: 'Attached', author: 'Amir Levine' }
      ]
    },
    kindness: {
      activities: [
        'Daily acts of kindness',
        'Volunteer regularly',
        'Practice empathy exercises',
        'Support colleagues actively'
      ],
      careers: ['Social Worker', 'Nurse', 'Teacher', 'Nonprofit Manager'],
      resources: [
        { title: 'Wonder', author: 'R.J. Palacio' },
        { title: 'The Power of Kindness', author: 'Pierro Ferrucci' },
        { title: 'Kindness is Contagious', author: 'David Hamilton' }
      ]
    },
    socialIntelligence: {
      activities: [
        'Observe social interactions',
        'Practice reading body language',
        'Join networking events',
        'Seek feedback on communication'
      ],
      careers: ['HR Manager', 'Sales Executive', 'Diplomat', 'Public Relations Specialist'],
      resources: [
        { title: 'How to Win Friends', author: 'Dale Carnegie' },
        { title: 'Emotional Intelligence', author: 'Daniel Goleman' },
        { title: 'The Charisma Myth', author: 'Olivia Fox Cabane' }
      ]
    },
    teamwork: {
      activities: [
        'Join team projects',
        'Practice collaboration skills',
        'Learn conflict resolution',
        'Support team members actively'
      ],
      careers: ['Project Manager', 'Team Lead', 'Sports Coach', 'Operations Manager'],
      resources: [
        { title: 'The Five Dysfunctions', author: 'Patrick Lencioni' },
        { title: 'Team of Teams', author: 'General Stanley McChrystal' },
        { title: 'The Culture Code', author: 'Daniel Coyle' }
      ]
    },
    fairness: {
      activities: [
        'Practice impartial decision-making',
        'Seek diverse perspectives',
        'Challenge own biases',
        'Advocate for equality'
      ],
      careers: ['Judge', 'Mediator', 'HR Director', 'Policy Maker'],
      resources: [
        { title: 'Just Mercy', author: 'Bryan Stevenson' },
        { title: 'The Moral Landscape', author: 'Sam Harris' },
        { title: 'Justice for All', author: 'Jim Wallis' }
      ]
    },
    leadership: {
      activities: [
        'Take leadership roles',
        'Mentor others',
        'Study great leaders',
        'Practice decision-making under pressure'
      ],
      careers: ['CEO', 'Politician', 'Military Officer', 'Entrepreneur'],
      resources: [
        { title: 'Good to Great', author: 'Jim Collins' },
        { title: 'The 7 Habits', author: 'Stephen Covey' },
        { title: 'Leaders Eat Last', author: 'Simon Sinek' }
      ]
    },
    forgiveness: {
      activities: [
        'Practice letting go',
        'Write forgiveness letters',
        'Practice empathy',
        'Focus on present moment'
      ],
      careers: ['Counselor', 'Mediator', 'Therapist', 'Spiritual Director'],
      resources: [
        { title: 'The Book of Forgiving', author: 'Desmond Tutu' },
        { title: 'Forgive for Good', author: 'Fred Luskin' },
        { title: 'The Art of Forgiving', author: 'Lewis Smedes' }
      ]
    },
    humility: {
      activities: [
        'Seek feedback regularly',
        'Acknowledge mistakes openly',
        'Learn from others',
        'Practice gratitude'
      ],
      careers: ['Teacher', 'Mentor', 'Researcher', 'Social Worker'],
      resources: [
        { title: 'Humility', author: 'C.S. Lewis' },
        { title: 'Ego is the Enemy', author: 'Ryan Holiday' },
        { title: 'The Humble Leader', author: 'Dan Rockwell' }
      ]
    },
    prudence: {
      activities: [
        'Think before acting',
        'Consider long-term consequences',
        'Seek advice before decisions',
        'Practice patience'
      ],
      careers: ['Financial Advisor', 'Risk Manager', 'Consultant', 'Judge'],
      resources: [
        { title: 'The Prudent Investor', author: 'Ben Graham' },
        { title: 'Thinking in Bets', author: 'Annie Duke' },
        { title: 'The Art of Thinking Clearly', author: 'Rolf Dobelli' }
      ]
    },
    selfRegulation: {
      activities: [
        'Practice mindfulness',
        'Set clear boundaries',
        'Develop routines',
        'Monitor emotional triggers'
      ],
      careers: ['Therapist', 'Executive Coach', 'Performance Coach', 'Meditation Teacher'],
      resources: [
        { title: 'Emotional Intelligence', author: 'Daniel Goleman' },
        { title: 'The Willpower Instinct', author: 'Kelly McGonigal' },
        { title: 'Atomic Habits', author: 'James Clear' }
      ]
    },
    appreciationOfBeauty: {
      activities: [
        'Visit art galleries',
        'Spend time in nature',
        'Practice photography',
        'Learn about different cultures'
      ],
      careers: ['Artist', 'Photographer', 'Interior Designer', 'Landscape Architect'],
      resources: [
        { title: 'Beauty', author: 'Roger Scruton' },
        { title: 'The Art of Seeing', author: 'Matisse' },
        { title: 'Ways of Seeing', author: 'John Berger' }
      ]
    },
    gratitude: {
      activities: [
        'Keep gratitude journal',
        'Express thanks regularly',
        'Practice mindfulness',
        'Count blessings daily'
      ],
      careers: ['Counselor', 'Life Coach', 'Spiritual Director', 'Writer'],
      resources: [
        { title: 'The Gratitude Diaries', author: 'Janice Kaplan' },
        { title: 'Thanks!', author: 'Robert Emmons' },
        { title: 'Gratitude Works', author: 'Robert Emmons' }
      ]
    },
    hope: {
      activities: [
        'Set meaningful goals',
        'Practice optimism',
        'Build support network',
        'Focus on possibilities'
      ],
      careers: ['Motivational Speaker', 'Life Coach', 'Counselor', 'Entrepreneur'],
      resources: [
        { title: 'The Power of Hope', author: 'Shane Lopez' },
        { title: 'Learned Optimism', author: 'Martin Seligman' },
        { title: 'Hope Rising', author: 'Casey Gwinn' }
      ]
    },
    humor: {
      activities: [
        'Practice storytelling',
        'Watch comedy shows',
        'Learn joke structures',
        'Practice timing and delivery'
      ],
      careers: ['Comedian', 'Entertainer', 'Marketing Manager', 'Public Speaker'],
      resources: [
        { title: 'Comedy Writing Secrets', author: 'Mel Helitzer' },
        { title: 'Born Standing Up', author: 'Steve Martin' },
        { title: 'The Comedy Bible', author: 'Judy Carter' }
      ]
    },
    spirituality: {
      activities: [
        'Practice meditation',
        'Join spiritual community',
        'Read sacred texts',
        'Practice mindfulness'
      ],
      careers: ['Spiritual Director', 'Chaplain', 'Meditation Teacher', 'Writer'],
      resources: [
        { title: 'The Power of Now', author: 'Eckhart Tolle' },
        { title: 'Siddhartha', author: 'Hermann Hesse' },
        { title: 'The Seven Spiritual Laws', author: 'Deepak Chopra' }
      ]
    }
  };

  const getRecommendations = (strength: keyof ViaScores) => {
    return developmentRecommendations[strength] || {
      activities: ['Continue developing this strength'],
      careers: ['Explore careers that use this strength'],
      resources: [{ title: 'Research this strength further', author: 'Various Authors' }]
    };
  };

  return (
    <div className="space-y-6">
      {/* Development Focus Areas */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fokus Pengembangan Anda</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Leverage Strengths */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" />
                Manfaatkan Kekuatan Utama
              </h4>
              <div className="space-y-3">
                {top3Strengths.map((strength, index) => {
                  const recommendations = getRecommendations(strength.strength);
                  return (
                    <div key={strength.strength} className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 capitalize">{strength.strength}</h5>
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Skor {strength.score}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <h6 className="text-xs font-medium text-gray-700 mb-1">Aktivitas Pengembangan:</h6>
                          <ul className="text-xs text-gray-600 space-y-0.5">
                            {recommendations.activities.slice(0, 2).map((activity, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-green-600 mt-0.5">•</span>
                                {activity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Develop Areas */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-orange-600" />
                Kembangkan Area Pertumbuhan
              </h4>
              <div className="space-y-3">
                {bottom3Strengths.map((strength, index) => {
                  const recommendations = getRecommendations(strength.strength);
                  return (
                    <div key={strength.strength} className="bg-orange-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900 capitalize">{strength.strength}</h5>
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          Skor {strength.score}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <h6 className="text-xs font-medium text-gray-700 mb-1">Aktivitas Pengembangan:</h6>
                          <ul className="text-xs text-gray-600 space-y-0.5">
                            {recommendations.activities.slice(0, 2).map((activity, idx) => (
                              <li key={idx} className="flex items-start gap-1">
                                <span className="text-orange-600 mt-0.5">•</span>
                                {activity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}