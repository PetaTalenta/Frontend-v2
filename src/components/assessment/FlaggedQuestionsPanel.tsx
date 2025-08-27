'use client';

import React, { useState } from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import { assessmentTypes } from '../../data/assessmentQuestions';
import { getOrderedCategories } from '../../utils/assessment-calculations';

interface FlaggedQuestionsPanel {
  isOpen: boolean;
  onClose: () => void;
}

export default function FlaggedQuestionsPanel({ isOpen, onClose }: FlaggedQuestionsPanel) {
  const { 
    getFlaggedQuestions, 
    toggleFlag, 
    answers, 
    setCurrentAssessmentIndex, 
    setCurrentSectionIndex 
  } = useAssessment();
  
  const flaggedQuestionIds = getFlaggedQuestions();

  // Get question details for flagged questions
  const flaggedQuestionsDetails = flaggedQuestionIds.map(questionId => {
    // Find the question across all assessments
    for (let assessmentIndex = 0; assessmentIndex < assessmentTypes.length; assessmentIndex++) {
      const assessment = assessmentTypes[assessmentIndex];
      const question = assessment.questions.find(q => q.id === questionId);
      
      if (question) {
        // Find the section index for this question
        const grouped = assessment.questions.reduce((acc: any, q: any) => {
          acc[q.category] = acc[q.category] || [];
          acc[q.category].push(q);
          return acc;
        }, {});
        
        // Use ordered categories instead of Object.keys to ensure consistency
        const categories = getOrderedCategories(assessment.id, assessment.questions);
        const sectionIndex = categories.findIndex(category =>
          grouped[category].some((q: any) => q.id === questionId)
        );
        
        return {
          questionId,
          question,
          assessment,
          assessmentIndex,
          sectionIndex,
          isAnswered: answers[questionId] != null,
          answer: answers[questionId]
        };
      }
    }
    return null;
  }).filter(Boolean);

  const handleNavigateToQuestion = (assessmentIndex: number, sectionIndex: number) => {
    setCurrentAssessmentIndex(assessmentIndex);
    setCurrentSectionIndex(sectionIndex);
    onClose();
  };

  const handleUnflagQuestion = (questionId: number) => {
    toggleFlag(questionId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏷️</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Flagged Questions</h2>
              <p className="text-sm text-gray-600">
                {flaggedQuestionIds.length} question{flaggedQuestionIds.length !== 1 ? 's' : ''} flagged for review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {flaggedQuestionsDetails.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">🏷️</span>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Flagged Questions</h3>
              <p className="text-gray-600">
                You haven't flagged any questions for review yet. Click the flag button on any question to mark it for later review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {flaggedQuestionsDetails.map((item, index) => (
                <div
                  key={item!.questionId}
                  className="bg-amber-50 border border-amber-200 rounded-lg p-4 hover:bg-amber-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Assessment and Category Info */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-2 py-1 rounded-full bg-[#e7eaff] text-[#6475e9] text-xs font-semibold">
                          {item!.assessment.name}
                        </span>
                        <span className="inline-block px-2 py-1 rounded-full bg-amber-200 text-amber-800 text-xs font-medium">
                          {item!.question.subcategory}
                        </span>
                      </div>

                      {/* Question Text */}
                      <h4 className="font-semibold text-gray-900 mb-2 leading-tight">
                        {item!.question.text}
                      </h4>

                      {/* Answer Status */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className={`flex items-center gap-1 ${
                          item!.isAnswered ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          <span>{item!.isAnswered ? '✅' : '⏳'}</span>
                          {item!.isAnswered ? `Answered (${item!.answer})` : 'Not answered'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleNavigateToQuestion(item!.assessmentIndex, item!.sectionIndex)}
                        className="px-3 py-1 bg-[#6475e9] text-white text-sm font-medium rounded-md hover:bg-[#5a6bd8] transition-colors"
                      >
                        Go to Question
                      </button>
                      <button
                        onClick={() => handleUnflagQuestion(item!.questionId)}
                        className="px-3 py-1 bg-amber-200 text-amber-800 text-sm font-medium rounded-md hover:bg-amber-300 transition-colors"
                        title="Remove flag"
                      >
                        Unflag
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {flaggedQuestionsDetails.length > 0 && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                {flaggedQuestionsDetails.filter(item => item!.isAnswered).length} of {flaggedQuestionsDetails.length} flagged questions answered
              </span>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
