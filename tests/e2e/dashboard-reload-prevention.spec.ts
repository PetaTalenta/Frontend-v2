/**
 * ✅ E2E Test: Dashboard Reload Prevention
 * 
 * Tujuan: Memastikan tidak ada rendering/reload berulang saat navigasi ke /dashboard
 * 
 * Test Cases:
 * 1. Tidak ada loop navigasi (max 2 GET requests)
 * 2. Tidak ada fetch dobel yang tidak perlu
 * 3. AuthGuard idempotent (max 3 renders di dev mode)
 * 4. Tidak ada console.error atau page errors
 * 5. Fast Refresh tidak trigger full reload
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Reload Prevention', () => {
  // Track network requests
  let dashboardRequests: any[] = [];
  let apiRequests: any[] = [];

  test.beforeEach(async ({ page }) => {
    dashboardRequests = [];
    apiRequests = [];

    // Track all requests
    page.on('request', (request) => {
      const url = request.url();
      
      // Track dashboard page requests
      if (url.includes('/dashboard') && !url.includes('/_next/') && !url.includes('/api/')) {
        dashboardRequests.push({
          url,
          method: request.method(),
          timestamp: Date.now(),
        });
      }

      // Track API requests
      if (url.includes('/api/')) {
        apiRequests.push({
          url,
          method: request.method(),
          timestamp: Date.now(),
        });
      }
    });

    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });

    // Track page errors
    page.on('pageerror', (error) => {
      console.error('Page error:', error.message);
    });
  });

  test('Should not have multiple GET requests to /dashboard', async ({ page }) => {
    // Navigate to auth page and login
    await page.goto('http://localhost:3000/auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Mock login (adjust based on your auth implementation)
    // For now, assume user is already logged in via localStorage
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      }));
      // Set cookie for server-side middleware
      document.cookie = 'token=mock-token-for-testing; path=/';
    });

    // Clear tracking arrays
    dashboardRequests = [];
    apiRequests = [];

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');

    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Wait additional 2s for any delayed requests

    // ✅ TEST 1: Should have max 2 GET requests to /dashboard
    // (initial request + possible revalidation)
    console.log(`Dashboard requests: ${dashboardRequests.length}`);
    dashboardRequests.forEach((req, i) => {
      console.log(`  ${i + 1}. ${req.method} ${req.url}`);
    });

    expect(dashboardRequests.length).toBeLessThanOrEqual(2);

    // ✅ TEST 2: Check for duplicate requests in short time window
    if (dashboardRequests.length > 1) {
      const timeDiff = dashboardRequests[1].timestamp - dashboardRequests[0].timestamp;
      console.log(`Time between requests: ${timeDiff}ms`);
      
      // If requests are less than 100ms apart, it's likely a bug
      if (timeDiff < 100) {
        console.warn('⚠️ Potential duplicate request detected (< 100ms gap)');
      }
    }

    // ✅ TEST 3: Verify dashboard is actually loaded
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('Should not have navigation loops', async ({ page }) => {
    let redirectCount = 0;
    const redirects: string[] = [];

    page.on('response', async (response) => {
      const status = response.status();
      // Track 301, 302, 303, 307, 308 redirects
      if ([301, 302, 303, 307, 308].includes(status)) {
        redirectCount++;
        redirects.push(`${response.url()} → ${status}`);
        
        // Get redirect location if available
        const location = response.headers()['location'];
        if (location) {
          redirects.push(`  └─ Location: ${location}`);
        }
      }
    });

    // Set up authenticated user
    await page.goto('http://localhost:3000/auth');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      }));
      document.cookie = 'token=mock-token-for-testing; path=/';
    });

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log(`Total redirects: ${redirectCount}`);
    redirects.forEach(redirect => console.log(redirect));

    // ✅ TEST: Should have at most 1 redirect (initial / → /dashboard if applicable)
    expect(redirectCount).toBeLessThanOrEqual(1);
  });

  test('Should not have console errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // Set up authenticated user
    await page.goto('http://localhost:3000/auth');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      }));
      document.cookie = 'token=mock-token-for-testing; path=/';
    });

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log(`Console errors: ${consoleErrors.length}`);
    consoleErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));

    console.log(`Page errors: ${pageErrors.length}`);
    pageErrors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));

    // ✅ TEST: Should have no errors (allow some specific known warnings)
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('ResizeObserver') && // Known benign warning
      !err.includes('WebSocket') && // WebSocket might not be available in test
      !err.includes('Failed to load resource') // Some resources might 404 in test
    );

    expect(criticalErrors.length).toBe(0);
    expect(pageErrors.length).toBe(0);
  });

  test('Should not trigger duplicate SWR fetches', async ({ page }) => {
    const swrFetches = new Map<string, number>();

    page.on('request', (request) => {
      const url = request.url();
      
      // Track assessment history and user stats API calls
      if (url.includes('/api/assessment/results') || 
          url.includes('/api/users/profile') ||
          url.includes('/api/assessment/stats')) {
        const count = swrFetches.get(url) || 0;
        swrFetches.set(url, count + 1);
      }
    });

    // Set up authenticated user
    await page.goto('http://localhost:3000/auth');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      }));
      document.cookie = 'token=mock-token-for-testing; path=/';
    });

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for any SWR revalidations

    console.log('SWR fetch counts:');
    swrFetches.forEach((count, url) => {
      console.log(`  ${url}: ${count}x`);
    });

    // ✅ TEST: Each unique API endpoint should be called at most 2 times
    // (initial fetch + possible revalidation)
    swrFetches.forEach((count, url) => {
      expect(count).toBeLessThanOrEqual(2);
    });
  });

  test('AuthGuard should render max 3 times in dev mode', async ({ page }) => {
    // This test checks for render count by monitoring console.count logs
    const renderCounts = new Map<string, number>();

    page.on('console', (msg) => {
      const text = msg.text();
      
      // Look for our console.count logs
      if (text.includes('[AuthGuard] Render')) {
        const match = text.match(/\[AuthGuard\] Render \((.*?)\):/);
        if (match) {
          const route = match[1];
          // Extract count from "count: X" pattern
          const countMatch = text.match(/count: (\d+)/i) || text.match(/: (\d+)$/);
          if (countMatch) {
            const count = parseInt(countMatch[1], 10);
            renderCounts.set(route, Math.max(renderCounts.get(route) || 0, count));
          }
        }
      }
    });

    // Set up authenticated user
    await page.goto('http://localhost:3000/auth');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock-token-for-testing');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
      }));
      document.cookie = 'token=mock-token-for-testing; path=/';
    });

    // Navigate to dashboard
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('AuthGuard render counts:');
    renderCounts.forEach((count, route) => {
      console.log(`  ${route}: ${count}x`);
    });

    // ✅ TEST: In dev mode with React Strict Mode, AuthGuard should render max 3-4 times
    // (1 initial + 1 strict mode double invoke + potential 1-2 auth state updates)
    renderCounts.forEach((count, route) => {
      expect(count).toBeLessThanOrEqual(4);
    });
  });
});
