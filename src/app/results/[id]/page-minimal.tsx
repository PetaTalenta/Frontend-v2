'use client';

import { useParams } from 'next/navigation';

export default function MinimalTestPage() {
  const params = useParams();
  const resultId = params.id as string;
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Minimal Test Results Page</h1>
      <p><strong>Result ID:</strong> {resultId}</p>
      <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
        <h2>Debug Info:</h2>
        <p>Component rendered successfully!</p>
        <p>Check console for client-side logs.</p>
      </div>
    </div>
  );
}
