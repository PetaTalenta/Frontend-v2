import { useCallback, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { createSafeError } from '../utils/safe-error-handling';
import type { AssessmentResult, AssessmentScores } from '../types/assessment-results';

interface SimpleAssessmentOptions {
  onProgress?: (status: any) => void;
  onComplete?: (result: AssessmentResult) => void;
  onError?: (error: any) => void;
  onTokenBalanceUpdate?: () => Promise<void>;
}

export function useSimpleAssessment(options: SimpleAssessmentOptions = {}) {
  const { token } = useAuth();
  const [status, setStatus] = useState<'idle' | 'submitting' | 'queued' | 'processing' | 'completed' | 'failed'>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('Ready');
  const [error, setError] = useState<string | undefined>(undefined);
  const [result, setResult] = useState<AssessmentResult | undefined>(undefined);
  const [jobId, setJobId] = useState<string | undefined>(undefined);
  const [startTime, setStartTime] = useState<number | null>(null);

  const isActive = useMemo(() => status === 'submitting' || status === 'queued' || status === 'processing', [status]);
  const isIdle = status === 'idle';
  const canRetry = status === 'failed';

  const formattedElapsedTime = useMemo(() => {
    if (!startTime) return '';
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, [startTime]);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setMessage('Ready');
    setError(undefined);
    setResult(undefined);
    setJobId(undefined);
    setStartTime(null);
  }, []);

  const submitAssessment = useCallback(async (scores: AssessmentScores, assessmentName: string = 'AI-Driven Talent Mapping') => {
    if (!token) {
      const err = createSafeError('No authentication token found', 'AUTH_ERROR');
      setStatus('failed');
      setError(err.message);
      setMessage('Authentication required');
      options.onError?.(err);
      return null;
    }

    setStatus('submitting');
    setProgress(0);
    setMessage('Submitting assessment...');
    setError(undefined);
    setResult(undefined);
    setStartTime(Date.now());

    try {
      const { assessmentService } = await import('../services/assessment-service');
      const res = await assessmentService.submitAssessment(scores, assessmentName, {
        onProgress: (s) => {
          options.onProgress?.(s);
          // map to simple state
          setStatus('processing');
          setProgress(typeof s?.data?.progress === 'number' ? s.data.progress : progress);
          setMessage(s?.message || 'Processing...');
          setJobId(s?.data?.jobId || jobId);
        },
        onTokenBalanceUpdate: options.onTokenBalanceUpdate,
        preferWebSocket: true
      });

      setStatus('completed');
      setProgress(100);
      setMessage('Assessment completed successfully');
      setResult(res);
      options.onComplete?.(res);
      return res;
    } catch (e) {
      const safe = createSafeError(e, 'SUBMISSION_ERROR');
      setStatus('failed');
      setProgress(0);
      setMessage('Assessment failed');
      setError(safe.message);
      options.onError?.(safe);
      return null;
    }
  }, [token, options, progress, jobId]);

  const retry = useCallback((scores: AssessmentScores) => submitAssessment(scores), [submitAssessment]);

  return {
    status,
    progress,
    message,
    error,
    result,
    jobId,
    isActive,
    isIdle,
    canRetry,
    formattedElapsedTime,
    submitAssessment,
    retry,
    reset,
  };
}

export type { SimpleAssessmentOptions };
