'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { assessmentTypes } from '../data/assessmentQuestions';
import {
  saveFlaggedQuestions,
  loadFlaggedQuestions,
  migrateFlaggedQuestionsToEncrypted
} from '../utils/flagged-questions-storage';

interface AssessmentContextType {
  currentAssessmentIndex: number;
  currentSectionIndex: number;
  answers: Record<number, number | null>;
  flaggedQuestions: Record<number, boolean>;
  setCurrentAssessmentIndex: (index: number) => void;
  setCurrentSectionIndex: (index: number) => void;
  setAnswer: (questionId: number, value: number) => void;
  toggleFlag: (questionId: number) => void;
  getFlaggedQuestions: () => number[];
  isFlagged: (questionId: number) => boolean;
  getCurrentAssessment: () => any;
  getCurrentSection: () => string;
  debugFillAllAssessments: () => void;
  debugFillCurrentAssessment: () => void;
  getProgress: () => {
    currentAssessment: number;
    currentSection: number;
    totalAssessments: number;
    totalSections: number;
    answeredInSection: number;
    totalInSection: number;
    overallProgress: number;
  };
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});

  // Load flagged questions from storage on mount
  useEffect(() => {
    const loadedFlags = loadFlaggedQuestions();
    setFlaggedQuestions(loadedFlags);

    // Migrate unencrypted data if needed
    migrateFlaggedQuestionsToEncrypted();
  }, []);

  const setAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Toggle flag for a question
  const toggleFlag = (questionId: number) => {
    setFlaggedQuestions(prev => {
      const newFlags = { ...prev };
      newFlags[questionId] = !newFlags[questionId];

      // Auto-save to encrypted storage
      saveFlaggedQuestions(newFlags);

      console.log(`Question ${questionId} ${newFlags[questionId] ? 'flagged' : 'unflagged'}`);
      return newFlags;
    });
  };

  // Get list of flagged question IDs
  const getFlaggedQuestions = (): number[] => {
    return Object.entries(flaggedQuestions)
      .filter(([_, isFlagged]) => isFlagged)
      .map(([questionId, _]) => parseInt(questionId, 10));
  };

  // Check if a question is flagged
  const isFlagged = (questionId: number): boolean => {
    return !!flaggedQuestions[questionId];
  };

  const getCurrentAssessment = () => {
    return assessmentTypes[currentAssessmentIndex];
  };

  const getCurrentSection = () => {
    const assessment = getCurrentAssessment();
    const grouped = assessment.questions.reduce((acc: any, q: any) => {
      acc[q.category] = acc[q.category] || [];
      acc[q.category].push(q);
      return acc;
    }, {});
    const categories = Object.keys(grouped);
    return categories[currentSectionIndex];
  };

  const debugFillAllAssessments = () => {
    const newAnswers: Record<number, number> = {};

    assessmentTypes.forEach((assessment) => {
      assessment.questions.forEach((question) => {
        const maxValue = 5; // All assessments now use 5-point scale
        const randomValue = Math.floor(Math.random() * maxValue) + 1;
        newAnswers[question.id] = randomValue;
      });
    });

    setAnswers(newAnswers);
  };

  const debugFillCurrentAssessment = () => {
    const currentAssessment = getCurrentAssessment();
    const newAnswers = { ...answers };

    currentAssessment.questions.forEach((question: any) => {
      const maxValue = 5; // All assessments now use 5-point scale
      const randomValue = Math.floor(Math.random() * maxValue) + 1;
      newAnswers[question.id] = randomValue;
    });

    setAnswers(newAnswers);
  };

  const getProgress = () => {
    const assessment = getCurrentAssessment();
    const grouped = assessment.questions.reduce((acc: any, q: any) => {
      acc[q.category] = acc[q.category] || [];
      acc[q.category].push(q);
      return acc;
    }, {});

    const categories = Object.keys(grouped);
    const currentCategory = categories[currentSectionIndex];
    const questionsInSection = grouped[currentCategory] || [];
    const answeredInSection = questionsInSection.filter((q: any) => answers[q.id] != null).length;

    // Calculate overall progress
    const totalAnswered = Object.keys(answers).length;
    const totalQuestions = assessmentTypes.reduce((sum, assessment) => sum + assessment.totalQuestions, 0);
    const overallProgress = Math.round((totalAnswered / totalQuestions) * 100);

    return {
      currentAssessment: currentAssessmentIndex,
      currentSection: currentSectionIndex,
      totalAssessments: assessmentTypes.length,
      totalSections: categories.length,
      answeredInSection,
      totalInSection: questionsInSection.length,
      overallProgress
    };
  };

  return (
    <AssessmentContext.Provider value={{
      currentAssessmentIndex,
      currentSectionIndex,
      answers,
      flaggedQuestions,
      setCurrentAssessmentIndex,
      setCurrentSectionIndex,
      setAnswer,
      toggleFlag,
      getFlaggedQuestions,
      isFlagged,
      getCurrentAssessment,
      getCurrentSection,
      debugFillAllAssessments,
      debugFillCurrentAssessment,
      getProgress
    }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
}
