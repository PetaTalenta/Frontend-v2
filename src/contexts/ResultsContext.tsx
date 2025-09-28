"use client";

import React, { createContext, useContext, useMemo } from "react";
import useSWR from "swr";
import apiService from "../services/apiService";
import type { AssessmentResult } from "../types/assessment-results";

interface ResultsContextValue {
  resultId: string;
  result: AssessmentResult | null;
  isLoading: boolean;
  error: any;
  refresh: () => Promise<AssessmentResult | null | undefined>;
}

const ResultsContext = createContext<ResultsContextValue | undefined>(undefined);

interface ResultsProviderProps {
  resultId: string;
  children: React.ReactNode;
}

export function ResultsProvider({ resultId, children }: ResultsProviderProps) {
  const swrKey = useMemo(() => (resultId ? ["assessment-result", resultId] as const : null), [resultId]);

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async ([, id]) => {
      const resp = await apiService.getResultById(id);
      if (resp?.success) return resp.data as AssessmentResult;
      // normalize 404 / not found
      return null;
    },
    {
      // lean defaults; global SWRConfig also applies
      revalidateOnFocus: false,
      keepPreviousData: true,
      dedupingInterval: 60_000,
    }
  );

  const value: ResultsContextValue = {
    resultId,
    result: (data as AssessmentResult | null) ?? null,
    isLoading: Boolean(isLoading) && !data,
    error,
    refresh: async () => (await mutate()) as any,
  };

  return <ResultsContext.Provider value={value}>{children}</ResultsContext.Provider>;
}

export function useResultContext() {
  const ctx = useContext(ResultsContext);
  if (!ctx) throw new Error("useResultContext must be used within ResultsProvider");
  return ctx;
}

