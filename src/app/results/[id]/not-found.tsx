'use client';

import { useRouter } from 'next/navigation';
import { Button } from '../../../components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Assessment Result Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The assessment result you&apos;re looking for could not be found. It may have been deleted or the link is incorrect.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => router.push('/dashboard')}
              className="bg-[#6475e9] text-white hover:bg-[#5a6bd8]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
