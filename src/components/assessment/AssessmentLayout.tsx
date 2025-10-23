'use client';

import React, { useEffect, useState } from 'react';
import AssessmentSidebar from "./AssessmentSidebar";
import AssessmentHeader from "./AssessmentHeader";
import AssessmentProgressBar from "./AssessmentProgressBar";
import AssessmentQuestionsList from "./AssessmentQuestionsList";
import { FlaggedQuestionsProvider } from "../../hooks/useFlaggedQuestions";

// Dummy data for assessment
const dummyAssessment = {
  id: 'big-five',
  name: 'Big Five Personality',
  totalQuestions: 44,
};

const dummyProgress = {
  overallProgress: 25,
};

function AssessmentContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  useEffect(() => {
    // Add error handler for unhandled errors
    const handleError = (event: ErrorEvent) => {
      console.error('AssessmentContent: Unhandled error:', event.error);
      console.error('AssessmentContent: Error stack:', event.error?.stack);
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  const getPhaseNumber = () => {
    switch (dummyAssessment.id) {
      case 'big-five': return '1';
      case 'riasec': return '2';
      case 'via-character': return '3';
      default: return '1';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row-reverse min-h-screen bg-[#f5f7fb]">
      {/* Mobile Toggle Button - Bottom Right */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 w-16 h-16 bg-white rounded-full shadow-lg border border-[#eaecf0] hover:bg-gray-50 transition-all duration-300 hover:scale-105 flex items-center justify-center"
        aria-label="Open assessment progress"
      >
        {/* Progress percentage text */}
        <span className="text-sm font-bold text-[#6475e9] z-10">
          {dummyProgress.overallProgress}%
        </span>

        {/* Progress indicator - circular ring */}
        <div className="absolute inset-0 rounded-full">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#eaecf0"
              strokeWidth="6"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#6475e9"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - dummyProgress.overallProgress / 100)}`}
              className="transition-all duration-500"
            />
          </svg>
        </div>
      </button>

      {/* Responsive Sidebar */}
      <div className="lg:fixed lg:right-0 lg:top-0 lg:h-screen lg:z-10 w-full lg:w-[300px]">
        <AssessmentSidebar
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:mr-[300px]">
        <AssessmentHeader
          currentQuestion={currentSectionIndex + 1}
          totalQuestions={dummyAssessment.totalQuestions}
          assessmentName={dummyAssessment.name}
          phase={`Phase ${getPhaseNumber()}`}
        />
        <AssessmentProgressBar />
        <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto py-4 lg:py-8">
          {/* Token Warning - Removed as it depends on TokenContext */}
          {/* <div className="w-full max-w-4xl px-4 lg:px-8 mb-4">
            <TokenWarning />
          </div> */}

          {/* Render all questions vertically */}
          <AssessmentQuestionsList />
        </div>
      </div>
    </div>
  );
}

function AssessmentLayoutComponent() {
  useEffect(() => {
    // Check if we're in the right environment
    if (typeof window !== 'undefined') {
      // Running in browser
    } else {
      // Running in SSR
    }
  }, []);

  return (
    <FlaggedQuestionsProvider>
      <AssessmentContent />
    </FlaggedQuestionsProvider>
  );
}

export default React.memo(AssessmentLayoutComponent)
