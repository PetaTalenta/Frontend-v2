import { useState, createContext, useContext, ReactNode } from 'react';

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

  const toggleFlag = (questionId: number) => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const isFlagged = (questionId: number) => {
    return flaggedQuestions.has(questionId);
  };

  const getFlaggedQuestions = () => {
    return Array.from(flaggedQuestions);
  };

  const clearAllFlags = () => {
    setFlaggedQuestions(new Set());
  };

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