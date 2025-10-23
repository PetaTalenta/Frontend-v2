'use client';

import React, { Suspense } from 'react';
import { useAssessmentProgress } from '../../stores/useAssessmentStore';
import AssessmentQuestionsList from './AssessmentQuestionsList';
import { LoadingSkeleton } from '../shared';

// Streaming component untuk assessment sections
interface AssessmentStreamProps {
  assessmentId: string;
  assessmentType: string;
}

function AssessmentStreamContent({ assessmentId, assessmentType }: AssessmentStreamProps) {
  const { currentSection, currentPhase } = useAssessmentProgress();
  
  return (
    <div className="assessment-stream">
      {/* Stream current section */}
      <Suspense 
        fallback={
          <div className="section-loading">
            <LoadingSkeleton />
            <p className="text-center text-gray-600 mt-4">
              Loading section {currentSection + 1}...
            </p>
          </div>
        }
      >
        <div key={`phase-${currentPhase}-section-${currentSection}`}>
          <AssessmentQuestionsList />
        </div>
      </Suspense>
    </div>
  );
}

// Main streaming component dengan error boundary
export default function AssessmentStream({ assessmentId, assessmentType }: AssessmentStreamProps) {
  return (
    <div className="assessment-stream-container">
      <AssessmentStreamContent 
        assessmentId={assessmentId} 
        assessmentType={assessmentType} 
      />
    </div>
  );
}

// Streaming untuk assessment progress
export function AssessmentProgressStream() {
  const { currentSection, currentPhase } = useAssessmentProgress();
  
  return (
    <div className="progress-stream">
      <Suspense fallback={<div className="h-2 bg-gray-200 rounded animate-pulse" />}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-600">
            Phase {currentPhase + 1}, Section {currentSection + 1}
          </span>
          <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${((currentSection + 1) / 10) * 100}%` }}
            />
          </div>
        </div>
      </Suspense>
    </div>
  );
}