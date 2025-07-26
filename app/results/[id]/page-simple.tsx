'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getAssessmentResult } from '../../../services/assessment-api';
import { AssessmentResult } from '../../../types/assessment-results';

export default function SimpleResultsPage() {
  const params = useParams();
  const router = useRouter();
  const resultId = params.id as string;
  
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('SimpleResultsPage: Loading result for ID:', resultId);
    
    const loadResult = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const assessmentResult = await getAssessmentResult(resultId);
        console.log('SimpleResultsPage: Result loaded:', assessmentResult);
        
        setResult(assessmentResult);
      } catch (err) {
        console.error('SimpleResultsPage: Error loading result:', err);
        setError(err instanceof Error ? err.message : 'Failed to load assessment result');
      } finally {
        setLoading(false);
      }
    };

    if (resultId) {
      loadResult();
    }
  }, [resultId]);

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f3f4f6', 
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Loading Assessment Results...
          </h1>
          <p style={{ color: '#6b7280' }}>
            Please wait while we load your assessment results.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f3f4f6', 
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#dc2626' }}>
            Error Loading Results
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button 
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
            <button 
              onClick={() => router.push('/dashboard')}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        backgroundColor: '#f3f4f6', 
        padding: '24px',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ 
          maxWidth: '800px', 
          margin: '0 auto',
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '32px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
            Assessment Result Not Found
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '24px' }}>
            The assessment result with ID "{resultId}" could not be found.
          </p>
          <button 
            onClick={() => router.push('/dashboard')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f3f4f6', 
      padding: '24px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '32px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</div>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
            Assessment Results
          </h1>
          <p style={{ color: '#6b7280' }}>
            Your personality assessment has been completed successfully!
          </p>
        </div>

        <div style={{ 
          backgroundColor: '#dbeafe', 
          borderRadius: '8px', 
          padding: '24px',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px' }}>
            {result.persona_profile?.title || 'Your Personality Profile'}
          </h2>
          <p style={{ color: '#4b5563', marginBottom: '16px' }}>
            {result.persona_profile?.description || 'Assessment completed successfully.'}
          </p>
          <div style={{ fontSize: '14px', color: '#6b7280' }}>
            <p><strong>Result ID:</strong> {result.id}</p>
            <p><strong>Created:</strong> {new Date(result.createdAt).toLocaleString()}</p>
            <p><strong>Status:</strong> {result.status}</p>
          </div>
        </div>

        {result.persona_profile?.strengths && (
          <div style={{ 
            backgroundColor: '#d1fae5', 
            borderRadius: '8px', 
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
              Your Strengths
            </h3>
            <ul style={{ listStyle: 'disc', paddingLeft: '20px' }}>
              {result.persona_profile.strengths.map((strength, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>{strength}</li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center',
          marginTop: '32px'
        }}>
          <button 
            onClick={() => router.push('/dashboard')}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Back to Dashboard
          </button>
          <button 
            onClick={() => router.push('/assessment')}
            style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Take Another Assessment
          </button>
        </div>
      </div>
    </div>
  );
}
