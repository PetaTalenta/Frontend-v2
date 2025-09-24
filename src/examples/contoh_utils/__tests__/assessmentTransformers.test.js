/**
 * Tests for Assessment Transformation Utilities
 */

import { 
  transformViaScores, 
  transformRiasecScores, 
  transformOceanScores,
  transformAssessmentScores,
  validateAssessmentData 
} from '../assessmentTransformers';

describe('Assessment Transformers', () => {
  
  describe('transformViaScores', () => {
    it('should transform VIA category scores to 24 character strengths', () => {
      const viaScores = {
        wisdomAndKnowledge: 80,
        courage: 70,
        humanity: 85,
        justice: 75,
        temperance: 65,
        transcendence: 60
      };

      const result = transformViaScores(viaScores);

      // Check that all 24 character strengths are present
      const expectedStrengths = [
        'creativity', 'curiosity', 'judgment', 'loveOfLearning', 'perspective',
        'bravery', 'perseverance', 'honesty', 'zest',
        'love', 'kindness', 'socialIntelligence',
        'teamwork', 'fairness', 'leadership',
        'forgiveness', 'humility', 'prudence', 'selfRegulation',
        'appreciationOfBeauty', 'gratitude', 'hope', 'humor', 'spirituality'
      ];

      expectedStrengths.forEach(strength => {
        expect(result).toHaveProperty(strength);
        expect(typeof result[strength]).toBe('number');
        expect(result[strength]).toBeGreaterThanOrEqual(0);
        expect(result[strength]).toBeLessThanOrEqual(100);
      });

      expect(Object.keys(result)).toHaveLength(24);
    });

    it('should handle missing category scores with defaults', () => {
      const viaScores = {
        wisdomAndKnowledge: 80
        // Missing other categories
      };

      const result = transformViaScores(viaScores);
      
      // Should still have all 24 strengths
      expect(Object.keys(result)).toHaveLength(24);
      
      // All scores should be valid numbers
      Object.values(result).forEach(score => {
        expect(typeof score).toBe('number');
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('transformRiasecScores', () => {
    it('should transform RIASEC scores correctly', () => {
      const riasecScores = {
        realistic: 75.5,
        investigative: 80.2,
        artistic: 65.8,
        social: 70.1,
        enterprising: 85.9,
        conventional: 60.3
      };

      const result = transformRiasecScores(riasecScores);

      expect(result).toEqual({
        realistic: 76,
        investigative: 80,
        artistic: 66,
        social: 70,
        enterprising: 86,
        conventional: 60
      });
    });

    it('should handle missing scores with 0', () => {
      const riasecScores = {
        realistic: 75,
        investigative: 80
        // Missing other scores
      };

      const result = transformRiasecScores(riasecScores);

      expect(result).toEqual({
        realistic: 75,
        investigative: 80,
        artistic: 0,
        social: 0,
        enterprising: 0,
        conventional: 0
      });
    });
  });

  describe('transformOceanScores', () => {
    it('should transform Big Five scores to OCEAN format', () => {
      const bigFiveScores = {
        openness: 80.7,
        conscientiousness: 75.2,
        extraversion: 70.9,
        agreeableness: 85.1,
        neuroticism: 40.6
      };

      const result = transformOceanScores(bigFiveScores);

      expect(result).toEqual({
        openness: 81,
        conscientiousness: 75,
        extraversion: 71,
        agreeableness: 85,
        neuroticism: 41
      });
    });
  });

  describe('transformAssessmentScores', () => {
    it('should transform complete assessment scores to API format', () => {
      const assessmentScores = {
        via: {
          wisdomAndKnowledge: 80,
          courage: 70,
          humanity: 85,
          justice: 75,
          temperance: 65,
          transcendence: 60
        },
        riasec: {
          realistic: 75,
          investigative: 80,
          artistic: 65,
          social: 70,
          enterprising: 85,
          conventional: 60
        },
        bigFive: {
          openness: 80,
          conscientiousness: 75,
          extraversion: 70,
          agreeableness: 85,
          neuroticism: 40
        }
      };

      const result = transformAssessmentScores(assessmentScores);

      expect(result).toHaveProperty('assessmentName', 'AI-Driven Talent Mapping');
      expect(result).toHaveProperty('riasec');
      expect(result).toHaveProperty('ocean');
      expect(result).toHaveProperty('viaIs');

      // Check RIASEC structure
      expect(result.riasec).toHaveProperty('realistic', 75);
      expect(result.riasec).toHaveProperty('investigative', 80);

      // Check OCEAN structure
      expect(result.ocean).toHaveProperty('openness', 80);
      expect(result.ocean).toHaveProperty('conscientiousness', 75);

      // Check VIA-IS structure (should have 24 strengths)
      expect(Object.keys(result.viaIs)).toHaveLength(24);
    });

    it('should throw error if any assessment is missing', () => {
      const incompleteScores = {
        via: { wisdomAndKnowledge: 80 },
        riasec: { realistic: 75 }
        // Missing bigFive
      };

      expect(() => {
        transformAssessmentScores(incompleteScores);
      }).toThrow('All assessments must be completed');
    });
  });

  describe('validateAssessmentData', () => {
    it('should validate correct assessment data', () => {
      const validData = {
        assessmentName: "AI-Driven Talent Mapping",
        riasec: {
          realistic: 75,
          investigative: 80,
          artistic: 65,
          social: 70,
          enterprising: 85,
          conventional: 60
        },
        ocean: {
          openness: 80,
          conscientiousness: 75,
          extraversion: 70,
          agreeableness: 85,
          neuroticism: 40
        },
        viaIs: {
          creativity: 80, curiosity: 85, judgment: 75, loveOfLearning: 90, perspective: 70,
          bravery: 65, perseverance: 80, honesty: 85, zest: 75,
          love: 80, kindness: 85, socialIntelligence: 75,
          teamwork: 80, fairness: 85, leadership: 70,
          forgiveness: 75, humility: 80, prudence: 75, selfRegulation: 80,
          appreciationOfBeauty: 70, gratitude: 85, hope: 80, humor: 75, spirituality: 60
        }
      };

      const result = validateAssessmentData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid scores', () => {
      const invalidData = {
        assessmentName: "AI-Driven Talent Mapping",
        riasec: {
          realistic: 150, // Invalid: > 100
          investigative: -10, // Invalid: < 0
          artistic: 'invalid', // Invalid: not a number
          social: 70,
          enterprising: 85,
          conventional: 60
        },
        ocean: {
          openness: 80,
          conscientiousness: 75,
          extraversion: 70,
          agreeableness: 85,
          neuroticism: 40
        },
        viaIs: {
          creativity: 80, curiosity: 85, judgment: 75, loveOfLearning: 90, perspective: 70,
          bravery: 65, perseverance: 80, honesty: 85, zest: 75,
          love: 80, kindness: 85, socialIntelligence: 75,
          teamwork: 80, fairness: 85, leadership: 70,
          forgiveness: 75, humility: 80, prudence: 75, selfRegulation: 80,
          appreciationOfBeauty: 70, gratitude: 85, hope: 80, humor: 75, spirituality: 60
        }
      };

      const result = validateAssessmentData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('realistic'))).toBe(true);
      expect(result.errors.some(error => error.includes('investigative'))).toBe(true);
      expect(result.errors.some(error => error.includes('artistic'))).toBe(true);
    });
  });
});
