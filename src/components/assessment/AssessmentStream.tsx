import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { LoadingSkeleton } from '../shared';

// Dynamic import for client-side only components
const AssessmentQuestionsListClient = dynamic(
  () => import('./AssessmentQuestionsList').then(mod => ({ default: mod.default })),
  {
    loading: () => <LoadingSkeleton />,
    ssr: false
  }
);

// Server Component - Assessment Stream Content
interface AssessmentStreamProps {
  assessmentId: string;
  assessmentType: string;
  initialSection?: number;
  initialPhase?: number;
}

function AssessmentStreamContent({
  assessmentId,
  assessmentType,
  initialSection = 0,
  initialPhase = 0
}: AssessmentStreamProps) {
  return (
    <div className="assessment-stream">
      {/* Stream current section with proper RSC */}
      <Suspense
        fallback={
          <div className="section-loading">
            <LoadingSkeleton />
            <p className="text-center text-gray-600 mt-4">
              Loading section {initialSection + 1}...
            </p>
          </div>
        }
      >
        <div key={`phase-${initialPhase}-section-${initialSection}`}>
          <AssessmentQuestionsListClient />
        </div>
      </Suspense>
    </div>
  );
}

// Main streaming component with error boundary
export default function AssessmentStream({
  assessmentId,
  assessmentType,
  initialSection,
  initialPhase
}: AssessmentStreamProps) {
  return (
    <div className="assessment-stream-container">
      <AssessmentStreamContent
        assessmentId={assessmentId}
        assessmentType={assessmentType}
        initialSection={initialSection}
        initialPhase={initialPhase}
      />
    </div>
  );
}

// Server Component - Progress Stream
interface AssessmentProgressStreamProps {
  currentSection?: number;
  currentPhase?: number;
  totalSections?: number;
}

export function AssessmentProgressStream({
  currentSection = 0,
  currentPhase = 0,
  totalSections = 10
}: AssessmentProgressStreamProps) {
  const progressPercentage = ((currentSection + 1) / totalSections) * 100;
  
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
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </Suspense>
    </div>
  );
}

// Client Component for interactive progress tracking
'use client';

import { useAssessmentProgress } from '../../hooks/useAssessment';

export function AssessmentProgressStreamClient() {
  const { progress, getProgress } = useAssessmentProgress();
  const { percentage } = getProgress();
  
  return (
    <div className="progress-stream">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-600">
          Phase {progress.currentPhase + 1}, Section {progress.currentSection + 1}
        </span>
        <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}