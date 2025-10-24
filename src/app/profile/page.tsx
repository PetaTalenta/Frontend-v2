import { Metadata } from 'next';
import dynamicImport from 'next/dynamic';
import { LoadingSkeleton } from '../../components/shared';

// Dynamic import for ProfilePage to improve bundle size with ISR
const ProfilePageComponent = dynamicImport(() => import('../../components/profile/ProfilePage'), {
  loading: () => <LoadingSkeleton />,
  ssr: true // Enable SSR for profile page
});

export const metadata: Metadata = {
  title: 'Profil - FutureGuide',
  description: 'Kelola profil dan pengaturan akun FutureGuide Anda.',
  robots: {
    index: false, // Profile should not be indexed
    follow: false,
  },
};

// ISR for profile page - balance between freshness and performance
export const revalidate = 300; // 5 minutes
export const dynamic = 'auto'; // Let Next.js optimize automatically

export default function ProfilePageWrapper() {
  return <ProfilePageComponent />;
}
 