'use client';

import React from 'react';
import { useParams } from 'next/navigation';

export default function SimpleTestPage() {
  const params = useParams();
  const resultId = params.id as string;
  
  console.log('SimpleTestPage: Component mounted with resultId:', resultId);
  console.log('SimpleTestPage: Current URL:', typeof window !== 'undefined' ? window.location.href : 'SSR');
  
  // Monitor URL changes
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      console.log('SimpleTestPage: URL check after 1s:', window.location.href);
    }, 1000);
    setTimeout(() => {
      console.log('SimpleTestPage: URL check after 3s:', window.location.href);
    }, 3000);
    setTimeout(() => {
      console.log('SimpleTestPage: URL check after 5s:', window.location.href);
    }, 5000);
  }
  
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Simple Test Results Page</h1>
        <p>Result ID: {resultId}</p>
        <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Debug Info:</h2>
          <p>Timestamp: {new Date().toISOString()}</p>
          <p>Component rendered successfully!</p>
        </div>
      </div>
    </div>
  );
}
