/**
 * Test Summary Generator
 * Analyzes test reports and generates comprehensive summary
 * 
 * Usage: node scripts/test-summary.js
 */

const fs = require('fs');
const path = require('path');

class TestSummaryGenerator {
  constructor() {
    this.reports = [];
    this.summary = {
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      totalAssessments: 0,
      successfulAssessments: 0,
      failedAssessments: 0,
      tokenVerification: {
        totalCorrect: 0,
        totalIncorrect: 0,
        totalTokensDeducted: 0,
        expectedTokensDeducted: 0
      },
      performance: {
        averageDuration: 0,
        fastestTest: null,
        slowestTest: null
      },
      errors: []
    };
  }

  async generateSummary() {
    console.log('📊 Generating Test Summary...');
    console.log('================================');
    
    try {
      // Load all test reports
      await this.loadTestReports();
      
      // Analyze reports
      this.analyzeReports();
      
      // Generate summary
      this.displaySummary();
      
      // Save summary to file
      this.saveSummary();
      
    } catch (error) {
      console.error('❌ Error generating summary:', error.message);
      throw error;
    }
  }

  async loadTestReports() {
    const reportsDir = path.join(process.cwd(), 'test-reports');
    
    if (!fs.existsSync(reportsDir)) {
      console.log('⚠️ No test reports directory found');
      return;
    }
    
    const files = fs.readdirSync(reportsDir).filter(file => file.endsWith('.json'));
    
    if (files.length === 0) {
      console.log('⚠️ No test report files found');
      return;
    }
    
    console.log(`📁 Found ${files.length} test report(s)`);
    
    for (const file of files) {
      try {
        const filePath = path.join(reportsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const report = JSON.parse(content);
        
        report.filename = file;
        report.timestamp = this.extractTimestamp(file);
        
        this.reports.push(report);
        console.log(`  ✅ Loaded: ${file}`);
        
      } catch (error) {
        console.log(`  ❌ Failed to load: ${file} - ${error.message}`);
      }
    }
    
    // Sort reports by timestamp
    this.reports.sort((a, b) => a.timestamp - b.timestamp);
  }

  extractTimestamp(filename) {
    const match = filename.match(/(\d+)\.json$/);
    return match ? parseInt(match[1]) : 0;
  }

  analyzeReports() {
    console.log('\n🔍 Analyzing test reports...');
    
    for (const report of this.reports) {
      this.summary.totalTests++;
      
      // Analyze test summary
      if (report.testSummary) {
        const testSummary = report.testSummary;
        
        // Count assessments
        this.summary.totalAssessments += testSummary.concurrentAssessments || 0;
        this.summary.successfulAssessments += testSummary.successfulAssessments || 0;
        this.summary.failedAssessments += testSummary.failedAssessments || 0;
        
        // Performance tracking
        const duration = this.parseDuration(testSummary.totalDuration);
        if (duration > 0) {
          if (!this.summary.performance.fastestTest || duration < this.summary.performance.fastestTest.duration) {
            this.summary.performance.fastestTest = {
              filename: report.filename,
              duration: duration,
              durationString: testSummary.totalDuration
            };
          }
          
          if (!this.summary.performance.slowestTest || duration > this.summary.performance.slowestTest.duration) {
            this.summary.performance.slowestTest = {
              filename: report.filename,
              duration: duration,
              durationString: testSummary.totalDuration
            };
          }
        }
        
        // Success/failure tracking
        const successRate = parseFloat(testSummary.successRate) || 0;
        if (successRate === 100) {
          this.summary.successfulTests++;
        } else {
          this.summary.failedTests++;
        }
      }
      
      // Analyze token verification
      if (report.tokenVerification) {
        const tokenVerif = report.tokenVerification;
        
        if (tokenVerif.deductionCorrect) {
          this.summary.tokenVerification.totalCorrect++;
        } else {
          this.summary.tokenVerification.totalIncorrect++;
        }
        
        this.summary.tokenVerification.totalTokensDeducted += tokenVerif.actualDeduction || 0;
        this.summary.tokenVerification.expectedTokensDeducted += tokenVerif.expectedDeduction || 0;
      }
      
      // Collect errors
      if (report.errors && report.errors.length > 0) {
        this.summary.errors.push(...report.errors.map(error => ({
          ...error,
          testFile: report.filename
        })));
      }
    }
    
    // Calculate average duration
    if (this.summary.totalTests > 0) {
      const totalDuration = this.reports.reduce((sum, report) => {
        const duration = this.parseDuration(report.testSummary?.totalDuration);
        return sum + duration;
      }, 0);
      
      this.summary.performance.averageDuration = totalDuration / this.summary.totalTests;
    }
  }

  parseDuration(durationString) {
    if (!durationString) return 0;
    const match = durationString.match(/(\d+\.?\d*)s/);
    return match ? parseFloat(match[1]) : 0;
  }

  displaySummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📋 COMPREHENSIVE TEST SUMMARY');
    console.log('='.repeat(80));
    
    // Overall statistics
    console.log('\n📊 Overall Statistics:');
    console.log(`   Total test runs: ${this.summary.totalTests}`);
    console.log(`   Successful tests: ${this.summary.successfulTests}`);
    console.log(`   Failed tests: ${this.summary.failedTests}`);
    console.log(`   Success rate: ${this.summary.totalTests > 0 ? ((this.summary.successfulTests / this.summary.totalTests) * 100).toFixed(1) : 0}%`);
    
    // Assessment statistics
    console.log('\n📝 Assessment Statistics:');
    console.log(`   Total assessments: ${this.summary.totalAssessments}`);
    console.log(`   Successful assessments: ${this.summary.successfulAssessments}`);
    console.log(`   Failed assessments: ${this.summary.failedAssessments}`);
    console.log(`   Assessment success rate: ${this.summary.totalAssessments > 0 ? ((this.summary.successfulAssessments / this.summary.totalAssessments) * 100).toFixed(1) : 0}%`);
    
    // Token verification
    console.log('\n💰 Token Verification:');
    console.log(`   Correct token deductions: ${this.summary.tokenVerification.totalCorrect}`);
    console.log(`   Incorrect token deductions: ${this.summary.tokenVerification.totalIncorrect}`);
    console.log(`   Total tokens deducted: ${this.summary.tokenVerification.totalTokensDeducted}`);
    console.log(`   Expected tokens deducted: ${this.summary.tokenVerification.expectedTokensDeducted}`);
    console.log(`   Token accuracy: ${this.summary.tokenVerification.totalCorrect + this.summary.tokenVerification.totalIncorrect > 0 ? ((this.summary.tokenVerification.totalCorrect / (this.summary.tokenVerification.totalCorrect + this.summary.tokenVerification.totalIncorrect)) * 100).toFixed(1) : 0}%`);
    
    // Performance metrics
    console.log('\n⚡ Performance Metrics:');
    console.log(`   Average test duration: ${this.summary.performance.averageDuration.toFixed(2)}s`);
    
    if (this.summary.performance.fastestTest) {
      console.log(`   Fastest test: ${this.summary.performance.fastestTest.durationString} (${this.summary.performance.fastestTest.filename})`);
    }
    
    if (this.summary.performance.slowestTest) {
      console.log(`   Slowest test: ${this.summary.performance.slowestTest.durationString} (${this.summary.performance.slowestTest.filename})`);
    }
    
    // Error summary
    if (this.summary.errors.length > 0) {
      console.log('\n❌ Error Summary:');
      const errorTypes = {};
      
      this.summary.errors.forEach(error => {
        const key = error.message || 'Unknown error';
        errorTypes[key] = (errorTypes[key] || 0) + 1;
      });
      
      Object.entries(errorTypes).forEach(([error, count]) => {
        console.log(`   ${error}: ${count} occurrence(s)`);
      });
    } else {
      console.log('\n✅ No errors found in test reports');
    }
    
    console.log('\n' + '='.repeat(80));
  }

  saveSummary() {
    try {
      const summaryPath = path.join(process.cwd(), 'test-reports', `summary-${Date.now()}.json`);
      
      const summaryData = {
        generatedAt: new Date().toISOString(),
        reportsAnalyzed: this.reports.length,
        summary: this.summary,
        reportFiles: this.reports.map(r => r.filename)
      };
      
      fs.writeFileSync(summaryPath, JSON.stringify(summaryData, null, 2));
      console.log(`\n💾 Summary saved to: ${summaryPath}`);
      
    } catch (error) {
      console.error('❌ Failed to save summary:', error.message);
    }
  }
}

// Main execution
if (require.main === module) {
  const generator = new TestSummaryGenerator();
  
  generator.generateSummary()
    .then(() => {
      console.log('\n✅ Test summary generation completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test summary generation failed:', error.message);
      process.exit(1);
    });
}

module.exports = TestSummaryGenerator;
