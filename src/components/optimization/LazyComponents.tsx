'use client';

import dynamic from 'next/dynamic';
import { ComponentType, Suspense } from 'react';
import { Card } from '../ui/card';

/**
 * DEPRECATED: Higher-order component for lazy loading - use static imports instead
 * This function is deprecated to prevent webpack dynamic import issues
 */
export function withLazyLoading<T extends object>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  loadingComponent?: ComponentType,
  options: {
    ssr?: boolean;
    suspense?: boolean;
  } = {}
) {
  console.warn('withLazyLoading is deprecated. Use static imports with SafeChartWrapper instead.');

  // Return a placeholder component instead of dynamic import
  return () => (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <div className="p-6">
        <div className="text-center text-yellow-600">
          <p>⚠️ This component uses deprecated dynamic imports.</p>
          <p>Please update to use static imports with SafeChartWrapper.</p>
        </div>
      </div>
    </Card>
  );
}

/**
 * Default loading component
 */
function DefaultLoadingComponent() {
  return (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Loading component untuk chart
 */
function ChartLoadingComponent() {
  return (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    </Card>
  );
}

/**
 * Loading component untuk form
 */
function FormLoadingComponent() {
  return (
    <Card className="bg-white border-gray-200/60 shadow-sm">
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    </Card>
  );
}

// ===== LAZY LOADED COMPONENTS =====

/**
 * Chart components - using static imports to avoid webpack issues
 * Note: These are now deprecated in favor of static imports with safe wrappers
 */

// Deprecated: Use static imports with SafeAssessmentRadarChart wrapper instead
export const LazyAssessmentRadarChart = () => (
  <Card className="bg-white border-gray-200/60 shadow-sm">
    <div className="p-6">
      <div className="text-center text-gray-500">
        <p>Please use static import with SafeAssessmentRadarChart wrapper instead.</p>
      </div>
    </div>
  </Card>
);

// Deprecated: Use static imports with SafeCareerStatsCard wrapper instead
export const LazyCareerStatsCard = () => (
  <Card className="bg-white border-gray-200/60 shadow-sm">
    <div className="p-6">
      <div className="text-center text-gray-500">
        <p>Please use static import with SafeCareerStatsCard wrapper instead.</p>
      </div>
    </div>
  </Card>
);

/**
 * Modal components - dimuat saat modal dibuka
 */
export const LazyProfileModal = withLazyLoading(
  () => import('../profile/ProfileModal'),
  DefaultLoadingComponent,
  { ssr: false }
);

export const LazySettingsModal = withLazyLoading(
  () => import('../settings/SettingsModal'),
  FormLoadingComponent,
  { ssr: false }
);

/**
 * Assessment components - dimuat saat assessment dimulai
 */
export const LazyAssessmentForm = withLazyLoading(
  () => import('../assessment/AssessmentForm'),
  FormLoadingComponent,
  { ssr: false }
);

export const LazyQuestionCard = withLazyLoading(
  () => import('../assessment/QuestionCard'),
  DefaultLoadingComponent,
  { ssr: false }
);

/**
 * Dashboard components - dimuat setelah login
 */
export const LazyDashboardStats = withLazyLoading(
  () => import('../dashboard/DashboardStats'),
  ChartLoadingComponent,
  { ssr: false }
);

export const LazyRecentActivity = withLazyLoading(
  () => import('../dashboard/RecentActivity'),
  DefaultLoadingComponent,
  { ssr: false }
);

/**
 * PDF Export - dimuat hanya saat export
 */
export const LazyPDFExporter = withLazyLoading(
  () => import('../results/PDFExporter'),
  () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2">Preparing PDF export...</span>
    </div>
  ),
  { ssr: false }
);

/**
 * Chat components - dimuat saat chat dibuka
 */
export const LazyChatInterface = withLazyLoading(
  () => import('../chat/ChatInterface'),
  () => (
    <div className="flex items-center justify-center p-4">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  ),
  { ssr: false }
);

/**
 * Utility function untuk lazy loading dengan intersection observer
 */
export function LazyOnVisible({ 
  children, 
  fallback = <DefaultLoadingComponent />,
  rootMargin = '50px'
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
}) {
  return (
    <Suspense fallback={fallback}>
      <div 
        style={{ 
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {children}
      </div>
    </Suspense>
  );
}

/**
 * DEPRECATED: Hook for conditional lazy loading - use static imports instead
 */
export function useLazyComponent<T>(
  condition: boolean,
  importFn: () => Promise<{ default: ComponentType<T> }>
) {
  console.warn('useLazyComponent is deprecated. Use static imports with conditional rendering instead.');

  // Return a placeholder component instead of dynamic import
  const PlaceholderComponent = condition
    ? () => (
        <Card className="bg-white border-gray-200/60 shadow-sm">
          <div className="p-6">
            <div className="text-center text-yellow-600">
              <p>⚠️ This component uses deprecated dynamic imports.</p>
              <p>Please update to use static imports with conditional rendering.</p>
            </div>
          </div>
        </Card>
      )
    : null;

  return PlaceholderComponent;
}

// ===== USAGE EXAMPLES =====

/*
// CONTOH PENGGUNAAN:

// 1. Untuk chart yang tidak terlihat di viewport awal:
<LazyOnVisible>
  <LazyAssessmentRadarChart data={chartData} />
</LazyOnVisible>

// 2. Untuk modal yang dibuka berdasarkan state:
{showProfileModal && (
  <LazyProfileModal 
    isOpen={showProfileModal}
    onClose={() => setShowProfileModal(false)}
  />
)}

// 3. Untuk komponen yang dimuat berdasarkan kondisi:
const LazyAdminPanel = useLazyComponent(
  isAdmin,
  () => import('../admin/AdminPanel')
);

{LazyAdminPanel && <LazyAdminPanel />}

// 4. Untuk komponen besar yang tidak diperlukan di awal:
<Suspense fallback={<ChartLoadingComponent />}>
  <LazyDashboardStats userId={user.id} />
</Suspense>
*/
