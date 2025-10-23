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