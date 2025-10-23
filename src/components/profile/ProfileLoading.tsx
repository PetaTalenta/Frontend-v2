'use client';

import React from 'react';

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 sm:px-8 md:py-16 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading profile...</p>
      </div>
    </div>
  );
}