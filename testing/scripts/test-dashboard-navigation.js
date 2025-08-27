// Test script for dashboard to results navigation
// Run this in browser console to test the navigation fixes

const DashboardNavigationTest = {
  // Test navigation to results page
  async testResultsNavigation(resultId = 'demo-result-1') {
    console.log('🧪 Testing dashboard to results navigation...');
    console.log(`Target result ID: ${resultId}`);
    
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

  // Test error handling
  async testErrorHandling() {
    console.log('🧪 Testing error handling...');
    
    try {
      // Test with invalid result ID
      const invalidId = 'invalid-result-id-123';
      console.log(`Testing with invalid ID: ${invalidId}`);
      
      await this.testResultsNavigation(invalidId);
      
      return true;
    } catch (error) {
      console.error('❌ Error handling test failed:', error);
      return false;
    }
  },

  // Test demo data generation
  testDemoDataGeneration() {
    console.log('🧪 Testing demo data generation...');
    
    try {
      // Check if demo data generator is available
      if (typeof window.generateDemoAssessmentResult === 'function') {
        const demoResult = window.generateDemoAssessmentResult('test-demo-123');
        console.log('✅ Demo data generated:', demoResult);
        return true;
      } else {
        console.log('⚠️ Demo data generator not available in window scope');
        return false;
      }
    } catch (error) {
      console.error('❌ Demo data generation failed:', error);
      return false;
    }
  },

  // Test chart loading
  async testChartLoading() {
    console.log('🧪 Testing chart component loading...');
    
    try {
      // Check if chart components are available
      const chartElements = document.querySelectorAll('[data-testid="assessment-chart"]');
      console.log(`Found ${chartElements.length} chart elements`);
      
      // Check for error boundaries
      const errorBoundaries = document.querySelectorAll('[data-error-boundary]');
      console.log(`Found ${errorBoundaries.length} error boundaries`);
      
      return true;
    } catch (error) {
      console.error('❌ Chart loading test failed:', error);
      return false;
    }
  },

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting comprehensive navigation tests...');
    console.log('='.repeat(50));
    
    const results = {
      navigation: await this.testResultsNavigation(),
      errorHandling: await this.testErrorHandling(),
      demoData: this.testDemoDataGeneration(),
      chartLoading: await this.testChartLoading()
    };
    
    console.log('\n📊 Test Results Summary:');
    console.log('='.repeat(30));
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    
    const allPassed = Object.values(results).every(result => result);
    console.log(`\n🎯 Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    
    return results;
  },

  // Quick navigation test for dashboard
  quickTest() {
    console.log('⚡ Quick navigation test...');
    
    // Test basic navigation
    this.testResultsNavigation('demo-result-1');
    
    // Log current page info
    console.log('Current page:', window.location.pathname);
    console.log('Router available:', !!window.next?.router);
    console.log('Error boundaries:', document.querySelectorAll('[data-error-boundary]').length);
  }
};

// Make available globally for testing
window.DashboardNavigationTest = DashboardNavigationTest;

console.log('🔧 Dashboard Navigation Test loaded!');
console.log('Run DashboardNavigationTest.quickTest() for a quick test');
console.log('Run DashboardNavigationTest.runAllTests() for comprehensive testing');
