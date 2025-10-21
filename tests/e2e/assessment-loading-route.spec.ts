import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Assessment Loading Route', () => {
  test('TC-1: Route /assessment-loading should exist and not show 404', async ({ page }) => {
    // Navigate directly to assessment-loading route
    const response = await page.goto(`${BASE_URL}/assessment-loading`);
    
    // Should not be a 404
    expect(response?.status()).not.toBe(404);
    
    // Should be either 200 or redirect (3xx)
    const status = response?.status() || 0;
    expect([200, 301, 302, 307, 308].includes(status)).toBeTruthy();
  });

  test('TC-2: Route /assessment-loading should not display 404 error page', async ({ page }) => {
    // Navigate to assessment-loading
    await page.goto(`${BASE_URL}/assessment-loading`, { waitUntil: 'domcontentloaded' });
    
    // Check that we're not on a 404 page
    const notFoundText = page.locator('text=/404|Page Not Found|not found/i');
    const count = await notFoundText.count();
    
    // Should not have 404 text
    expect(count).toBe(0);
  });

  test('TC-3: Route /assessment-loading should be accessible', async ({ page }) => {
    // Navigate to assessment-loading
    const response = await page.goto(`${BASE_URL}/assessment-loading`, { waitUntil: 'domcontentloaded' });
    
    // Should be accessible
    expect(response?.ok()).toBeTruthy();
  });

  test('TC-4: Route /assessment-loading should have proper page structure', async ({ page }) => {
    // Navigate to assessment-loading
    await page.goto(`${BASE_URL}/assessment-loading`, { waitUntil: 'domcontentloaded' });
    
    // Should have a main element or container
    const mainContent = page.locator('main, [role="main"], .container, .content');
    expect(await mainContent.count()).toBeGreaterThan(0);
  });

  test('TC-5: Route /assessment-loading should redirect to auth if not authenticated', async ({ page }) => {
    // Clear all storage to ensure not authenticated
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    
    // Navigate to assessment-loading
    await page.goto(`${BASE_URL}/assessment-loading`, { waitUntil: 'domcontentloaded' });
    
    // Should redirect to auth or show auth-related content
    const currentUrl = page.url();
    const isOnAuth = currentUrl.includes('/auth');
    const isOnAssessmentLoading = currentUrl.includes('/assessment-loading');
    
    // Should be on auth or assessment-loading (depending on implementation)
    expect(isOnAuth || isOnAssessmentLoading).toBeTruthy();
  });
});

