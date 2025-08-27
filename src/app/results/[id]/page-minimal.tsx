'use client';

import { useParams } from 'next/navigation';

export default function MinimalTestPage() {
  const params = useParams();
  const resultId = params.id as string;
  
  console.log('MinimalTestPage: Component rendered with resultId:', resultId);
  
  // Test client-side execution
  if (typeof window !== 'undefined') {
    console.log('MinimalTestPage: Running on client-side!');
    console.log('MinimalTestPage: Current URL:', window.location.href);
    
    // Set up interval logging
    setTimeout(() => {
      console.log('MinimalTestPage: 1 second timeout executed');
    }, 1000);
    
    setTimeout(() => {
      console.log('MinimalTestPage: 3 second timeout executed');
    }, 3000);
  } else {
    console.log('MinimalTestPage: Running on server-side');
  }
  
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
