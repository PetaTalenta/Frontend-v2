'use client';

import { useState, useEffect, useCallback } from 'react';
import { AssessmentResult } from '../data/dummy-assessment-data';
import { useAssessmentResults } from '../lib/swrConfig';

// Interface untuk API response
interface ApiResponse {
  success: boolean;
  data: AssessmentResult;
  message?: string;
}

// Fallback to dummy data if API fails
import { getDummyAssessmentResult } from '../data/dummy-assessment-data';

// Enhanced custom hook untuk assessment data fetching with SWR
export const useAssessmentData = (id: string) => {
<<<<<<< HEAD
  const [data, setData] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let abortController: AbortController | null = null;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          throw new Error('Assessment ID is required');
        }

        // Create abort controller for cleanup
        abortController = new AbortController();

        // Try to fetch from API first
        let result: AssessmentResult | null = null;
        
        try {
          const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.futureguide.id';
          const response = await fetch(`${baseUrl}/api/archive/results/${id}`, {
            headers: {
              'Content-Type': 'application/json',
            },
            signal: abortController.signal,
            // Add cache control for better performance
            next: {
              revalidate: 3600, // Revalidate every hour
              tags: [`assessment-result-${id}`]
            }
          });

          if (response.ok && isMounted) {
            const json: ApiResponse = await response.json();
            if (json.success && json.data) {
              result = json.data;
            }
          }
        } catch (apiError: any) {
          if (apiError.name !== 'AbortError') {
            console.warn('API fetch failed, using dummy data:', apiError);
          }
        }

        // Fallback to dummy data if API fails
        if (!result && isMounted) {
          result = getDummyAssessmentResult();
          console.log('Using dummy assessment data for result ID:', id);
        }

        if (isMounted) {
          setData(result);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          console.error('Error fetching assessment data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load assessment result');
          
          // Still set dummy data as fallback
          const dummyResult = getDummyAssessmentResult();
          setData(dummyResult);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (id) {
      fetchData();
    }

    return () => {
      isMounted = false;
      if (abortController) {
        abortController.abort();
      }
    };
  }, [id]);

  const refetch = useCallback(async () => {
    if (!id) return;
    
    let isMounted = true;
    
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

      if (response.ok && isMounted) {
        const json: ApiResponse = await response.json();
        if (json.success && json.data) {
          setData(json.data);
        }
      } else {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
    } catch (err) {
      if (isMounted) {
        console.error('Error refetching assessment data:', err);
        setError(err instanceof Error ? err.message : 'Failed to refetch assessment result');
      }
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [id]);
=======
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.futureguide.id';
  const apiUrl = id ? `${baseUrl}/api/archive/results/${id}` : null;
  
  // Use SWR for data fetching
  const { data, error, isLoading, mutate } = useAssessmentResults(id, {
    // Custom error handling to fallback to dummy data
    onError: (err) => {
      console.warn('API fetch failed, using dummy data:', err);
    }
  });

  // Fallback to dummy data if SWR fails
  const [fallbackData, setFallbackData] = useState<AssessmentResult | null>(null);
  
  useEffect(() => {
    if (error && !fallbackData) {
      const dummyResult = getDummyAssessmentResult();
      setFallbackData(dummyResult);
      console.log('Using dummy assessment data for result ID:', id);
    }
  }, [error, fallbackData, id]);

  const finalData = data || fallbackData;
  const finalError = error && !fallbackData ? error : null;

  const refetch = useCallback(async () => {
    try {
      await mutate();
    } catch (err) {
      console.error('Error refetching assessment data:', err);
    }
  }, [mutate]);
>>>>>>> 539a6f6b0cea62264673a0c9c25a6deb8013257c

  return {
    data: finalData,
    loading: isLoading && !finalData,
    error: finalError,
    refetch
  };
};

// Custom hook untuk static data (auth, select-assessment, etc.)
export const useStaticData = <T>(fetcher: () => Promise<T>, dependencies: any[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
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
  }, [fetcher]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error };
};

export default useAssessmentData;