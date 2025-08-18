'use client';

import React, { useState } from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import FlaggedQuestionsPanel from './FlaggedQuestionsPanel';

export default function FlaggedQuestionsButton() {
  const { getFlaggedQuestions } = useAssessment();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  
  const flaggedCount = getFlaggedQuestions().length;

  const handleOpenPanel = () => {
    setIsPanelOpen(true);
  };

  const handleClosePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <>
      <button
        onClick={handleOpenPanel}
        className={`relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          flaggedCount > 0
            ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        title={`${flaggedCount} question${flaggedCount !== 1 ? 's' : ''} flagged for review`}
      >
        <span className="text-base">🏷️</span>
        <span className="hidden sm:inline">Flagged</span>
        
        {/* Badge for flagged count */}
        {flaggedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-amber-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            {flaggedCount > 99 ? '99+' : flaggedCount}
          </span>
        )}
      </button>

      <FlaggedQuestionsPanel 
        isOpen={isPanelOpen} 
        onClose={handleClosePanel} 
      />
    </>
  );
}
