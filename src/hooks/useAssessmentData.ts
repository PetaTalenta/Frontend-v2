'use client';

import { useState, useEffect } from 'react';
import { AssessmentResult } from '../data/dummy-assessment-data';

// Interface untuk API response
interface ApiResponse {
  success: boolean;
  data: AssessmentResult;
  message?: string;
}

// Fallback to dummy data if API fails
import { getDummyAssessmentResult } from '../data/dummy-assessment-data';

// Custom hook untuk assessment data fetching
export const useAssessmentData = (id: string) => {
  const [data, setData] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          throw new Error('Assessment ID is required');
        }

        // Try to fetch from API first
        let result: AssessmentResult | null = null;
        
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.futureguide.id';
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

          if (response.ok) {
            const json: ApiResponse = await response.json();
            if (json.success && json.data) {
              result = json.data;
            }
          }
        } catch (apiError) {
          console.warn('API fetch failed, using dummy data:', apiError);
        }

        // Fallback to dummy data if API fails
        if (!result) {
          result = getDummyAssessmentResult();
          console.log('Using dummy assessment data for result ID:', id);
        }

        setData(result);
      } catch (err) {
        console.error('Error fetching assessment data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assessment result');
        
        // Still set dummy data as fallback
        const dummyResult = getDummyAssessmentResult();
        setData(dummyResult);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  const refetch = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.futureguide.id';
      const response = await fetch(`${baseUrl}/api/archive/results/${id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Bypass cache for refetch
      });

      if (response.ok) {
        const json: ApiResponse = await response.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } else {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
    } catch (err) {
      console.error('Error refetching assessment data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refetch assessment result');
    } finally {
      setLoading(false);
    }
  };

  return { 
    data, 
    loading, 
    error, 
    refetch 
  };
};

// Custom hook untuk static data (auth, select-assessment, etc.)
export const useStaticData = <T>(fetcher: () => Promise<T>, dependencies: any[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await fetcher();
        setData(result);
      } catch (err) {
        console.error('Error fetching static data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};

export default useAssessmentData;