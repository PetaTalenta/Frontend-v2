'use client';

import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface AlertSectionProps {
  error: string;
  success: string;
  partialUpdateWarning: string;
}

export default function AlertSection({ 
  error, 
  success, 
  partialUpdateWarning 
}: AlertSectionProps) {
  if (!error && !success && !partialUpdateWarning) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Error Alert */}
      {error && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="border border-green-200 bg-green-50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Partial Update Warning */}
      {partialUpdateWarning && (
        <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-orange-800">{partialUpdateWarning}</p>
          </div>
        </div>
      )}
    </div>
  );
}