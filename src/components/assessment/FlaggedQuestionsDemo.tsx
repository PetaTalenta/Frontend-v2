'use client';

import React from 'react';
import { useAssessment } from '../../contexts/AssessmentContext';
import { getFlaggedQuestionsStats } from '../../utils/flagged-questions-storage';

/**
 * Demo component to showcase flagged questions functionality
 * This can be used for testing and demonstration purposes
 */
export default function FlaggedQuestionsDemo() {
  const { 
    getFlaggedQuestions, 
    toggleFlag, 
    answers,
    getCurrentAssessment 
  } = useAssessment();
  
  const flaggedQuestionIds = getFlaggedQuestions();
  const stats = getFlaggedQuestionsStats();
  const currentAssessment = getCurrentAssessment();

  // Get first few questions for demo
  const demoQuestions = currentAssessment.questions.slice(0, 3);

  const handleDemoFlag = (questionId: number) => {
    toggleFlag(questionId);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <span>🏷️</span>
          Question Flagging System Demo
        </h2>
        <p className="text-gray-600">
          This demo showcases the question flagging functionality. Click the flag buttons to test the system.
        </p>
      </div>

      {/* Statistics */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Flagging Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-3">
            <div className="text-2xl font-bold text-amber-600">{stats.totalFlagged}</div>
            <div className="text-gray-600">Total Flagged</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">{flaggedQuestionIds.length}</div>
            <div className="text-gray-600">Currently Flagged</div>
          </div>
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900">
              {stats.lastUpdated ? stats.lastUpdated.toLocaleString() : 'Never'}
            </div>
            <div className="text-gray-600">Last Updated</div>
          </div>
        </div>
      </div>

      {/* Demo Questions */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Demo Questions</h3>
        {demoQuestions.map((question) => {
          const isFlagged = flaggedQuestionIds.includes(question.id);
          const isAnswered = answers[question.id] != null;
          
          return (
            <div
              key={question.id}
              className={`border rounded-lg p-4 transition-all ${
                isFlagged ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-block px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                      Question {question.id}
                    </span>
                    <span className="inline-block px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs">
                      {question.subcategory}
                    </span>
                    {isAnswered && (
                      <span className="inline-block px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs">
                        Answered ({answers[question.id]})
                      </span>
                    )}
                  </div>
                  
                  <h4 className="font-medium text-gray-900 mb-2">
                    {question.text}
                  </h4>
                  
                  <div className="text-sm text-gray-600">
                    Category: {question.category}
                  </div>
                </div>

                <button
                  onClick={() => handleDemoFlag(question.id)}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isFlagged
                      ? 'bg-amber-200 text-amber-800 hover:bg-amber-300'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <span>🏷️</span>
                  {isFlagged ? 'Unflag' : 'Flag'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Flagged Questions List */}
      {flaggedQuestionIds.length > 0 && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <span>🏷️</span>
            Currently Flagged Questions
          </h3>
          <div className="space-y-2">
            {flaggedQuestionIds.map((questionId) => {
              const question = currentAssessment.questions.find(q => q.id === questionId);
              if (!question) return null;
              
              return (
                <div key={questionId} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div>
                    <span className="font-medium text-gray-900">Question {questionId}</span>
                    <span className="text-gray-600 ml-2">- {question.text.substring(0, 50)}...</span>
                  </div>
                  <button
                    onClick={() => handleDemoFlag(questionId)}
                    className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                  >
                    Remove Flag
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How to Use</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click the flag button (🏷️) on any question to flag it for review</li>
          <li>• Flagged questions are highlighted with an amber border</li>
          <li>• Use the "Flagged" button in the header to view all flagged questions</li>
          <li>• Navigate directly to flagged questions from the review panel</li>
          <li>• Flagged questions are automatically saved and persist across sessions</li>
        </ul>
      </div>
    </div>
  );
}
