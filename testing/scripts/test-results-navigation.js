/**
 * Results Navigation Testing Script
 * Run this in browser console to test results page navigation
 */

window.testResultsNavigation = {
  // Test navigation to results page
  async testResultsNavigation(resultId = 'result-001') {
    console.log('🧪 Testing navigation to results page...');
    console.log('Target URL:', `/results/${resultId}`);
    
    const currentUrl = window.location.href;
    console.log('Current URL:', currentUrl);
    
    try {
      // Test if we can navigate using router
      if (window.next?.router?.push) {
        console.log('Using Next.js router...');
        await window.next.router.push(`/results/${resultId}`);
        console.log('✅ Router navigation successful');
      } else {
        console.log('Using window.location...');
        window.location.href = `/results/${resultId}`;
        console.log('✅ Window location navigation initiated');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Navigation failed:', error);
      return false;
    }
  },

  // Test route conflict detection
  testRouteConflict() {
    console.log('🔍 Testing route conflict detection...');
    
    const routes = [
      '/results',           // Should redirect to /my-results
      '/results/result-001', // Should work (dynamic route)
      '/results/result-002', // Should work (dynamic route)
      '/results/invalid-id'  // Should show not found
    ];
    
    routes.forEach(route => {
      console.log(`Testing route: ${route}`);
      
      // Create a test link to see what happens
      const testLink = document.createElement('a');
      testLink.href = route;
      testLink.style.display = 'none';
      document.body.appendChild(testLink);
      
      console.log(`- Resolved URL: ${testLink.href}`);
      
      document.body.removeChild(testLink);
    });
  },

  // Test assessment completion flow
  async testAssessmentCompletion() {
    console.log('🎯 Testing assessment completion flow...');
    
    // Mock assessment completion
    const mockResult = {
      id: `test-result-${Date.now()}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
      persona_profile: {
        title: 'Test Persona',
        description: 'Test description',
        careerRecommendation: ['Test Career'],
        strengths: ['Test Strength']
      }
    };
    
    console.log('Mock result created:', mockResult);
    
    // Save to localStorage (simulating assessment completion)
    try {
      const existingHistory = JSON.parse(localStorage.getItem('assessment-history') || '[]');
      existingHistory.unshift(mockResult);
      localStorage.setItem('assessment-history', JSON.stringify(existingHistory));
      console.log('✅ Mock result saved to localStorage');
      
      // Test navigation to the result
      const resultUrl = `/results/${mockResult.id}`;
      console.log('Testing navigation to:', resultUrl);
      
      // Don't actually navigate, just test the URL construction
      console.log('✅ Result URL constructed successfully');
      
      return mockResult;
    } catch (error) {
      console.error('❌ Failed to save mock result:', error);
      return null;
    }
  },

  // Check current page state
  checkCurrentPageState() {
    console.log('📊 Checking current page state...');
    
    const state = {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      title: document.title,
      timestamp: new Date().toISOString()
    };
    
    console.log('Current state:', state);
    
    // Check if we're on a results page
    if (state.pathname.startsWith('/results/')) {
      const resultId = state.pathname.split('/results/')[1];
      console.log('📄 On results page with ID:', resultId);
      
      // Check if result data is available
      const resultElement = document.querySelector('[data-result-id]');
      if (resultElement) {
        console.log('✅ Result element found on page');
      } else {
        console.log('⚠️ Result element not found - page may be loading or have errors');
      }
      
      // Check for error messages
      const errorElement = document.querySelector('[data-error]');
      if (errorElement) {
        console.log('❌ Error element found:', errorElement.textContent);
      }
    }
    
    return state;
  },

  // Test localStorage data
  checkLocalStorageData() {
    console.log('💾 Checking localStorage data...');
    
    try {
      const assessmentHistory = localStorage.getItem('assessment-history');
      const assessmentProgress = localStorage.getItem('assessment-progress');
      const navigationDebug = localStorage.getItem('navigation-debug');
      
      console.log('Assessment History:', assessmentHistory ? JSON.parse(assessmentHistory) : null);
      console.log('Assessment Progress:', assessmentProgress ? JSON.parse(assessmentProgress) : null);
      console.log('Navigation Debug:', navigationDebug ? JSON.parse(navigationDebug) : null);
      
      if (assessmentHistory) {
        const history = JSON.parse(assessmentHistory);
        console.log(`📈 Found ${history.length} assessment results in history`);
        
        history.forEach((result, index) => {
          console.log(`  ${index + 1}. ${result.id} - ${result.persona_profile?.title || 'Unknown'}`);
        });
      }
      
      return {
        hasHistory: !!assessmentHistory,
        hasProgress: !!assessmentProgress,
        hasDebugData: !!navigationDebug
      };
    } catch (error) {
      console.error('❌ Error reading localStorage:', error);
      return null;
    }
  },

  // Run comprehensive test
  async runComprehensiveTest() {
    console.log('🚀 Running comprehensive results navigation test...');
    console.log('='.repeat(60));
    
    // 1. Check current state
    console.log('\n1️⃣ Checking current page state...');
    const currentState = this.checkCurrentPageState();
    
    // 2. Check localStorage
    console.log('\n2️⃣ Checking localStorage data...');
    const storageData = this.checkLocalStorageData();
    
    // 3. Test route conflicts
    console.log('\n3️⃣ Testing route conflicts...');
    this.testRouteConflict();
    
    // 4. Test assessment completion
    console.log('\n4️⃣ Testing assessment completion flow...');
    const mockResult = await this.testAssessmentCompletion();
    
    // 5. Summary
    console.log('\n📋 Test Summary:');
    console.log('='.repeat(40));
    console.log('✅ Current state checked');
    console.log(`${storageData?.hasHistory ? '✅' : '⚠️'} Assessment history: ${storageData?.hasHistory ? 'Available' : 'Empty'}`);
    console.log(`${storageData?.hasProgress ? '✅' : '⚠️'} Assessment progress: ${storageData?.hasProgress ? 'Available' : 'Empty'}`);
    console.log(`${storageData?.hasDebugData ? '✅' : '⚠️'} Navigation debug: ${storageData?.hasDebugData ? 'Available' : 'Empty'}`);
    console.log(`${mockResult ? '✅' : '❌'} Mock assessment: ${mockResult ? 'Created' : 'Failed'}`);
    
    // 6. Recommendations
    console.log('\n💡 Recommendations:');
    if (!storageData?.hasHistory) {
      console.log('- Complete an assessment to generate results data');
    }
    if (!storageData?.hasDebugData) {
      console.log('- Navigate between pages to generate debug data');
    }
    if (currentState.pathname === '/results') {
      console.log('- You are on the conflicting /results route - should redirect to /my-results');
    }
    
    return {
      currentState,
      storageData,
      mockResult
    };
  },

  // Quick navigation test
  async quickTest() {
    console.log('⚡ Quick navigation test...');
    
    // Test navigation to demo results
    console.log('Testing navigation to demo result...');
    await this.testResultsNavigation('result-001');
  }
};

// Auto-run basic checks when script loads
console.log('🔧 Results Navigation Testing Script loaded!');
console.log('📝 Available commands:');
console.log('- testResultsNavigation.runComprehensiveTest() - Full test suite');
console.log('- testResultsNavigation.quickTest() - Quick navigation test');
console.log('- testResultsNavigation.checkCurrentPageState() - Check current state');
console.log('- testResultsNavigation.testResultsNavigation("result-001") - Test specific result');

// Run initial state check
window.testResultsNavigation.checkCurrentPageState();
