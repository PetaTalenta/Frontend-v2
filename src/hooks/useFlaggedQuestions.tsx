import { useState, createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { setDebounced, getDebounced, removeDebounced } from '../utils/localStorageUtils';

interface FlaggedQuestionsContextType {
  flaggedQuestions: Set<number>;
  toggleFlag: (questionId: number) => void;
  isFlagged: (questionId: number) => boolean;
  getFlaggedQuestions: () => number[];
  clearAllFlags: () => void;
}

const FlaggedQuestionsContext = createContext<FlaggedQuestionsContextType | undefined>(undefined);

export function useFlaggedQuestions() {
  const context = useContext(FlaggedQuestionsContext);
  if (!context) {
    throw new Error('useFlaggedQuestions must be used within a FlaggedQuestionsProvider');
  }
  return context;
}

interface FlaggedQuestionsProviderProps {
  children: ReactNode;
}

export function FlaggedQuestionsProvider({ children }: FlaggedQuestionsProviderProps) {
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  // Load flagged questions from localStorage on mount
  useEffect(() => {
    try {
      const saved = getDebounced('flagged-questions');
      if (saved && Array.isArray(saved)) {
        setFlaggedQuestions(new Set(saved));
      }
    } catch (error) {
      console.error('Error loading flagged questions from localStorage:', error);
    }
  }, []);

  // Save flagged questions to localStorage whenever they change
  useEffect(() => {
    const flaggedArray = Array.from(flaggedQuestions);
    setDebounced('flagged-questions', flaggedArray);
  }, [flaggedQuestions]);

  const toggleFlag = useCallback((questionId: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  }, []);

  const isFlagged = useCallback((questionId: number) => {
    return flaggedQuestions.has(questionId);
  }, [flaggedQuestions]);

  const getFlaggedQuestions = useCallback(() => {
    return Array.from(flaggedQuestions);
  }, [flaggedQuestions]);

  const clearAllFlags = useCallback(() => {
    setFlaggedQuestions(new Set());
  }, []);

  const value = {
    flaggedQuestions,
    toggleFlag,
    isFlagged,
    getFlaggedQuestions,
    clearAllFlags
  };

  return (
    <FlaggedQuestionsContext.Provider value={value}>
      {children}
    </FlaggedQuestionsContext.Provider>
  );
}