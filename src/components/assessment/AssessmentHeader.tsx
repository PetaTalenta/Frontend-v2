'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';



interface AssessmentHeaderProps {
  currentQuestion?: number;
  totalQuestions?: number;
  assessmentName?: string;
  phase?: string;
}

export default function AssessmentHeader({
  currentQuestion = 1,
  totalQuestions = 44,
  assessmentName = "Big Five Personality",
  phase = "Phase 1"
}: AssessmentHeaderProps) {
  const router = useRouter();




  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };







  return (
    <div className="px-4 lg:px-8 py-3 lg:py-6 bg-transparent">
      {/* Mobile Layout */}
      <div className="sm:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#E5E7EB] bg-white text-[#64707D] text-sm font-medium shadow-sm hover:bg-[#f5f7fb] transition flex-shrink-0"
            type="button"
          >
            <Image src="/icons/CaretLeft.svg" alt="Back" width={16} height={16} className="w-4 h-4" />
          </button>
          <span className="font-semibold text-base">{phase}: {assessmentName}</span>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E7EB] bg-white text-[#64707D] text-[16px] font-medium shadow-sm hover:bg-[#f5f7fb] transition"
            type="button"
          >
            <Image src="/icons/CaretLeft.svg" alt="Back" width={16} height={16} className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </button>
          <span className="font-semibold text-lg">{phase}: {assessmentName}</span>
        </div>


      </div>
    </div>
  );
}
