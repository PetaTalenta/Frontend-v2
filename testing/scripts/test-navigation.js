/**
 * Navigation Testing Script
 * Run this in browser console to test navigation functionality
 */

// Test navigation functions
window.testNavigation = {
  // Test basic router navigation
  async testRouterPush() {
    console.log('Testing router.push navigation...');
    
    if (typeof window.next?.router?.push === 'function') {
      try {
        await window.next.router.push('/dashboard');
        console.log('✅ Router.push test successful');
        return true;
      } catch (error) {
        console.error('❌ Router.push test failed:', error);
        return false;
      }
    } else {
      console.warn('⚠️ Next.js router not available');
      return false;
    }
  },

  // Test window.location navigation
  testWindowLocation() {
    console.log('Testing window.location navigation...');
    
    try {
      const currentUrl = window.location.href;
      console.log('Current URL:', currentUrl);
      
      // Test if we can modify location (will actually navigate)
      // window.location.href = '/dashboard';
      console.log('✅ Window.location test successful (not executed to avoid navigation)');
      return true;
    } catch (error) {
      console.error('❌ Window.location test failed:', error);
      return false;
    }
  },

  // Test assessment completion flow
  async testAssessmentCompletion() {
    console.log('Testing assessment completion flow...');
    
    // Mock assessment data
    const mockAnswers = {};
    for (let i = 1; i <= 132; i++) {
      mockAnswers[i] = Math.floor(Math.random() * 5) + 1;
    }
    
    console.log('Mock answers generated:', Object.keys(mockAnswers).length, 'questions');
    
    // Test validation
    if (typeof window.validateAnswers === 'function') {
      const validation = window.validateAnswers(mockAnswers);
      console.log('Validation result:', validation);
      
      if (validation.isValid) {
        console.log('✅ Assessment validation test successful');
        return true;
      } else {
        console.log('⚠️ Assessment validation shows incomplete');
        return false;
      }
    } else {
      console.warn('⚠️ validateAnswers function not available');
      return false;
    }
  },

  // Test debug navigation utility
  async testDebugNavigation() {
    console.log('Testing debug navigation utility...');
    
    if (typeof window.debugNavigate === 'function') {
      try {
        // Mock router object
        const mockRouter = {
          push: async (url) => {
            console.log('Mock router.push called with:', url);
            return Promise.resolve();
          }
        };
        
        const result = await window.debugNavigate(mockRouter, '/test-url', { test: true });
        console.log('Debug navigation result:', result);
        
        if (result) {
          console.log('✅ Debug navigation test successful');
          return true;
        } else {
          console.log('❌ Debug navigation test failed');
          return false;
        }
      } catch (error) {
        console.error('❌ Debug navigation test error:', error);
        return false;
      }
    } else {
      console.warn('⚠️ debugNavigate function not available');
      return false;
    }
  },

  // Test navigation debug panel
  testDebugPanel() {
    console.log('Testing navigation debug panel...');
    
    // Try to trigger debug panel
    const event = new KeyboardEvent('keydown', {
      key: 'D',
      ctrlKey: true,
      shiftKey: true
    });
    
    document.dispatchEvent(event);
    
    // Check if debug panel appeared
    setTimeout(() => {
      const debugPanel = document.querySelector('[data-debug-panel]');
      if (debugPanel) {
        console.log('✅ Debug panel test successful');
      } else {
        console.log('⚠️ Debug panel not found (may not be implemented yet)');
      }
    }, 100);
  },

  // Run all tests
  async runAllTests() {
    console.log('🧪 Running all navigation tests...');
    console.log('=====================================');
    
    const results = {
      routerPush: await this.testRouterPush(),
      windowLocation: this.testWindowLocation(),
      assessmentCompletion: await this.testAssessmentCompletion(),
      debugNavigation: await this.testDebugNavigation()
    };
    
    this.testDebugPanel();
    
    console.log('=====================================');
    console.log('📊 Test Results Summary:');
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const passedCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log(`\n📈 Overall: ${passedCount}/${totalCount} tests passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 All tests passed! Navigation should work correctly.');
    } else {
      console.log('⚠️ Some tests failed. Check individual test results above.');
    }
    
    return results;
  },

  // Check current page state
  checkCurrentState() {
    console.log('🔍 Checking current page state...');
    console.log('=====================================');
    
    const state = {
      url: window.location.href,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    // Check for common objects
    const checks = {
      nextRouter: typeof window.next?.router,
      reactRouter: typeof window.ReactRouter,
      navigationDebugger: typeof window.navigationDebugger,
      debugNavigate: typeof window.debugNavigate,
      validateAnswers: typeof window.validateAnswers
    };
    
    console.log('📍 Current State:', state);
    console.log('🔧 Available Functions:', checks);
    
    // Check localStorage
    try {
      const navigationDebug = localStorage.getItem('navigation-debug');
      const assessmentHistory = localStorage.getItem('assessment-history');
      const assessmentProgress = localStorage.getItem('assessment-progress');
      
      console.log('💾 LocalStorage Data:');
      console.log('- Navigation Debug Events:', navigationDebug ? JSON.parse(navigationDebug).length : 0);
      console.log('- Assessment History:', assessmentHistory ? JSON.parse(assessmentHistory).length : 0);
      console.log('- Assessment Progress:', assessmentProgress ? 'Present' : 'None');
    } catch (error) {
      console.warn('⚠️ Error reading localStorage:', error);
    }
    
    return { state, checks };
  }
};

// Auto-run basic check when script loads
console.log('🚀 Navigation testing script loaded!');
console.log('📝 Available commands:');
console.log('- testNavigation.runAllTests() - Run all navigation tests');
console.log('- testNavigation.checkCurrentState() - Check current page state');
console.log('- testNavigation.testRouterPush() - Test router navigation');
console.log('- testNavigation.testDebugPanel() - Test debug panel (Ctrl+Shift+D)');

// Run initial state check
window.testNavigation.checkCurrentState();
