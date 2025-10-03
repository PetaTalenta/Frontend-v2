'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { assessmentTypes } from '../data/assessmentQuestions';
import {
  saveFlaggedQuestions,
  loadFlaggedQuestions,
  migrateFlaggedQuestionsToEncrypted
} from '../utils/flagged-questions-storage';
import { getOrderedCategories } from '../utils/assessment-calculations';

interface AssessmentContextType {
  currentAssessmentIndex: number;
  currentSectionIndex: number;
  answers: Record<number, number | null>;
  flaggedQuestions: Record<number, boolean>;
  setCurrentAssessmentIndex: (index: number) => void;
  setCurrentSectionIndex: (index: number) => void;
  setAnswer: (questionId: number, value: number) => void;
  resetAnswers: () => void;
  clearAssessmentData: () => void;
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
  const [currentSectionIndex, setCurrentSectionIndex] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('assessment-current-section-index');
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed)) return parsed;
      }
    }
    return 0;
  });
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});


  // Load flagged questions and answers from storage on mount
  useEffect(() => {
    const loadedFlags = loadFlaggedQuestions();
    setFlaggedQuestions(loadedFlags);

    // Migrate unencrypted data if needed
    migrateFlaggedQuestionsToEncrypted();

    if (typeof window !== 'undefined') {
      // Load answers from localStorage
      try {
        const savedAnswers = window.localStorage.getItem('assessment-answers');
        if (savedAnswers) {
          const parsed = JSON.parse(savedAnswers);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            setAnswers(parsed);
          }
        }
      } catch (e) {
        // ignore
      }

      // Validate and restore currentSectionIndex from localStorage
      try {
        const totalAssessments = assessmentTypes.length;
        let shouldResetSection = false;
        if (currentAssessmentIndex >= totalAssessments || currentAssessmentIndex < 0) {
          setCurrentAssessmentIndex(0);
          window.localStorage.removeItem('assessment-answers');
          shouldResetSection = true;
        } else {
          const assessment = assessmentTypes[currentAssessmentIndex];
          const categories = getOrderedCategories(assessment.id, assessment.questions);
          // Try to restore section index from localStorage
          const savedSection = window.localStorage.getItem('assessment-current-section-index');
          let sectionIdx = 0;
          if (savedSection !== null) {
            const parsedSection = parseInt(savedSection, 10);
            if (!isNaN(parsedSection) && parsedSection >= 0 && parsedSection < categories.length) {
              sectionIdx = parsedSection;
            }
          }
          if (sectionIdx >= categories.length || sectionIdx < 0) {
            setCurrentSectionIndex(0);
            window.localStorage.removeItem('assessment-answers');
          } else {
            setCurrentSectionIndex(sectionIdx);
          }
        }
        if (shouldResetSection) {
          setCurrentSectionIndex(0);
        }
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Save currentSectionIndex to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('assessment-current-section-index', String(currentSectionIndex));
      } catch (e) {
        // ignore
      }
    }
  }, [currentSectionIndex]);

  // Save answers to localStorage whenever answers change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('assessment-answers', JSON.stringify(answers));
      } catch (e) {
        // ignore
      }
    }
  }, [answers]);

  const setAnswer = (questionId: number, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Reset all answers
  const resetAnswers = () => setAnswers({});

  // Clear all assessment data (answers, flags, progress, localStorage)
  const clearAssessmentData = () => {
    console.log('🧹 Clearing all assessment data...');
    
    // Reset state
    setAnswers({});
    setFlaggedQuestions({});
    setCurrentAssessmentIndex(0);
    setCurrentSectionIndex(0);
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('assessment-answers');
        window.localStorage.removeItem('assessment-current-section-index');
        window.localStorage.removeItem('assessment-name');
        window.localStorage.removeItem('assessment-submission-time');
        window.localStorage.removeItem('flagged-questions-encrypted');
        window.localStorage.removeItem('flagged-questions'); // Legacy key
        console.log('✅ Assessment data cleared successfully');
      } catch (e) {
        console.error('Failed to clear localStorage:', e);
      }
    }
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
    // Use ordered categories instead of Object.keys to ensure consistency
    const categories = getOrderedCategories(assessment.id, assessment.questions);
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

    // Use ordered categories instead of Object.keys to ensure consistency
    const categories = getOrderedCategories(assessment.id, assessment.questions);
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
      resetAnswers,
      clearAssessmentData,
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
