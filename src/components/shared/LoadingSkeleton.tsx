'use client';

import React from 'react';

export const LoadingSkeleton = () => (
  <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6475e9] mx-auto mb-4"></div>
      <p className="text-gray-600">Loading assessment results...</p>
    </div>
  </div>
);

export const PageLoadingSkeleton = ({ message = "Loading..." }: { message?: string }) => (
  <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6475e9] mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

export const CardLoadingSkeleton = () => (
  <div className="bg-white rounded-lg p-6 shadow-sm">
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  </div>
);

export default LoadingSkeleton;