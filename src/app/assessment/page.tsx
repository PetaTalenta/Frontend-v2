'use client';

import dynamic from 'next/dynamic';
import { LoadingSkeleton } from '../../components/shared';

// Dynamic import for AssessmentLayout to improve bundle size
const AssessmentLayout = dynamic(() => import('../../components/assessment/AssessmentLayout'), {
  loading: () => <LoadingSkeleton />,
  ssr: false // Disable SSR for assessment to avoid hydration issues
});

// Client-Side Rendering Pattern for Dynamic Assessment Process
// Used for pages that require real-time user interaction and state management
export default function AssessmentPage() {
  return <AssessmentLayout />;
}
