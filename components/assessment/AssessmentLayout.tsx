'use client';

import { useEffect } from 'react';
import AssessmentSidebar from "./AssessmentSidebar";
import AssessmentHeader from "./AssessmentHeader";
import AssessmentProgressBar from "./AssessmentProgressBar";
import AssessmentQuestionsList from "./AssessmentQuestionsList";
import { AssessmentProvider, useAssessment } from '../../contexts/AssessmentContext';
import { TokenWarning } from '../ui/TokenBalance';

function AssessmentContent() {
  const { getCurrentAssessment, currentSectionIndex } = useAssessment();
  const currentAssessment = getCurrentAssessment();

  useEffect(() => {
    console.log('AssessmentContent: Component mounted');
    console.log('AssessmentContent: Current assessment:', currentAssessment?.name);
    console.log('AssessmentContent: Current section index:', currentSectionIndex);

    // Add error handler for unhandled errors
    const handleError = (event) => {
      console.error('AssessmentContent: Unhandled error:', event.error);
      console.error('AssessmentContent: Error stack:', event.error?.stack);
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, [currentAssessment, currentSectionIndex]);

  const getPhaseNumber = () => {
    switch (currentAssessment.id) {
      case 'big-five': return '1';
      case 'riasec': return '2';
      case 'via-character': return '3';
      default: return '1';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row-reverse min-h-screen bg-[#f5f7fb]">
      {/* Responsive Sidebar */}
      <div className="lg:fixed lg:right-0 lg:top-0 lg:h-screen lg:z-10 w-full lg:w-[280px]">
        <AssessmentSidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:mr-[280px]">
        <AssessmentHeader
          currentQuestion={currentSectionIndex + 1}
          totalQuestions={currentAssessment.totalQuestions}
          assessmentName={currentAssessment.name}
          phase={`Phase ${getPhaseNumber()}`}
        />
        <AssessmentProgressBar />
        <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto py-4 lg:py-8">
          {/* Token Warning */}
          <div className="w-full max-w-4xl px-4 lg:px-8 mb-4">
            <TokenWarning />
          </div>

          {/* Render all questions vertically */}
          <AssessmentQuestionsList />
        </div>
      </div>
    </div>
  );
}

export default function AssessmentLayout() {
  useEffect(() => {
    console.log('AssessmentLayout: Component mounted');

    // Check if we're in the right environment
    if (typeof window !== 'undefined') {
      console.log('AssessmentLayout: Running in browser');
      console.log('AssessmentLayout: Current URL:', window.location.href);
    } else {
      console.log('AssessmentLayout: Running in SSR');
    }
  }, []);

  return (
    <AssessmentProvider>
      <AssessmentContent />
    </AssessmentProvider>
  );
}
