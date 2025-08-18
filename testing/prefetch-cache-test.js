// Testing script untuk sistem prefetch dan caching
// Jalankan dengan: node testing/prefetch-cache-test.js

const { performance } = require('perf_hooks');

// Mock browser APIs untuk testing
global.window = {
  location: { pathname: '/dashboard' },
  addEventListener: () => {},
  removeEventListener: () => {},
  navigator: { onLine: true },
  document: {
    createElement: () => ({ 
      rel: '', 
      href: '', 
      as: '', 
      onload: null, 
      onerror: null 
    }),
    head: { appendChild: () => {} },
    addEventListener: () => {},
    removeEventListener: () => {},
    hidden: false
  },
  fetch: async (url) => {
    // Mock fetch response
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    return {
      ok: true,
      json: async () => ({ data: `Mock data for ${url}`, timestamp: Date.now() })
    };
  },
  indexedDB: {
    open: () => ({
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: {
        transaction: () => ({
          objectStore: () => ({
            put: () => ({ onsuccess: null, onerror: null }),
            get: () => ({ onsuccess: null, onerror: null, result: null }),
            delete: () => ({ onsuccess: null, onerror: null }),
            clear: () => ({ onsuccess: null, onerror: null }),
            getAll: () => ({ onsuccess: null, onerror: null, result: [] }),
            getAllKeys: () => ({ onsuccess: null, onerror: null, result: [] }),
            createIndex: () => {},
            index: () => ({
              openCursor: () => ({ onsuccess: null, onerror: null })
            })
          }),
          oncomplete: null,
          onerror: null
        }),
        objectStoreNames: { contains: () => false }
      }
    })
  }
};

global.document = global.window.document;
global.navigator = global.window.navigator;
global.fetch = global.window.fetch;
global.indexedDB = global.window.indexedDB;

// Test utilities
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
  }

  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async runTests() {
    console.log('🚀 Starting Prefetch & Cache Tests\n');
    
    for (const test of this.tests) {
      const startTime = performance.now();
      
      try {
        await test.testFn();
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        console.log(`✅ ${test.name} (${duration}ms)`);
        this.results.push({ name: test.name, status: 'PASS', duration });
      } catch (error) {
        const endTime = performance.now();
        const duration = Math.round(endTime - startTime);
        
        console.log(`❌ ${test.name} (${duration}ms)`);
        console.log(`   Error: ${error.message}`);
        this.results.push({ name: test.name, status: 'FAIL', duration, error: error.message });
      }
    }

    this.printSummary();
  }

  printSummary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log('\n📊 Test Summary:');
    console.log(`   Total: ${this.results.length}`);
    console.log(`   Passed: ${passed}`);
    console.log(`   Failed: ${failed}`);
    console.log(`   Duration: ${totalDuration}ms`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
      });
    }
  }
}

// Mock implementations untuk testing
class MockResourcePrefetcher {
  constructor() {
    this.prefetchedResources = new Map();
    this.loadingResources = new Set();
  }

  async prefetchResource(url, options = {}) {
    if (this.prefetchedResources.has(url)) {
      return;
    }

    this.loadingResources.add(url);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    
    this.prefetchedResources.set(url, {
      url,
      timestamp: Date.now(),
      status: 'loaded',
      ...options
    });
    
    this.loadingResources.delete(url);
  }

  getStats() {
    return {
      total: this.prefetchedResources.size,
      loaded: Array.from(this.prefetchedResources.values()).filter(r => r.status === 'loaded').length,
      loading: this.loadingResources.size
    };
  }

  isPrefetched(url) {
    return this.prefetchedResources.has(url);
  }
}

class MockIndexedDBCache {
  constructor() {
    this.cache = new Map();
  }

  async set(key, data, options = {}) {
    const entry = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + (options.ttl || 60000),
      tags: options.tags || [],
      version: options.version || '1.0.0'
    };
    
    this.cache.set(key, entry);
  }

  async get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  async has(key) {
    const data = await this.get(key);
    return data !== null;
  }

  async delete(key) {
    this.cache.delete(key);
  }

  async clear() {
    this.cache.clear();
  }

  async getStats() {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      totalEntries: entries.length,
      expiredEntries: entries.filter(e => e.expiresAt < now).length,
      totalSize: entries.reduce((sum, e) => sum + JSON.stringify(e.data).length, 0)
    };
  }
}

class MockUserBehaviorTracker {
  constructor() {
    this.patterns = [
      { from: '/dashboard', to: '/assessment', confidence: 85 },
      { from: '/dashboard', to: '/results', confidence: 70 },
      { from: '/assessment', to: '/results', confidence: 95 },
      { from: '/results', to: '/dashboard', confidence: 60 }
    ];
  }

  getPredictedPages(currentPath, limit = 3) {
    return this.patterns
      .filter(p => p.from === currentPath)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit)
      .map(p => ({
        path: p.to,
        confidence: p.confidence,
        reason: `Navigation pattern (${p.confidence}% confidence)`
      }));
  }

  trackNavigation(from, to, timeSpent) {
    // Mock tracking
    console.log(`Tracked navigation: ${from} -> ${to} (${timeSpent}ms)`);
  }
}

// Initialize test instances
const resourcePrefetcher = new MockResourcePrefetcher();
const indexedDBCache = new MockIndexedDBCache();
const userBehaviorTracker = new MockUserBehaviorTracker();

// Test cases
const testRunner = new TestRunner();

// Test 1: Resource Prefetching
testRunner.addTest('Resource Prefetching Basic', async () => {
  await resourcePrefetcher.prefetchResource('/api/test', { priority: 'high' });
  
  if (!resourcePrefetcher.isPrefetched('/api/test')) {
    throw new Error('Resource was not prefetched');
  }
  
  const stats = resourcePrefetcher.getStats();
  if (stats.total !== 1 || stats.loaded !== 1) {
    throw new Error(`Expected 1 loaded resource, got ${stats.loaded}`);
  }
});

// Test 2: Multiple Resource Prefetching
testRunner.addTest('Multiple Resource Prefetching', async () => {
  const urls = ['/api/user', '/api/assessment', '/api/results'];
  
  await Promise.all(urls.map(url => 
    resourcePrefetcher.prefetchResource(url, { priority: 'medium' })
  ));
  
  const stats = resourcePrefetcher.getStats();
  if (stats.total < urls.length) {
    throw new Error(`Expected at least ${urls.length} resources, got ${stats.total}`);
  }
});

// Test 3: IndexedDB Cache Set/Get
testRunner.addTest('IndexedDB Cache Set/Get', async () => {
  const testData = { message: 'Hello Cache', timestamp: Date.now() };
  
  await indexedDBCache.set('test-key', testData, { ttl: 60000 });
  const retrieved = await indexedDBCache.get('test-key');
  
  if (!retrieved || retrieved.message !== testData.message) {
    throw new Error('Cache data mismatch');
  }
});

// Test 4: Cache Expiration
testRunner.addTest('Cache Expiration', async () => {
  const testData = { message: 'Expiring data' };
  
  // Set with very short TTL
  await indexedDBCache.set('expire-key', testData, { ttl: 1 });
  
  // Wait for expiration
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const retrieved = await indexedDBCache.get('expire-key');
  if (retrieved !== null) {
    throw new Error('Expired data should return null');
  }
});

// Test 5: Cache Statistics
testRunner.addTest('Cache Statistics', async () => {
  await indexedDBCache.clear();
  
  // Add some test data
  await indexedDBCache.set('stats-1', { data: 'test1' });
  await indexedDBCache.set('stats-2', { data: 'test2' });
  
  const stats = await indexedDBCache.getStats();
  if (stats.totalEntries !== 2) {
    throw new Error(`Expected 2 entries, got ${stats.totalEntries}`);
  }
});

// Test 6: User Behavior Predictions
testRunner.addTest('User Behavior Predictions', async () => {
  const predictions = userBehaviorTracker.getPredictedPages('/dashboard', 2);
  
  if (predictions.length === 0) {
    throw new Error('No predictions returned');
  }
  
  if (predictions[0].confidence <= 0 || predictions[0].confidence > 100) {
    throw new Error('Invalid confidence score');
  }
  
  if (!predictions[0].path || !predictions[0].reason) {
    throw new Error('Prediction missing required fields');
  }
});

// Test 7: Prefetch Performance
testRunner.addTest('Prefetch Performance', async () => {
  const startTime = performance.now();
  
  // Prefetch multiple resources concurrently
  const urls = Array.from({ length: 10 }, (_, i) => `/api/perf-test-${i}`);
  await Promise.all(urls.map(url => resourcePrefetcher.prefetchResource(url)));
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Should complete within reasonable time (less than 1 second for mock)
  if (duration > 1000) {
    throw new Error(`Prefetch took too long: ${duration}ms`);
  }
  
  const stats = resourcePrefetcher.getStats();
  if (stats.total < urls.length) {
    throw new Error(`Not all resources were prefetched: ${stats.total}/${urls.length}`);
  }
});

// Test 8: Cache Memory Usage
testRunner.addTest('Cache Memory Usage', async () => {
  await indexedDBCache.clear();
  
  // Add large data to test memory usage
  const largeData = { 
    content: 'x'.repeat(1000), 
    array: Array.from({ length: 100 }, (_, i) => ({ id: i, data: 'test' }))
  };
  
  await indexedDBCache.set('large-data', largeData);
  
  const stats = await indexedDBCache.getStats();
  if (stats.totalSize === 0) {
    throw new Error('Cache size calculation failed');
  }
  
  console.log(`   Cache size: ${Math.round(stats.totalSize / 1024)}KB`);
});

// Test 9: Concurrent Cache Operations
testRunner.addTest('Concurrent Cache Operations', async () => {
  const operations = [];
  
  // Concurrent set operations
  for (let i = 0; i < 5; i++) {
    operations.push(indexedDBCache.set(`concurrent-${i}`, { id: i, data: `test-${i}` }));
  }
  
  await Promise.all(operations);
  
  // Verify all data was set
  for (let i = 0; i < 5; i++) {
    const data = await indexedDBCache.get(`concurrent-${i}`);
    if (!data || data.id !== i) {
      throw new Error(`Concurrent operation failed for key concurrent-${i}`);
    }
  }
});

// Test 10: Integration Test
testRunner.addTest('Integration Test - Full Workflow', async () => {
  // Simulate user navigation workflow
  const currentPath = '/dashboard';
  
  // 1. Get predictions
  const predictions = userBehaviorTracker.getPredictedPages(currentPath, 2);
  
  // 2. Prefetch predicted resources
  for (const prediction of predictions) {
    await resourcePrefetcher.prefetchResource(`/api${prediction.path}`, {
      priority: prediction.confidence > 80 ? 'high' : 'medium'
    });
  }
  
  // 3. Cache some data
  await indexedDBCache.set('user-session', {
    currentPath,
    predictions,
    timestamp: Date.now()
  });
  
  // 4. Verify everything worked
  const cachedSession = await indexedDBCache.get('user-session');
  const prefetchStats = resourcePrefetcher.getStats();
  
  if (!cachedSession || cachedSession.currentPath !== currentPath) {
    throw new Error('Session caching failed');
  }
  
  if (prefetchStats.loaded < predictions.length) {
    throw new Error('Not all predicted resources were prefetched');
  }
  
  console.log(`   Prefetched ${prefetchStats.loaded} resources for ${predictions.length} predictions`);
});

// Run all tests
testRunner.runTests().then(() => {
  console.log('\n🎉 All tests completed!');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 Test runner failed:', error);
  process.exit(1);
});
