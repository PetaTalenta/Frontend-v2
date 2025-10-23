/**
 * Not Found Page
 * Custom 404 page for Next.js App Router
 */

import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: '404 - Page Not Found | FutureGuide',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-6">
          <div className="mx-auto w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-12 h-12 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Page Not Found
          </h2>
          <p className="text-gray-600 mt-2">
            Sorry, we couldn&apos;t find the page you&apos;re looking for.
          </p>
        </div>
        
        <div className="px-6 pb-6 space-y-4">
          <div className="text-6xl font-bold text-blue-600 mb-4">
            404
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            The page you are looking for might have been removed, 
            had its name changed, or is temporarily unavailable.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link 
              href="/" 
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
            
            <Link 
              href="/dashboard" 
              className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
