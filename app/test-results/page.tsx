'use client';

import React from 'react';

export default function TestResultsPage() {
  console.log('TestResultsPage: Component mounted');
  
  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Test Results Page</h1>
        <p>This is a simple test page to verify routing works.</p>
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h2 className="font-semibold">Debug Info:</h2>
          <p>Current URL: {typeof window !== 'undefined' ? window.location.href : 'SSR'}</p>
          <p>Timestamp: {new Date().toISOString()}</p>
        </div>
      </div>
    </div>
  );
}
