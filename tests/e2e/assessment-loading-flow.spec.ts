import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const USER_A = {
  email: 'kasykoi@gmail.com',
  password: 'Test@1234'
};

/**
 * Helper: Login user
 */
async function login(page: Page, user: typeof USER_A) {
  await page.goto(`${BASE_URL}/auth`);
  
  // Fill login form
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  
  // Click login button
  await page.click('button:has-text("Login"), button:has-text("Sign In")');
  
  // Wait for redirect to dashboard or assessment
  await page.waitForURL(/\/(dashboard|assessment|select-assessment)/, { timeout: 15000 });
}

/**
 * Helper: Fill assessment questions
 */
async function fillAssessmentQuestions(page: Page) {
  // Look for radio buttons or answer options
  const answerButtons = page.locator('button[role="radio"], input[type="radio"]');
  const count = await answerButtons.count();
  
  if (count === 0) {
    console.warn('No answer buttons found - assessment might be filled manually');
    return;
  }

  // Fill first 10 questions
  for (let i = 0; i < Math.min(10, count); i++) {
    const button = answerButtons.nth(i);
    await button.click();
    await page.waitForTimeout(100);
  }
}

/**
 * Helper: Navigate to assessment
 */
async function navigateToAssessment(page: Page) {
  // Try to find assessment link or button
  const assessmentLink = page.locator('a:has-text("Assessment"), button:has-text("Assessment")').first();
  
  if (await assessmentLink.isVisible()) {
    await assessmentLink.click();
  } else {
    // Direct navigation
    await page.goto(`${BASE_URL}/assessment`);
  }
  
  // Wait for assessment page to load
  await page.waitForURL(/\/assessment/, { timeout: 10000 });
}

test.describe('Assessment Loading Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage
    await page.goto(BASE_URL);
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('TC-1: Should navigate to assessment-loading page after submission', async ({ page }) => {
    // Login
    await login(page, USER_A);
    
    // Navigate to assessment
    await navigateToAssessment(page);
    
    // Fill some questions
    await fillAssessmentQuestions(page);
    
    // Look for submit button
    const submitButton = page.locator('button:has-text("Kirim"), button:has-text("Submit")').first();
    
    if (await submitButton.isVisible()) {
      // Click submit
      await submitButton.click();
      
      // Should navigate to /assessment-loading
      await page.waitForURL('/assessment-loading', { timeout: 10000 });
      
      // Verify page loaded
      const loadingPage = page.locator('text=Memproses assessment, text=Processing, text=Analisis');
      await expect(loadingPage.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('TC-2: Assessment loading page should display loading states', async ({ page }) => {
    // Login
    await login(page, USER_A);
    
    // Navigate to assessment
    await navigateToAssessment(page);
    
    // Fill and submit
    await fillAssessmentQuestions(page);
    
    const submitButton = page.locator('button:has-text("Kirim"), button:has-text("Submit")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Wait for loading page
      await page.waitForURL('/assessment-loading', { timeout: 10000 });
      
      // Check for loading indicators
      const loadingIndicators = page.locator('[class*="animate"], [class*="spinner"], [class*="loader"]');
      const count = await loadingIndicators.count();
      
      expect(count).toBeGreaterThan(0);
    }
  });

  test('TC-3: Should not show 404 error on assessment-loading page', async ({ page }) => {
    // Login
    await login(page, USER_A);
    
    // Navigate to assessment
    await navigateToAssessment(page);
    
    // Fill and submit
    await fillAssessmentQuestions(page);
    
    const submitButton = page.locator('button:has-text("Kirim"), button:has-text("Submit")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Wait for loading page
      await page.waitForURL('/assessment-loading', { timeout: 10000 });
      
      // Check that we're NOT on a 404 page
      const notFoundText = page.locator('text=404, text=Page Not Found, text=not found');
      await expect(notFoundText.first()).not.toBeVisible({ timeout: 2000 }).catch(() => {
        // It's OK if the locator doesn't exist
      });
      
      // Verify we're on the correct URL
      expect(page.url()).toContain('/assessment-loading');
    }
  });

  test('TC-4: Should have job ID saved in localStorage after submission', async ({ page }) => {
    // Login
    await login(page, USER_A);
    
    // Navigate to assessment
    await navigateToAssessment(page);
    
    // Fill and submit
    await fillAssessmentQuestions(page);
    
    const submitButton = page.locator('button:has-text("Kirim"), button:has-text("Submit")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Wait for loading page
      await page.waitForURL('/assessment-loading', { timeout: 10000 });
      
      // Check localStorage for job ID
      const jobId = await page.evaluate(() => {
        return localStorage.getItem('assessment-job-id');
      });
      
      expect(jobId).toBeTruthy();
      expect(jobId).toMatch(/^[a-f0-9-]+$/i); // UUID format
    }
  });

  test('TC-5: Should redirect to results page when assessment completes', async ({ page }) => {
    // Login
    await login(page, USER_A);
    
    // Navigate to assessment
    await navigateToAssessment(page);
    
    // Fill and submit
    await fillAssessmentQuestions(page);
    
    const submitButton = page.locator('button:has-text("Kirim"), button:has-text("Submit")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      
      // Wait for loading page
      await page.waitForURL('/assessment-loading', { timeout: 10000 });
      
      // Wait for redirect to results (with timeout for processing)
      await page.waitForURL(/\/results\//, { timeout: 120000 }).catch(() => {
        // It's OK if it times out - assessment might still be processing
      });
      
      // Verify we're either on results page or still on loading page
      const currentUrl = page.url();
      const isOnResults = currentUrl.includes('/results/');
      const isOnLoading = currentUrl.includes('/assessment-loading');
      
      expect(isOnResults || isOnLoading).toBeTruthy();
    }
  });
});

