import { Metadata } from 'next';
import dynamicImport from 'next/dynamic';
import { LoadingSkeleton } from '../../components/shared';

// Dynamic import for AuthPage to improve bundle size with SSR enabled
const AuthPage = dynamicImport(() => import('../../components/auth/AuthPage'), {
  loading: () => <LoadingSkeleton />,
  ssr: true // Enable SSR for auth page to improve SEO and initial load
});

export const metadata: Metadata = {
  title: 'Masuk atau Daftar - FutureGuide',
  description: 'Masuk ke akun FutureGuide Anda atau daftar untuk memulai assessment kepribadian dan bakat berbasis AI.',
  robots: {
    index: true,
    follow: true,
  },
};

// Enable SSR for auth page to improve SEO and initial load
export const dynamic = 'force-dynamic';

export default function Page() {
  return <AuthPage />;
}
