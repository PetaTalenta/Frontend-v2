/**
 * Test untuk memverifikasi bahwa rawResponses dikirim ke backend
 */

import { convertScoresToApiData } from '../../src/types/assessment-results';

describe('Assessment Raw Responses', () => {
  describe('convertScoresToApiData', () => {
    const mockScores = {
      riasec: {
        realistic: 80,
        investigative: 85,
        artistic: 90,
        social: 70,
        enterprising: 75,
        conventional: 65
      },
      ocean: {
        openness: 88,
        conscientiousness: 82,
        extraversion: 75,
        agreeableness: 80,
        neuroticism: 45
      },
      viaIs: {
        creativity: 92,
        curiosity: 88,
        judgment: 85,
        loveOfLearning: 90,
        perspective: 82,
        bravery: 78,
        perseverance: 80,
        honesty: 85,
        zest: 75,
        love: 88,
        kindness: 90,
        socialIntelligence: 82,
        teamwork: 80,
        fairness: 85,
        leadership: 78,
        forgiveness: 75,
        humility: 70,
        prudence: 80,
        selfRegulation: 75,
        appreciationOfBeauty: 85,
        gratitude: 88,
        hope: 80,
        humor: 82,
        spirituality: 70
      }
    };

    const mockAnswers = {
      1: 4,
      2: 3,
      3: 5,
      4: 2,
      5: 4,
      // ... more answers
    };

    it('should include rawResponses when answers are provided', () => {
      const result = convertScoresToApiData(mockScores, 'AI-Driven Talent Mapping', mockAnswers);

      expect(result.rawResponses).toBeDefined();
      expect(result.rawSchemaVersion).toBe('v1');
    });

    it('should NOT include rawResponses when answers are not provided', () => {
      const result = convertScoresToApiData(mockScores, 'AI-Driven Talent Mapping');

      expect(result.rawResponses).toBeUndefined();
      expect(result.rawSchemaVersion).toBeUndefined();
    });

    it('should have correct structure for rawResponses', () => {
      const result = convertScoresToApiData(mockScores, 'AI-Driven Talent Mapping', mockAnswers);

      if (result.rawResponses) {
        expect(result.rawResponses.riasec).toBeDefined();
        expect(result.rawResponses.ocean).toBeDefined();
        expect(result.rawResponses.viaIs).toBeDefined();

        // Each should be an array
        expect(Array.isArray(result.rawResponses.riasec)).toBe(true);
        expect(Array.isArray(result.rawResponses.ocean)).toBe(true);
        expect(Array.isArray(result.rawResponses.viaIs)).toBe(true);

        // Each item should have questionId and value
        if (result.rawResponses.riasec.length > 0) {
          const item = result.rawResponses.riasec[0];
          expect(item).toHaveProperty('questionId');
          expect(item).toHaveProperty('value');
          expect(typeof item.questionId).toBe('string');
          expect(typeof item.value).toBe('number');
        }
      }
    });

    it('should format questionId correctly for RIASEC', () => {
      const result = convertScoresToApiData(mockScores, 'AI-Driven Talent Mapping', mockAnswers);

      if (result.rawResponses?.riasec.length > 0) {
        const item = result.rawResponses.riasec[0];
        // Format should be: Riasec-{Category}-{Index}
        expect(item.questionId).toMatch(/^Riasec-[A-Z]-\d{2}$/);
      }
    });

    it('should format questionId correctly for OCEAN', () => {
      const result = convertScoresToApiData(mockScores, 'AI-Driven Talent Mapping', mockAnswers);

      if (result.rawResponses?.ocean.length > 0) {
        const item = result.rawResponses.ocean[0];
        // Format should be: Ocean-{Category}-{Index}
        expect(item.questionId).toMatch(/^Ocean-[A-Z]-\d{2}$/);
      }
    });

    it('should format questionId correctly for VIA', () => {
      const result = convertScoresToApiData(mockScores, 'AI-Driven Talent Mapping', mockAnswers);

      if (result.rawResponses?.viaIs.length > 0) {
        const item = result.rawResponses.viaIs[0];
        // Format should be: VIA-{Subcategory}-{Index}
        expect(item.questionId).toMatch(/^VIA-[A-Za-z]+(-[A-Za-z]+)*-\d{2}$/);
      }
    });

    it('should include all provided answers in rawResponses', () => {
      const result = convertScoresToApiData(mockScores, 'AI-Driven Talent Mapping', mockAnswers);

      if (result.rawResponses) {
        const totalItems = 
          (result.rawResponses.riasec?.length || 0) +
          (result.rawResponses.ocean?.length || 0) +
          (result.rawResponses.viaIs?.length || 0);

        // Should have at least some items
        expect(totalItems).toBeGreaterThan(0);
      }
    });

    it('should filter out null/undefined answers', () => {
      const answersWithNulls = {
        1: 4,
        2: null,
        3: 5,
        4: undefined,
        5: 4,
      };

      const result = convertScoresToApiData(mockScores, 'AI-Driven Talent Mapping', answersWithNulls);

      if (result.rawResponses) {
        // Should only include non-null/undefined answers
        const allItems = [
          ...(result.rawResponses.riasec || []),
          ...(result.rawResponses.ocean || []),
          ...(result.rawResponses.viaIs || [])
        ];

        allItems.forEach(item => {
          expect(item.value).not.toBeNull();
          expect(item.value).not.toBeUndefined();
        });
      }
    });
  });
});

