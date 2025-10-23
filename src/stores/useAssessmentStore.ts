import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AssessmentResult, AssessmentScores } from '../data/dummy-assessment-data';

// Types untuk assessment store
interface AssessmentState {
  // Current assessment session
  currentAssessment: {
    id: string | null;
    type: string | null;
    answers: Record<string, number>;
    currentSection: number;
    currentPhase: number;
    flaggedQuestions: string[];
    startTime: number | null;
    endTime: number | null;
  };
  
  // Assessment results
  results: Map<string, AssessmentResult>;
  scores: Map<string, AssessmentScores>;
  
  // Loading states
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  
  // Actions
  setCurrentAssessment: (id: string, type: string) => void;
  setAnswer: (questionId: string, value: number) => void;
  setCurrentSection: (section: number) => void;
  setCurrentPhase: (phase: number) => void;
  flagQuestion: (questionId: string) => void;
  unflagQuestion: (questionId: string) => void;
  startAssessment: () => void;
  endAssessment: () => void;
  setResult: (id: string, result: AssessmentResult) => void;
  setScores: (id: string, scores: AssessmentScores) => void;
  setLoading: (loading: boolean) => void;
  setSubmitting: (submitting: boolean) => void;
  setError: (error: string | null) => void;
  clearCurrentAssessment: () => void;
  reset: () => void;
}

// Assessment store dengan Zustand
export const useAssessmentStore = create<AssessmentState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentAssessment: {
        id: null,
        type: null,
        answers: {},
        currentSection: 0,
        currentPhase: 0,
        flaggedQuestions: [],
        startTime: null,
        endTime: null,
      },
      results: new Map(),
      scores: new Map(),
      isLoading: false,
      isSubmitting: false,
      error: null,

      // Actions
      setCurrentAssessment: (id, type) => set((state) => ({
        currentAssessment: {
          ...state.currentAssessment,
          id,
          type,
        },
      })),

      setAnswer: (questionId, value) => set((state) => ({
        currentAssessment: {
          ...state.currentAssessment,
          answers: {
            ...state.currentAssessment.answers,
            [questionId]: value,
          },
        },
      })),

      setCurrentSection: (section) => set((state) => ({
        currentAssessment: {
          ...state.currentAssessment,
          currentSection: section,
        },
      })),

      setCurrentPhase: (phase) => set((state) => ({
        currentAssessment: {
          ...state.currentAssessment,
          currentPhase: phase,
        },
      })),

      flagQuestion: (questionId) => set((state) => ({
        currentAssessment: {
          ...state.currentAssessment,
          flaggedQuestions: [...state.currentAssessment.flaggedQuestions, questionId],
        },
      })),

      unflagQuestion: (questionId) => set((state) => ({
        currentAssessment: {
          ...state.currentAssessment,
          flaggedQuestions: state.currentAssessment.flaggedQuestions.filter(
            (id) => id !== questionId
          ),
        },
      })),

      startAssessment: () => set((state) => ({
        currentAssessment: {
          ...state.currentAssessment,
          startTime: Date.now(),
          endTime: null,
        },
      })),

      endAssessment: () => set((state) => ({
        currentAssessment: {
          ...state.currentAssessment,
          endTime: Date.now(),
        },
      })),

      setResult: (id, result) => set((state) => {
        const newResults = new Map(state.results);
        newResults.set(id, result);
        return { results: newResults };
      }),

      setScores: (id, scores) => set((state) => {
        const newScores = new Map(state.scores);
        newScores.set(id, scores);
        return { scores: newScores };
      }),

      setLoading: (loading) => set({ isLoading: loading }),

      setSubmitting: (submitting) => set({ isSubmitting: submitting }),

      setError: (error) => set({ error }),

      clearCurrentAssessment: () => set({
        currentAssessment: {
          id: null,
          type: null,
          answers: {},
          currentSection: 0,
          currentPhase: 0,
          flaggedQuestions: [],
          startTime: null,
          endTime: null,
        },
      }),

      reset: () => set({
        currentAssessment: {
          id: null,
          type: null,
          answers: {},
          currentSection: 0,
          currentPhase: 0,
          flaggedQuestions: [],
          startTime: null,
          endTime: null,
        },
        results: new Map(),
        scores: new Map(),
        isLoading: false,
        isSubmitting: false,
        error: null,
      }),
    }),
    {
      name: 'assessment-storage',
      storage: createJSONStorage(() => {
        // Use localStorage in browser, fallback to sessionStorage in other environments
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      // Only persist essential data to reduce storage size
      partialize: (state) => ({
        currentAssessment: state.currentAssessment,
        results: Array.from(state.results.entries()),
        scores: Array.from(state.scores.entries()),
      }),
      // Custom storage adapter for Maps
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert arrays back to Maps
          state.results = new Map(state.results as any);
          state.scores = new Map(state.scores as any);
        }
      },
    }
  )
);

// Selectors for optimized re-renders
export const useCurrentAssessment = () => useAssessmentStore((state) => state.currentAssessment);
export const useAssessmentAnswers = () => useAssessmentStore((state) => state.currentAssessment.answers);
export const useAssessmentProgress = () => useAssessmentStore((state) => ({
  currentSection: state.currentAssessment.currentSection,
  currentPhase: state.currentAssessment.currentPhase,
}));
export const useAssessmentResults = (id: string) => useAssessmentStore((state) => state.results.get(id));
export const useAssessmentScores = (id: string) => useAssessmentStore((state) => state.scores.get(id));
export const useAssessmentLoading = () => useAssessmentStore((state) => ({
  isLoading: state.isLoading,
  isSubmitting: state.isSubmitting,
  error: state.error,
}));