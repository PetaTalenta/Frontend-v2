'use client';

import { AssessmentProvider } from '../../../contexts/AssessmentContext';
import AutoFillAssessment from '../../../components/debug/AutoFillAssessment';

export default function AutoFillPage() {
  return (
    <AssessmentProvider>
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <AutoFillAssessment />
        </div>
      </div>
    </AssessmentProvider>
  );
}
