/**
 * Global Loading Component
 * Shown while pages are loading in Next.js App Router
 */

import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg mb-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Loading...
        </h2>
        
        <p className="text-gray-600 text-sm">
          Please wait while we prepare your content
        </p>
        
        {/* Progress indicator */}
        <div className="mt-6 w-48 mx-auto">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
