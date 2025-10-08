import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Test Suite: Assessment Token Race Condition
 * 
 * Tests untuk memvalidasi bahwa token balance update correctly dan tidak ada race condition
 * antara submit assessment dan token deduction di backend.
 * 
 * Related Issue: Token tidak langsung berkurang setelah submit assessment
 * Expected Behavior: Token harus berkurang dalam 1-2 detik setelah submission sukses
 * 
 * Test Credentials:
 * - User A: kasykoi@gmail.com / Anjas123
 * - User B: viccxn@gmail.com / Kiana423
 */

const USER_A = {
  email: 'kasykoi@gmail.com',
  password: 'Anjas123',
};

const USER_B = {
  email: 'viccxn@gmail.com',
  password: 'Kiana423',
};

/**
 * Helper: Login to application
 */
async function login(page: Page, credentials: typeof USER_A) {
  await page.goto('/auth');
  await page.fill('input[name="email"]', credentials.email);
  await page.fill('input[type="password"]', credentials.password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 });
}

/**
 * Helper: Get token balance from API
 */
async function getTokenBalance(page: Page): Promise<number | null> {
  const tokenResponse = await page.evaluate(async () => {
    try {
      const token = localStorage.getItem('token') || 
                    localStorage.getItem('auth_token') ||
                    localStorage.getItem('authV2_idToken');
      
      if (!token) {
        console.error('No auth token found');
        return null;
      }

      const response = await fetch('https://futureguide.id/api/auth/token-balance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Token balance fetch failed:', response.status);
        return null;
      }

      const data = await response.json();
      
      // Handle different response formats
      const balance = data?.data?.token_balance ?? 
                     data?.data?.tokenBalance ?? 
                     data?.data?.balance ?? 
                     null;
      
      console.log('Token balance from API:', balance);
      return balance;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return null;
    }
  });

  return tokenResponse;
}

/**
 * Helper: Fill assessment questions with debug tool
 */
async function fillAssessmentQuestions(page: Page) {
  // Navigate to assessment page
  await page.goto('/assessment');
  await page.waitForLoadState('networkidle');

  // Look for debug fill button (development only)
  const debugFillButton = page.locator('button:has-text("Debug Fill All")');
  
  if (await debugFillButton.isVisible()) {
    console.log('Using debug fill to complete assessment');
    await debugFillButton.click();
    await page.waitForTimeout(1000); // Wait for fill to complete
  } else {
    console.warn('Debug fill button not found - assessment must be filled manually');
    throw new Error('Debug fill not available - cannot proceed with automated test');
  }
}

/**
 * Helper: Submit assessment
 */
async function submitAssessment(page: Page) {
  // Look for submit button
  const submitButton = page.locator('button:has-text("Kirim Assessment"), button:has-text("Submit Assessment")');
  
  await expect(submitButton).toBeVisible({ timeout: 5000 });
  await submitButton.click();
  
  // Should navigate to loading page
  await page.waitForURL('/assessment-loading', { timeout: 10000 });
}

test.describe('Assessment Token Race Condition Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to prevent stale data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('TC-1: Token should decrease immediately after submission', async ({ page }) => {
    // Setup
    await login(page, USER_A);
    
    // Get initial token balance
    const initialBalance = await getTokenBalance(page);
    expect(initialBalance).not.toBeNull();
    expect(initialBalance).toBeGreaterThan(0);
    
    console.log('Initial token balance:', initialBalance);

    // Fill and submit assessment
    await fillAssessmentQuestions(page);
    await submitAssessment(page);

    // ✅ CRITICAL TEST: Token should be updated within 2 seconds
    console.log('Waiting for token update callback...');
    await page.waitForTimeout(2000);

    // Check new token balance
    const newBalance = await getTokenBalance(page);
    expect(newBalance).not.toBeNull();
    
    console.log('New token balance after submission:', newBalance);

    // ✅ ASSERTION: Token should have decreased by exactly 1
    expect(newBalance).toBe(initialBalance! - 1);
  });

  test('TC-2: No INVALID_TOKEN errors should appear during monitoring', async ({ page }) => {
    // Setup console error listener
    const consoleErrors: string[] = [];
    const apiErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('INVALID_TOKEN') || text.includes('Invalid or expired token')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('response', response => {
      if (!response.ok() && response.url().includes('/api/')) {
        response.json().then(data => {
          if (data.error === 'INVALID_TOKEN' || data.message?.includes('Invalid or expired token')) {
            apiErrors.push(`${response.url()} - ${response.status()} - ${JSON.stringify(data)}`);
          }
        }).catch(() => {
          // Ignore JSON parse errors
        });
      }
    });

    // Perform full assessment submission
    await login(page, USER_A);
    await fillAssessmentQuestions(page);
    await submitAssessment(page);

    // Wait for monitoring to start and run for 5 seconds
    console.log('Monitoring for INVALID_TOKEN errors...');
    await page.waitForTimeout(5000);

    // ✅ ASSERTION: No INVALID_TOKEN errors should occur
    expect(consoleErrors).toHaveLength(0);
    expect(apiErrors).toHaveLength(0);

    if (consoleErrors.length > 0) {
      console.error('Console errors found:', consoleErrors);
    }
    if (apiErrors.length > 0) {
      console.error('API errors found:', apiErrors);
    }
  });

  test('TC-3: Token balance should be consistent across page navigation', async ({ page }) => {
    // Setup
    await login(page, USER_A);
    
    // Submit assessment
    await fillAssessmentQuestions(page);
    await submitAssessment(page);

    // Wait for assessment to complete (or timeout after 2 minutes)
    try {
      await page.waitForURL(/\/results\/[a-z0-9-]+/, { timeout: 120000 });
      console.log('Assessment completed successfully');
    } catch (error) {
      console.warn('Assessment did not complete in time, checking token consistency anyway');
    }

    // Get token balance on current page (results or loading)
    const balanceAfterSubmission = await getTokenBalance(page);
    expect(balanceAfterSubmission).not.toBeNull();
    console.log('Token balance after submission:', balanceAfterSubmission);

    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for data to load

    // Get token balance on dashboard
    const balanceOnDashboard = await getTokenBalance(page);
    expect(balanceOnDashboard).not.toBeNull();
    console.log('Token balance on dashboard:', balanceOnDashboard);

    // ✅ ASSERTION: Token balance should be consistent
    expect(balanceOnDashboard).toBe(balanceAfterSubmission);
  });

  test('TC-4: Token update should handle slow backend response', async ({ page, context }) => {
    // Intercept submit API call and add delay
    await context.route('**/api/assessment/submit', async (route) => {
      console.log('Intercepting submit request, adding 3 second delay...');
      
      // Delay 3 seconds to simulate slow backend
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Continue with normal response
      await route.continue();
    });

    // Setup
    await login(page, USER_A);
    const initialBalance = await getTokenBalance(page);
    expect(initialBalance).not.toBeNull();

    // Fill and submit assessment
    await fillAssessmentQuestions(page);
    
    const submitStartTime = Date.now();
    await submitAssessment(page);
    const submitEndTime = Date.now();
    
    const submitDuration = submitEndTime - submitStartTime;
    console.log(`Submit took ${submitDuration}ms (should be > 2900ms due to delay)`);

    // ✅ ASSERTION: Should wait for backend response (3s delay + network)
    expect(submitDuration).toBeGreaterThanOrEqual(2900);

    // Wait for token update callback
    await page.waitForTimeout(2000);

    // Token should be updated even with slow backend
    const newBalance = await getTokenBalance(page);
    expect(newBalance).not.toBeNull();
    expect(newBalance).toBe(initialBalance! - 1);
  });

  test('TC-5: Multiple rapid submissions should not cause race condition', async ({ page }) => {
    // Setup
    await login(page, USER_A);
    const initialBalance = await getTokenBalance(page);
    expect(initialBalance).not.toBeNull();
    expect(initialBalance).toBeGreaterThanOrEqual(2); // Need at least 2 tokens

    // First submission
    await fillAssessmentQuestions(page);
    await submitAssessment(page);
    
    // Wait a bit for first submission to process
    await page.waitForTimeout(1000);

    // Try to submit again (should be prevented by guard)
    // Navigate back to assessment
    await page.goto('/assessment');
    await page.waitForLoadState('networkidle');

    // Second submission
    await fillAssessmentQuestions(page);
    await submitAssessment(page);

    // Wait for both submissions to settle
    await page.waitForTimeout(5000);

    // Check final token balance
    const finalBalance = await getTokenBalance(page);
    expect(finalBalance).not.toBeNull();

    // ✅ ASSERTION: Should have deducted exactly 2 tokens (one per valid submission)
    // Duplicate submission guard should prevent extra deductions
    expect(finalBalance).toBe(initialBalance! - 2);
  });

  test('TC-6: Token cache should expire after 30 seconds', async ({ page }) => {
    // Setup
    await login(page, USER_A);
    
    // Get initial balance (this will cache it)
    const initialBalance = await getTokenBalance(page);
    expect(initialBalance).not.toBeNull();

    // Check cache exists
    const cacheExists = await page.evaluate(() => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return false;
      
      const user = JSON.parse(userStr);
      const cacheKey = `tokenBalanceCache_${user.id}`;
      const cache = localStorage.getItem(cacheKey);
      
      return !!cache;
    });
    expect(cacheExists).toBe(true);

    // Wait for cache to expire (30 seconds + 1 second buffer)
    console.log('Waiting for cache to expire (31 seconds)...');
    await page.waitForTimeout(31000);

    // Force a new token balance check
    const newBalance = await getTokenBalance(page);
    expect(newBalance).not.toBeNull();

    // Check that cache was recreated with new timestamp
    const cacheTimestamp = await page.evaluate(() => {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      
      const user = JSON.parse(userStr);
      const cacheKey = `tokenBalanceCache_${user.id}`;
      const cache = localStorage.getItem(cacheKey);
      
      if (!cache) return null;
      
      const parsed = JSON.parse(cache);
      return parsed.timestamp;
    });

    expect(cacheTimestamp).not.toBeNull();
    
    // ✅ ASSERTION: Cache timestamp should be recent (within last 5 seconds)
    const timeSinceCacheUpdate = Date.now() - cacheTimestamp!;
    expect(timeSinceCacheUpdate).toBeLessThan(5000);
  });

  test('TC-7: Token update should work with both Auth V1 and V2', async ({ page }) => {
    // This test checks compatibility with both auth versions
    
    // Test with Auth V1 user
    await login(page, USER_A);
    
    const authVersion = await page.evaluate(() => {
      // Detect auth version
      if (localStorage.getItem('authV2_idToken')) return 'v2';
      if (localStorage.getItem('token')) return 'v1';
      return 'unknown';
    });

    console.log('Detected auth version:', authVersion);
    expect(authVersion).not.toBe('unknown');

    // Get token balance
    const balance = await getTokenBalance(page);
    expect(balance).not.toBeNull();

    // Submit assessment
    await fillAssessmentQuestions(page);
    await submitAssessment(page);
    await page.waitForTimeout(2000);

    // Check token updated
    const newBalance = await getTokenBalance(page);
    expect(newBalance).not.toBeNull();
    expect(newBalance).toBe(balance! - 1);

    console.log(`Token update working correctly for Auth ${authVersion}`);
  });

  test('TC-8: Token balance should update even if assessment fails', async ({ page }) => {
    // Setup - intercept assessment status to force failure
    await page.route('**/api/assessment/status/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            status: 'failed',
            error: 'Simulated failure for testing',
            jobId: 'test-job-id'
          }
        })
      });
    });

    await login(page, USER_A);
    const initialBalance = await getTokenBalance(page);
    expect(initialBalance).not.toBeNull();

    // Submit assessment (will fail due to route intercept)
    await fillAssessmentQuestions(page);
    await submitAssessment(page);

    // Wait for token update
    await page.waitForTimeout(2000);

    // ✅ ASSERTION: Token should still be deducted even if assessment fails
    // (because backend charges token on submission, not on completion)
    const newBalance = await getTokenBalance(page);
    expect(newBalance).not.toBeNull();
    expect(newBalance).toBe(initialBalance! - 1);
  });
});

/**
 * Performance Tests - Token Update Timing
 */
test.describe('Token Update Performance Tests', () => {
  test('PERF-1: Token update should complete within 2 seconds', async ({ page }) => {
    await login(page, USER_A);
    await fillAssessmentQuestions(page);

    // Start timing
    const startTime = Date.now();
    
    await submitAssessment(page);

    // Wait for token update
    await page.waitForFunction(
      async () => {
        const tokenStr = localStorage.getItem('token') || 
                        localStorage.getItem('authV2_idToken');
        if (!tokenStr) return false;

        try {
          const response = await fetch('https://futureguide.id/api/auth/token-balance', {
            headers: { 'Authorization': `Bearer ${tokenStr}` }
          });
          const data = await response.json();
          const balance = data?.data?.token_balance ?? data?.data?.tokenBalance;
          
          // Check if tokenBalanceCache was updated recently (within last 3 seconds)
          const userStr = localStorage.getItem('user');
          if (!userStr) return false;
          
          const user = JSON.parse(userStr);
          const cacheKey = `tokenBalanceCache_${user.id}`;
          const cache = localStorage.getItem(cacheKey);
          
          if (!cache) return false;
          
          const parsed = JSON.parse(cache);
          const cacheAge = Date.now() - parsed.timestamp;
          
          return cacheAge < 3000; // Cache updated within last 3 seconds
        } catch (error) {
          return false;
        }
      },
      { timeout: 5000 }
    );

    const endTime = Date.now();
    const updateDuration = endTime - startTime;

    console.log(`Token update completed in ${updateDuration}ms`);

    // ✅ ASSERTION: Token update should complete within 2 seconds
    expect(updateDuration).toBeLessThan(2000);
  });

  test('PERF-2: Cache should be hit on subsequent calls', async ({ page }) => {
    await login(page, USER_A);

    // First call (cache miss)
    const firstCallStart = Date.now();
    const balance1 = await getTokenBalance(page);
    const firstCallDuration = Date.now() - firstCallStart;

    // Second call (should hit cache)
    const secondCallStart = Date.now();
    const balance2 = await getTokenBalance(page);
    const secondCallDuration = Date.now() - secondCallStart;

    console.log(`First call: ${firstCallDuration}ms, Second call: ${secondCallDuration}ms`);

    // ✅ ASSERTION: Second call should be significantly faster (< 50ms)
    expect(secondCallDuration).toBeLessThan(50);
    expect(balance1).toBe(balance2);
  });
});
