/**
 * Debug Assessment Flow Script
 * Run this in browser console to debug assessment completion issues
 */

window.debugAssessmentFlow = {
  // Test assessment submission
  async testAssessmentSubmission() {
    console.log('🧪 Testing assessment submission...');
    
    // Mock complete answers
    const mockAnswers = {};
    for (let i = 1; i <= 132; i++) {
      mockAnswers[i] = Math.floor(Math.random() * 5) + 1;
    }
    
    console.log('Mock answers created:', Object.keys(mockAnswers).length, 'questions');
    
    try {
      // Import the submission function
      const { submitAssessment } = await import('/services/assessment-api.ts');
      
      console.log('Submitting assessment...');
      const result = await submitAssessment(mockAnswers);
      
      console.log('✅ Assessment submission successful:', result);
      
      // Test navigation to results
      const resultUrl = `/results/${result.resultId}`;
      console.log('Testing navigation to:', resultUrl);
      
      // Check if result was saved to localStorage
      const savedResult = localStorage.getItem(`assessment-result-${result.resultId}`);
      if (savedResult) {
        console.log('✅ Result saved to localStorage');
        console.log('Result data:', JSON.parse(savedResult));
      } else {
        console.log('❌ Result not found in localStorage');
      }
      
      return result;
    } catch (error) {
      console.error('❌ Assessment submission failed:', error);
      return null;
    }
  },

  // Test navigation to specific result
  async testNavigationToResult(resultId = 'result-001') {
    console.log(`🧭 Testing navigation to result: ${resultId}`);
    
    const targetUrl = `/results/${resultId}`;
    console.log('Target URL:', targetUrl);
    
    // Check if result exists in localStorage
    const savedResult = localStorage.getItem(`assessment-result-${resultId}`);
    if (savedResult) {
      console.log('✅ Result found in localStorage');
    } else {
      console.log('⚠️ Result not found in localStorage, will use demo data');
    }
    
    // Test navigation
    try {
      console.log('Attempting navigation...');
      
      // Use router if available
      if (window.next?.router?.push) {
        await window.next.router.push(targetUrl);
        console.log('✅ Router navigation initiated');
      } else {
        window.location.href = targetUrl;
        console.log('✅ Window location navigation initiated');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Navigation failed:', error);
      return false;
    }
  },

  // Check current assessment state
  checkAssessmentState() {
    console.log('📊 Checking current assessment state...');
    
    try {
      // Check localStorage data
      const assessmentHistory = localStorage.getItem('assessment-history');
      const assessmentProgress = localStorage.getItem('assessment-progress');
      const navigationDebug = localStorage.getItem('navigation-debug');
      
      console.log('Assessment History:', assessmentHistory ? JSON.parse(assessmentHistory) : null);
      console.log('Assessment Progress:', assessmentProgress ? JSON.parse(assessmentProgress) : null);
      console.log('Navigation Debug:', navigationDebug ? JSON.parse(navigationDebug) : null);
      
      // Check for assessment results in localStorage
      const resultKeys = Object.keys(localStorage).filter(key => key.startsWith('assessment-result-'));
      console.log('Assessment Results in localStorage:', resultKeys.length);
      
      resultKeys.forEach(key => {
        const resultId = key.replace('assessment-result-', '');
        const result = JSON.parse(localStorage.getItem(key));
        console.log(`  - ${resultId}: ${result.persona_profile?.title || 'Unknown'}`);
      });
      
      return {
        hasHistory: !!assessmentHistory,
        hasProgress: !!assessmentProgress,
        hasDebugData: !!navigationDebug,
        resultCount: resultKeys.length
      };
    } catch (error) {
      console.error('❌ Error checking assessment state:', error);
      return null;
    }
  },

  // Test complete assessment flow
  async testCompleteFlow() {
    console.log('🚀 Testing complete assessment flow...');
    console.log('='.repeat(50));
    
    // 1. Check current state
    console.log('\n1️⃣ Checking current state...');
    const currentState = this.checkAssessmentState();
    
    // 2. Test assessment submission
    console.log('\n2️⃣ Testing assessment submission...');
    const submissionResult = await this.testAssessmentSubmission();
    
    if (submissionResult) {
      // 3. Test navigation to result
      console.log('\n3️⃣ Testing navigation to result...');
      const navigationResult = await this.testNavigationToResult(submissionResult.resultId);
      
      console.log('\n📋 Flow Test Summary:');
      console.log('='.repeat(30));
      console.log(`✅ Assessment submission: ${submissionResult ? 'SUCCESS' : 'FAILED'}`);
      console.log(`✅ Navigation: ${navigationResult ? 'SUCCESS' : 'FAILED'}`);
      console.log(`📄 Result ID: ${submissionResult.resultId}`);
      console.log(`🎯 Target URL: /results/${submissionResult.resultId}`);
      
      return {
        submission: submissionResult,
        navigation: navigationResult
      };
    } else {
      console.log('\n❌ Assessment submission failed, cannot test navigation');
      return null;
    }
  },

  // Debug current page
  debugCurrentPage() {
    console.log('🔍 Debugging current page...');
    
    const pageInfo = {
      url: window.location.href,
      pathname: window.location.pathname,
      title: document.title,
      timestamp: new Date().toISOString()
    };
    
    console.log('Page Info:', pageInfo);
    
    // Check if we're on results page
    if (pageInfo.pathname.startsWith('/results/')) {
      const resultId = pageInfo.pathname.split('/results/')[1];
      console.log('📄 On results page with ID:', resultId);
      
      // Check for page elements
      const elements = {
        resultContainer: document.querySelector('[data-result-id]'),
        errorMessage: document.querySelector('[data-error]'),
        loadingSpinner: document.querySelector('.animate-spin'),
        personaTitle: document.querySelector('h1'),
        navigationDebugPanel: document.querySelector('[data-debug-panel]')
      };
      
      console.log('Page Elements:');
      Object.entries(elements).forEach(([name, element]) => {
        console.log(`  ${name}: ${element ? '✅ Found' : '❌ Not found'}`);
        if (element && element.textContent) {
          console.log(`    Text: "${element.textContent.trim().substring(0, 100)}..."`);
        }
      });
      
      // Check for JavaScript errors
      const errors = window.console?.errors || [];
      if (errors.length > 0) {
        console.log('JavaScript Errors:', errors);
      }
      
      return { pageInfo, elements };
    } else {
      console.log('Not on results page');
      return { pageInfo };
    }
  },

  // Create demo result for testing
  createDemoResult() {
    console.log('🎭 Creating demo result for testing...');
    
    const demoResult = {
      id: `demo-result-${Date.now()}`,
      userId: 'current-user',
      createdAt: new Date().toISOString(),
      status: 'completed',
      assessment_data: {
        riasec: { realistic: 3.5, investigative: 4.2, artistic: 3.8, social: 4.0, enterprising: 3.2, conventional: 2.8 },
        ocean: { openness: 4.1, conscientiousness: 3.7, extraversion: 3.9, agreeableness: 4.3, neuroticism: 2.5 },
        viaIs: { creativity: 4.2, curiosity: 4.0, judgment: 3.8, love_of_learning: 4.1, perspective: 3.9 }
      },
      persona_profile: {
        title: 'The Creative Problem Solver',
        description: 'You are a highly creative individual with strong analytical skills.',
        careerRecommendation: ['UX Designer', 'Product Manager', 'Research Scientist'],
        strengths: ['Creative Thinking', 'Problem Solving', 'Analytical Skills'],
        weaknesses: ['Time Management', 'Detail Orientation'],
        personalityTraits: ['Innovative', 'Curious', 'Adaptable']
      }
    };
    
    // Save to localStorage
    localStorage.setItem(`assessment-result-${demoResult.id}`, JSON.stringify(demoResult));
    
    // Add to history
    const historyItem = {
      id: Date.now(),
      nama: demoResult.persona_profile.title,
      tipe: "Personality Assessment",
      tanggal: new Date().toLocaleDateString('id-ID'),
      status: "Selesai",
      resultId: demoResult.id
    };
    
    const existingHistory = JSON.parse(localStorage.getItem('assessment-history') || '[]');
    existingHistory.unshift(historyItem);
    localStorage.setItem('assessment-history', JSON.stringify(existingHistory));
    
    console.log('✅ Demo result created:', demoResult.id);
    console.log('🎯 Test URL:', `/results/${demoResult.id}`);
    
    return demoResult;
  }
};

// Auto-run basic checks when script loads
console.log('🔧 Assessment Flow Debug Script loaded!');
console.log('📝 Available commands:');
console.log('- debugAssessmentFlow.testCompleteFlow() - Test full assessment flow');
console.log('- debugAssessmentFlow.testNavigationToResult("result-001") - Test navigation');
console.log('- debugAssessmentFlow.debugCurrentPage() - Debug current page');
console.log('- debugAssessmentFlow.createDemoResult() - Create demo result');
console.log('- debugAssessmentFlow.checkAssessmentState() - Check current state');

// Run initial check
window.debugAssessmentFlow.checkAssessmentState();
