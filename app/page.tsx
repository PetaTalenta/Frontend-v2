import { Metadata } from 'next';
import LandingPage from '../components/landing/LandingPage';
import AuthRedirect from '../components/landing/AuthRedirect';

export const metadata: Metadata = {
  title: 'PetaTalenta - AI-Driven Talent Mapping Assessment Platform',
  description: 'Temukan potensi terbaik Anda dengan platform assessment kepribadian dan bakat berbasis AI. Analisis RIASEC, Big Five, dan VIA Character Strengths untuk pengembangan karir optimal.',
  keywords: 'assessment kepribadian, tes bakat, RIASEC, Big Five, VIA Character Strengths, AI assessment, pengembangan karir',
  openGraph: {
    title: 'PetaTalenta - AI-Driven Talent Assessment',
    description: 'Platform assessment kepribadian dan bakat berbasis AI untuk menemukan potensi terbaik Anda',
    type: 'website',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PetaTalenta - AI-Driven Talent Assessment',
    description: 'Platform assessment kepribadian dan bakat berbasis AI untuk menemukan potensi terbaik Anda',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return (
    <>
      <LandingPage />
      <AuthRedirect />
    </>
  );
}