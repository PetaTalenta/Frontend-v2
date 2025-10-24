import { Metadata } from 'next';
import dynamicImport from 'next/dynamic';
import { LoadingSkeleton } from '../../components/shared';

// Dynamic import for DashboardClient to improve bundle size
const DashboardClient = dynamicImport(() => import('../../components/dashboard/DashboardClient'), {
  loading: () => <LoadingSkeleton />,
  ssr: true // Enable SSR for dashboard to improve initial load
});

// Static data that can be pre-generated
interface DashboardStaticData {
  defaultStats: {
    totalAssessments: number;
    completionRate: number;
    averageScore: number;
    lastUpdated: string;
  };
  systemInfo: {
    version: string;
    features: string[];
    announcements: string[];
  };
}

// Generate static data for dashboard
async function getDashboardStaticData(): Promise<DashboardStaticData> {
  // This would typically fetch from a CMS or static data source
  return {
    defaultStats: {
      totalAssessments: 0,
      completionRate: 0,
      averageScore: 0,
      lastUpdated: new Date().toISOString(),
    },
    systemInfo: {
      version: '2.0.0',
      features: [
        'AI-Powered Assessment',
        'Real-time Analytics',
        'Personalized Insights',
        'Export Capabilities'
      ],
      announcements: [
        'New assessment types available',
        'Improved AI analysis engine',
        'Enhanced reporting features'
      ]
    }
  };
}

export const metadata: Metadata = {
  title: 'Dashboard - FutureGuide',
  description: 'Dashboard utama untuk melihat progress assessment dan analisis kepribadian Anda.',
  robots: {
    index: false, // Dashboard should not be indexed
    follow: false,
  },
};

// Main dashboard page - optimized with ISR for better performance
export default async function DashboardPage() {
  const staticData = await getDashboardStaticData();

  return <DashboardClient staticData={staticData} />;
}

// ✅ OPTIMIZATION: Use ISR instead of force-dynamic for better performance
// Revalidate every 30 minutes to balance freshness and performance
export const revalidate = 1800; // 30 minutes
export const dynamic = 'auto'; // Let Next.js optimize automatically
