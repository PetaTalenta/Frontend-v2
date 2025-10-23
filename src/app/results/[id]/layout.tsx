'use client';

import React from 'react';

export default function ResultsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  // Removed ResultsProvider and prefetch hooks
  return (
    <div>
      {children}
    </div>
  );
}

