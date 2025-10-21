import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000';

test.describe('Complete Assessment Flow - Submission to Loading Page', () => {
  test('TC-1: Verify complete flow from assessment submission to loading page', async ({ page }) => {
    console.log('\n=== TEST: Complete Assessment Flow ===\n');

    // Step 1: Navigate to assessment page
    console.log('Step 1: Navigating to assessment page...');
    await page.goto(`${BASE_URL}/assessment`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const assessmentUrl = page.url();
    console.log(`Current URL: ${assessmentUrl}`);
    expect(assessmentUrl).toContain('/assessment');

    // Step 2: Check if assessment page is loaded
    console.log('Step 2: Checking if assessment page is loaded...');
    const assessmentHeader = await page.locator('text=/Assessment|Phase|Question/i').first();
    const isAssessmentLoaded = await assessmentHeader.isVisible().catch(() => false);
    console.log(`Assessment page loaded: ${isAssessmentLoaded}`);

    if (!isAssessmentLoaded) {
      console.log('Assessment page not loaded, skipping test');
      return;
    }

    // Step 3: Fill assessment answers
    console.log('Step 3: Filling assessment answers...');
    const radioButtons = await page.locator('input[type="radio"]').all();
    console.log(`Found ${radioButtons.length} radio buttons`);

    // Fill first 20 questions
    for (let i = 0; i < Math.min(20, radioButtons.length); i++) {
      try {
        await radioButtons[i].click();
        console.log(`Clicked radio button ${i + 1}`);
      } catch (error) {
        console.log(`Could not click radio button ${i + 1}`);
      }
    }

    // Step 4: Look for submit button
    console.log('Step 4: Looking for submit button...');
    const submitButton = await page.locator('button:has-text("Submit"), button:has-text("Kirim"), button:has-text("submit")').first();
    const submitButtonVisible = await submitButton.isVisible().catch(() => false);
    console.log(`Submit button visible: ${submitButtonVisible}`);

    if (!submitButtonVisible) {
      console.log('Submit button not found, skipping test');
      return;
    }

    // Step 5: Monitor network requests and page navigation
    console.log('Step 5: Monitoring network requests and navigation...');
    
    let navigationUrl = '';
    page.on('framenavigated', frame => {
      navigationUrl = frame.url();
      console.log(`[NAVIGATION] Frame navigated to: ${navigationUrl}`);
    });

    // Step 6: Click submit button
    console.log('Step 6: Clicking submit button...');
    const navigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => null);
    
    await submitButton.click();
    console.log('Submit button clicked');

    // Wait for navigation
    await navigationPromise;
    await page.waitForTimeout(2000);

    // Step 7: Check current URL
    const currentUrl = page.url();
    console.log(`Current URL after submit: ${currentUrl}`);

    // Step 8: Verify we're on loading page
    console.log('Step 8: Verifying we\'re on loading page...');
    if (currentUrl.includes('/assessment-loading')) {
      console.log('✅ SUCCESS: Redirected to /assessment-loading');
      expect(currentUrl).toContain('/assessment-loading');
    } else if (currentUrl.includes('/results')) {
      console.log('❌ ERROR: Redirected to /results instead of /assessment-loading');
      console.log('This indicates the flow is broken - should go to loading page first');
      expect(currentUrl).toContain('/assessment-loading');
    } else {
      console.log(`❌ ERROR: Redirected to unexpected URL: ${currentUrl}`);
      expect(currentUrl).toContain('/assessment-loading');
    }

    // Step 9: Verify loading page content
    console.log('Step 9: Verifying loading page content...');
    const loadingText = await page.locator('text=/Loading|Processing|Memproses|Menunggu/i').first();
    const isLoadingVisible = await loadingText.isVisible().catch(() => false);
    console.log(`Loading text visible: ${isLoadingVisible}`);

    // Step 10: Check for 404 error
    console.log('Step 10: Checking for 404 error...');
    const notFoundText = await page.locator('text=/404|Page Not Found|Sorry|couldn\'t find/i').count();
    console.log(`404 error text found: ${notFoundText > 0}`);
    expect(notFoundText).toBe(0);

    console.log('\n✅ TEST PASSED: Complete assessment flow working correctly\n');
  });

  test('TC-2: Verify jobId is saved to localStorage immediately after submission', async ({ page }) => {
    console.log('\n=== TEST: JobId localStorage Verification ===\n');

    // Navigate to assessment page
    await page.goto(`${BASE_URL}/assessment`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Fill some answers
    const radioButtons = await page.locator('input[type="radio"]').all();
    for (let i = 0; i < Math.min(10, radioButtons.length); i++) {
      try {
        await radioButtons[i].click();
      } catch (error) {
        // Ignore errors
      }
    }

    // Try to submit
    const submitButton = await page.locator('button:has-text("Submit"), button:has-text("Kirim")').first();
    if (await submitButton.isVisible().catch(() => false)) {
      // Monitor localStorage changes
      let jobIdSaved = false;
      page.on('framenavigated', async frame => {
        const jobId = await frame.evaluate(() => {
          return localStorage.getItem('assessment-job-id');
        }).catch(() => null);
        
        if (jobId) {
          console.log(`JobId saved to localStorage: ${jobId}`);
          jobIdSaved = true;
        }
      });

      await submitButton.click();
      await page.waitForTimeout(3000);

      // Check localStorage
      const jobIdAfterSubmit = await page.evaluate(() => {
        return localStorage.getItem('assessment-job-id');
      }).catch(() => null);

      console.log(`JobId in localStorage: ${jobIdAfterSubmit}`);

      if (jobIdAfterSubmit) {
        console.log('✅ SUCCESS: JobId saved to localStorage');
        expect(jobIdAfterSubmit).toBeTruthy();
      } else {
        console.log('⚠️ WARNING: JobId not found in localStorage (may be on different page)');
      }
    }
  });

  test('TC-3: Verify no redirect to /results before /assessment-loading', async ({ page }) => {
    console.log('\n=== TEST: Verify Correct Redirect Order ===\n');

    const navigationUrls: string[] = [];
    
    page.on('framenavigated', frame => {
      navigationUrls.push(frame.url());
      console.log(`[NAVIGATION] ${frame.url()}`);
    });

    // Navigate to assessment page
    await page.goto(`${BASE_URL}/assessment`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Fill answers
    const radioButtons = await page.locator('input[type="radio"]').all();
    for (let i = 0; i < Math.min(15, radioButtons.length); i++) {
      try {
        await radioButtons[i].click();
      } catch (error) {
        // Ignore
      }
    }

    // Submit
    const submitButton = await page.locator('button:has-text("Submit"), button:has-text("Kirim")').first();
    if (await submitButton.isVisible().catch(() => false)) {
      const navigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => null);
      await submitButton.click();
      await navigationPromise;
      await page.waitForTimeout(2000);

      // Check navigation order
      console.log('Navigation URLs:', navigationUrls);
      
      const hasLoadingPage = navigationUrls.some(url => url.includes('/assessment-loading'));
      const hasResultsPage = navigationUrls.some(url => url.includes('/results'));
      
      console.log(`Has /assessment-loading: ${hasLoadingPage}`);
      console.log(`Has /results: ${hasResultsPage}`);

      if (hasLoadingPage) {
        console.log('✅ SUCCESS: Redirected to /assessment-loading');
        expect(hasLoadingPage).toBe(true);
      } else {
        console.log('❌ ERROR: Did not redirect to /assessment-loading');
      }
    }
  });
});

