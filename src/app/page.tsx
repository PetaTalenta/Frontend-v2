import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'FutureGuide - AI-Driven Talent Mapping Assessment Platform',
  description: 'Temukan potensi terbaik Anda dengan platform assessment kepribadian dan bakat berbasis AI. Analisis RIASEC, Big Five, dan VIA Character Strengths untuk pengembangan karir optimal.',
  keywords: 'assessment kepribadian, tes bakat, RIASEC, Big Five, VIA Character Strengths, AI assessment, pengembangan karir',
  openGraph: {
    title: 'FutureGuide - AI-Driven Talent Assessment',
    description: 'Platform assessment kepribadian dan bakat berbasis AI untuk menemukan potensi terbaik Anda',
    type: 'website',
    locale: 'id_ID',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FutureGuide - AI-Driven Talent Assessment',
    description: 'Platform assessment kepribadian dan bakat berbasis AI untuk menemukan potensi terbaik Anda',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Enable static generation for better performance
export const dynamic = 'force-static';

export default async function Page() {
  redirect('/auth');
}