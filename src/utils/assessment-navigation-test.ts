/**
 * Test file to demonstrate the assessment navigation validation functionality
 * This file shows how the new validation system works
 */

import { validateSectionCompletion, canNavigateToSection } from './assessment-calculations';

// Example test data - simulating partially completed assessment
const mockAnswers = {
  // Big Five - Openness to Experience (first 8 questions answered)
  1: 4, 2: 3, 3: 5, 4: 2, 5: 4, 6: 3, 7: 5, 8: 2,
  // Questions 9-10 not answered (missing)
  
  // RIASEC - no questions answered yet
  // VIA - no questions answered yet
};

/**
 * Test section completion validation
 */
export function testSectionValidation() {
  console.log('=== Testing Section Validation ===');
  
  // Test Big Five - Openness to Experience section (should be incomplete)
  const bigFiveSection0 = validateSectionCompletion(mockAnswers, 0, 0);
  console.log('Big Five Section 0 (Openness):', {
    isComplete: bigFiveSection0.isComplete,
    answered: bigFiveSection0.answeredQuestions,
    total: bigFiveSection0.totalQuestions,
    missing: bigFiveSection0.missingQuestions.length
  });
  
  // Test RIASEC - Realistic section (should be incomplete - no answers)
  const riasecSection0 = validateSectionCompletion(mockAnswers, 1, 0);
  console.log('RIASEC Section 0 (Realistic):', {
    isComplete: riasecSection0.isComplete,
    answered: riasecSection0.answeredQuestions,
    total: riasecSection0.totalQuestions,
    missing: riasecSection0.missingQuestions.length
  });
}

/**
 * Test navigation validation
 */
export function testNavigationValidation() {
  console.log('\n=== Testing Navigation Validation ===');
  
  // Current position: Big Five, Section 0 (Openness to Experience)
  const currentAssessment = 0;
  const currentSection = 0;
  
  // Test 1: Try to navigate to next section within Big Five
  const nextSectionCheck = canNavigateToSection(
    mockAnswers, 
    currentAssessment, 
    currentSection, 
    0, // Same assessment
    1  // Next section
  );
  console.log('Navigate to Big Five Section 1:', {
    canNavigate: nextSectionCheck.canNavigate,
    reason: nextSectionCheck.reason
  });
  
  // Test 2: Try to navigate to RIASEC (next assessment)
  const nextAssessmentCheck = canNavigateToSection(
    mockAnswers,
    currentAssessment,
    currentSection,
    1, // RIASEC assessment
    0  // First section
  );
  console.log('Navigate to RIASEC Section 0:', {
    canNavigate: nextAssessmentCheck.canNavigate,
    reason: nextAssessmentCheck.reason
  });
  
  // Test 3: Try to navigate backward (should always work)
  const backwardCheck = canNavigateToSection(
    mockAnswers,
    1, // Currently on RIASEC
    2, // Currently on section 2
    0, // Go back to Big Five
    0  // First section
  );
  console.log('Navigate backward to Big Five Section 0:', {
    canNavigate: backwardCheck.canNavigate,
    reason: backwardCheck.reason
  });
}

/**
 * Test with completed section
 */
export function testWithCompletedSection() {
  console.log('\n=== Testing with Completed Section ===');
  
  // Mock answers with complete first section (all 10 questions answered)
  const completeAnswers = {
    1: 4, 2: 3, 3: 5, 4: 2, 5: 4, 6: 3, 7: 5, 8: 2, 9: 4, 10: 3
  };
  
  const sectionValidation = validateSectionCompletion(completeAnswers, 0, 0);
  console.log('Complete Big Five Section 0:', {
    isComplete: sectionValidation.isComplete,
    answered: sectionValidation.answeredQuestions,
    total: sectionValidation.totalQuestions
  });
  
  const navigationCheck = canNavigateToSection(
    completeAnswers,
    0, // Big Five
    0, // Section 0
    0, // Same assessment
    1  // Next section
  );
  console.log('Navigate to next section after completion:', {
    canNavigate: navigationCheck.canNavigate,
    reason: navigationCheck.reason
  });
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  testSectionValidation();
  testNavigationValidation();
  testWithCompletedSection();
}
