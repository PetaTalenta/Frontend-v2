'use client';

import React from 'react';
import { assessmentTypes } from '../../data/assessmentQuestions';
import { 
  validateSectionCompletion, 
  isAssessmentComplete, 
  canNavigateToSection,
  getOrderedCategories 
} from '../../utils/assessment-calculations';

export default function NavigationDebug() {
  // Create complete answers for all assessments for testing
  const completeAnswers: Record<number, number> = {};

  // Fill all Big Five questions (IDs 1-44) with sample answers
  for (let i = 1; i <= 44; i++) {
    completeAnswers[i] = Math.floor(Math.random() * 5) + 1;
  }

  // Fill all RIASEC questions (IDs 101-160) with sample answers
  for (let i = 101; i <= 160; i++) {
    completeAnswers[i] = Math.floor(Math.random() * 5) + 1;
  }

  // Fill all VIA questions (IDs 201-296) with sample answers
  for (let i = 201; i <= 296; i++) {
    completeAnswers[i] = Math.floor(Math.random() * 5) + 1;
  }

  // Test all assessment category orders
  const assessmentTests = assessmentTypes.map((assessment, index) => {
    const orderedCategories = getOrderedCategories(assessment.id, assessment.questions);
    let expectedOrder: string[] = [];

    switch (assessment.id) {
      case 'big-five':
        expectedOrder = ['Openness to Experience', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'];
        break;
      case 'riasec':
        expectedOrder = ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'];
        break;
      case 'via-character':
        expectedOrder = ['Wisdom', 'Courage', 'Humanity', 'Justice', 'Temperance', 'Transcendence'];
        break;
    }

    const orderMatches = JSON.stringify(orderedCategories) === JSON.stringify(expectedOrder);
    const completion = isAssessmentComplete(completeAnswers, index);

    return {
      assessment,
      index,
      orderedCategories,
      expectedOrder,
      orderMatches,
      completion
    };
  });

  // Test RIASEC section completion (for detailed view)
  const riasecTest = assessmentTests[1]; // RIASEC is index 1
  const riasecSectionResults = [];
  for (let sectionIndex = 0; sectionIndex < riasecTest.orderedCategories.length; sectionIndex++) {
    const sectionValidation = validateSectionCompletion(completeAnswers, 1, sectionIndex);
    const categoryName = riasecTest.orderedCategories[sectionIndex];
    riasecSectionResults.push({
      sectionIndex,
      categoryName,
      isComplete: sectionValidation.isComplete,
      answered: sectionValidation.answeredQuestions,
      total: sectionValidation.totalQuestions
    });
  }

  // Test navigation scenarios
  const navigationTests = [
    {
      name: 'Phase 1 → Phase 2',
      test: canNavigateToSection(completeAnswers, 0, 4, 1, 0)
    },
    {
      name: 'Phase 2 → Phase 3',
      test: canNavigateToSection(completeAnswers, 1, 5, 2, 0)
    },
    {
      name: 'Phase 1 → Phase 3 (skip Phase 2)',
      test: canNavigateToSection(completeAnswers, 0, 4, 2, 0)
    }
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Navigation Debug Test</h2>
      
      {/* Category Order Tests */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">1. Assessment Category Order Tests</h3>
        <div className="space-y-4">
          {assessmentTests.map((test) => (
            <div key={test.assessment.id} className="p-3 bg-white rounded border">
              <h4 className="font-medium mb-2">{test.assessment.name}</h4>
              <div className="text-sm space-y-1">
                <p><strong>Ordered:</strong> {test.orderedCategories.join(', ')}</p>
                <p><strong>Expected:</strong> {test.expectedOrder.join(', ')}</p>
                <p className={`font-semibold ${test.orderMatches ? 'text-green-600' : 'text-red-600'}`}>
                  Order Matches: {test.orderMatches ? '✅ YES' : '❌ NO'}
                </p>
                <p className={`font-semibold ${test.completion.isComplete ? 'text-green-600' : 'text-red-600'}`}>
                  Assessment Complete: {test.completion.isComplete ? '✅ YES' : '❌ NO'}
                  ({test.completion.completedSections}/{test.completion.totalSections})
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIASEC Section Completion Test */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">2. RIASEC Section Completion Test</h3>
        <div className="grid grid-cols-2 gap-4">
          {riasecSectionResults.map((result) => (
            <div key={result.sectionIndex} className="p-3 bg-white rounded border">
              <p className="font-medium">Section {result.sectionIndex}: {result.categoryName}</p>
              <p className={`text-sm ${result.isComplete ? 'text-green-600' : 'text-red-600'}`}>
                Complete: {result.isComplete ? '✅' : '❌'} ({result.answered}/{result.total})
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tests */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">3. Navigation Tests</h3>
        <div className="space-y-4">
          {navigationTests.map((navTest, index) => (
            <div key={index} className="p-3 bg-white rounded border">
              <p className="font-medium">{navTest.name}</p>
              <p className={`text-sm ${navTest.test.canNavigate ? 'text-green-600' : 'text-red-600'}`}>
                Can Navigate: {navTest.test.canNavigate ? '✅ YES' : '❌ NO'}
              </p>
              {!navTest.test.canNavigate && (
                <p className="text-sm text-red-600">Reason: {navTest.test.reason}</p>
              )}
            </div>
          ))}
        </div>
      </div>



      {/* Summary */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-blue-800">Summary</h3>
        <p className="text-blue-700">
          {assessmentTests.every(t => t.orderMatches && t.completion.isComplete) &&
           navigationTests.every(t => t.test.canNavigate)
            ? '✅ All tests passed! Navigation fix is working correctly.'
            : '❌ Some tests failed. Navigation fix needs more work.'}
        </p>
        <div className="mt-3 text-sm text-blue-600">
          <p>Category Order Tests: {assessmentTests.filter(t => t.orderMatches).length}/{assessmentTests.length} passed</p>
          <p>Assessment Completion Tests: {assessmentTests.filter(t => t.completion.isComplete).length}/{assessmentTests.length} passed</p>
          <p>Navigation Tests: {navigationTests.filter(t => t.test.canNavigate).length}/{navigationTests.length} passed</p>
        </div>
      </div>
    </div>
  );
}
