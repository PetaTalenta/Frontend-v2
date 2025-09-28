import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AssessmentResult } from '../../../types/assessment-results';
import ResultsPageClient from '../../../components/results/ResultsPageClient';

// Server-side data fetching
async function getAssessmentResult(id: string): Promise<AssessmentResult | null> {
  try {
    // Use the same API endpoint but from server-side
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.futureguide.id';
    // Updated to new Archive API endpoint per docs
    const response = await fetch(`${baseUrl}/api/archive/results/${id}`, {
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control for better performance
      next: { 
        revalidate: 3600, // Revalidate every hour
        tags: [`assessment-result-${id}`]
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch assessment result: ${response.status}`);
    }

    const json = await response.json();
    const result = json?.success ? json.data : null;
    return result;
  } catch (error) {
    console.error('Error fetching assessment result:', error);
    return null;
  }
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const result = await getAssessmentResult(params.id);

  if (!result) {
    return {
      title: 'Hasil Assessment Tidak Ditemukan - FutureGuide',
      description: 'Hasil assessment yang Anda cari tidak ditemukan.',
    };
  }

  const archetype = result.persona_profile?.archetype || 'Assessment';
  const title = `Hasil ${archetype} - FutureGuide Assessment`;
  const description = `Lihat hasil assessment kepribadian dan bakat untuk profil ${archetype}. Analisis RIASEC, Big Five, dan VIA Character Strengths.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'id_ID',
      images: [
        {
          url: '/og-assessment-result.jpg', // You can generate dynamic OG images later
          width: 1200,
          height: 630,
          alt: `Hasil Assessment ${archetype}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `/results/${params.id}`,
    },
  };
}

// Main page component
export default async function ResultsPage({ params }: { params: { id: string } }) {
  const result = await getAssessmentResult(params.id);

  if (!result) {
    notFound();
  }

  // Pass the pre-fetched data to the client component
  return <ResultsPageClient initialResult={result} resultId={params.id} />;
}

// Generate static params for popular results (optional)
export async function generateStaticParams() {
  // You can implement this to pre-generate popular assessment results
  // For now, we'll use dynamic rendering for all results
  return [];
}

// Configure page as dynamic with ISR
export const revalidate = 3600; // Revalidate every hour
export const dynamic = 'force-dynamic'; // Force dynamic rendering for personalized content
