/**
 * Run Multiple Concurrent Assessment Tests
 * This script launches multiple instances of the concurrent assessment test
 * to simulate high load on the system.
 * 
 * Usage: node scripts/run-concurrent-tests.js
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const CONFIG = {
  // Number of concurrent test instances to run
  testInstances: 2,
  
  // Delay between starting test instances (ms)
  startDelay: 1000,
  
  // Test script to run
  testScript: path.join(__dirname, 'concurrent-assessment-test.js'),
  
  // Timeout for each test instance (ms)
  timeout: 10 * 60 * 1000, // 10 minutes
};

class TestRunner {
  constructor() {
    this.processes = [];
    this.results = [];
    this.startTime = Date.now();
  }

  log(message) {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(`[RUNNER] [+${elapsed}s] ${message}`);
  }

  async run() {
    this.log(`Starting ${CONFIG.testInstances} concurrent test instances`);
    this.log(`Test script: ${CONFIG.testScript}`);
    
    // Start test instances with delay
    for (let i = 0; i < CONFIG.testInstances; i++) {
      await this.startTestInstance(i + 1);
      
      if (i < CONFIG.testInstances - 1) {
        this.log(`Waiting ${CONFIG.startDelay}ms before starting next instance...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.startDelay));
      }
    }
    
    // Wait for all processes to complete
    this.log(`Waiting for all ${this.processes.length} test instances to complete...`);
    await this.waitForCompletion();
    
    // Generate summary
    this.generateSummary();
  }

  async startTestInstance(instanceNumber) {
    return new Promise((resolve) => {
      this.log(`Starting test instance ${instanceNumber}...`);
      
      // Create unique log file for this instance
      const logFile = path.join(process.cwd(), `test-instance-${instanceNumber}.log`);
      
      // Spawn process
      const childProcess = spawn('node', [CONFIG.testScript], {
        env: {
          ...process.env,
          TEST_INSTANCE: instanceNumber.toString(),
        },
        stdio: ['ignore', 'pipe', 'pipe']
      });
      
      // Store process info
      const processInfo = {
        instanceNumber,
        process: childProcess,
        startTime: Date.now(),
        logFile,
        exitCode: null,
        error: null,
        completed: false
      };
      
      this.processes.push(processInfo);
      
      // Set timeout
      const timeout = setTimeout(() => {
        this.log(`⚠️ Test instance ${instanceNumber} timed out after ${CONFIG.timeout / 1000} seconds`);
        processInfo.error = 'Timeout';
        childProcess.kill();
      }, CONFIG.timeout);
      
      // Handle output
      childProcess.stdout.on('data', (data) => {
        const output = data.toString();
        process.stdout.write(`[Instance ${instanceNumber}] ${output}`);
      });
      
      childProcess.stderr.on('data', (data) => {
        const output = data.toString();
        process.stderr.write(`[Instance ${instanceNumber}] ${output}`);
      });
      
      // Handle process exit
      childProcess.on('exit', (code) => {
        clearTimeout(timeout);
        processInfo.exitCode = code;
        processInfo.completed = true;
        processInfo.endTime = Date.now();
        
        if (code === 0) {
          this.log(`✅ Test instance ${instanceNumber} completed successfully`);
        } else {
          this.log(`❌ Test instance ${instanceNumber} failed with exit code ${code}`);
          processInfo.error = `Exit code ${code}`;
        }
        
        resolve();
      });
      
      childProcess.on('error', (error) => {
        clearTimeout(timeout);
        processInfo.error = error.message;
        processInfo.completed = true;
        processInfo.endTime = Date.now();
        
        this.log(`❌ Test instance ${instanceNumber} failed with error: ${error.message}`);
        resolve();
      });
    });
  }

  async waitForCompletion() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const allCompleted = this.processes.every(p => p.completed);
        
        if (allCompleted) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 1000);
    });
  }

  generateSummary() {
    const totalDuration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const successCount = this.processes.filter(p => p.exitCode === 0).length;
    const failCount = this.processes.filter(p => p.exitCode !== 0).length;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 CONCURRENT TESTS SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total test instances: ${this.processes.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Success rate: ${((successCount / this.processes.length) * 100).toFixed(1)}%`);
    console.log(`Total duration: ${totalDuration}s`);
    console.log('='.repeat(80));
    
    // Instance details
    console.log('\nInstance details:');
    this.processes.forEach(p => {
      const duration = p.endTime ? ((p.endTime - p.startTime) / 1000).toFixed(2) : 'N/A';
      const status = p.exitCode === 0 ? '✅ SUCCESS' : `❌ FAILED (${p.error || 'Unknown error'})`;
      
      console.log(`Instance ${p.instanceNumber}: ${status}, Duration: ${duration}s`);
    });
    
    console.log('='.repeat(80));
  }

  cleanup() {
    // Kill any remaining processes
    this.processes.forEach(p => {
      if (p.process && !p.completed) {
        try {
          p.process.kill();
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    });
  }
}

// Main execution
if (require.main === module) {
  const runner = new TestRunner();
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Test runner interrupted by user');
    runner.cleanup();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    console.log('\n🛑 Test runner terminated');
    runner.cleanup();
    process.exit(0);
  });
  
  // Run the tests
  runner.run()
    .then(() => {
      console.log('\n🎉 All test instances completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test runner failed:', error.message);
      runner.cleanup();
      process.exit(1);
    });
}

module.exports = TestRunner;
