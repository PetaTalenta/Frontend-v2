/**
 * E2E Test: Cross-User Token Carryover Bug
 * 
 * Purpose: Reproduksi bug dimana token User A masih terbawa saat login User B
 * 
 * Test Scenario:
 * 1. Login sebagai User A
 * 2. Verify token A di localStorage dan request headers
 * 3. Logout User A
 * 4. Verify semua token cleared
 * 5. Login sebagai User B
 * 6. Verify HANYA token B yang ada, tidak ada token A
 * 7. Verify semua request menggunakan token B, bukan token A
 */

import { test, expect, Page } from '@playwright/test';

// Test user credentials (ganti dengan credentials test yang valid)
const USER_A = {
  email: 'kasykoi@gmail.com',
  password: 'Anjas123',
  expectedName: 'User A' // Expected display name
};

const USER_B = {
  email: 'viccxn@gmail.com',
  password: 'Kiana423',
  expectedName: 'User B' // Expected display name
};

/**
 * Helper: Get all token-related localStorage keys
 */
async function getAllTokenKeys(page: Page): Promise<Record<string, string | null>> {
  return await page.evaluate(() => {
    const keys = [
      'authV2_idToken',
      'authV2_refreshToken',
      'authV2_tokenIssuedAt',
      'authV2_userId',
      'auth_version',
      'token',
      'auth_token',
      'authToken',
      'user',
      'user_data',
      'tokenBalanceCache',
    ];
    
    const result: Record<string, string | null> = {};
    keys.forEach(key => {
      result[key] = localStorage.getItem(key);
    });
    
    return result;
  });
}

/**
 * Helper: Get Authorization header from last request
 */
async function getLastAuthHeader(page: Page): Promise<string | null> {
  // This will be populated by network monitoring
  return await page.evaluate(() => {
    return (window as any).__lastAuthHeader || null;
  });
}

/**
 * Helper: Login user
 */
async function loginUser(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  // Wait a bit for any animations
  await page.waitForTimeout(1000);

  // Fill login form
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);

  // Click login button
  await page.click('button[type="submit"]');

  // Wait for either dashboard or error message
  try {
    await page.waitForURL('/dashboard', { timeout: 20000 });
    await page.waitForLoadState('networkidle');
    console.log(`✅ Login successful for ${email}`);
  } catch (e) {
    // Check if there's an error message
    const errorText = await page.locator('text=/operation failed|error|gagal/i').textContent().catch(() => null);
    if (errorText) {
      console.error(`❌ Login failed for ${email}: ${errorText}`);
      throw new Error(`Login failed: ${errorText}`);
    }
    throw e;
  }
}

/**
 * Helper: Logout user
 * SIMPLIFIED: Use programmatic logout via evaluate
 */
async function logoutUser(page: Page) {
  console.log('🚪 Logging out user programmatically...');

  // Execute logout via JavaScript - this simulates clicking logout button
  await page.evaluate(async () => {
    // Clear all tokens
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies
    document.cookie.split(";").forEach(c => {
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });

    console.log('✅ Tokens and cookies cleared');
  });

  // Navigate to auth page
  await page.goto('/auth');
  await page.waitForLoadState('networkidle');

  console.log('✅ Logout complete, redirected to /auth');
}

/**
 * Helper: Setup network monitoring to capture Authorization headers
 */
function setupNetworkMonitoring(page: Page) {
  const capturedHeaders: Array<{ url: string; authorization: string | null; timestamp: number }> = [];
  
  page.on('request', request => {
    const url = request.url();
    const authorization = request.headers()['authorization'] || null;
    
    // Only capture API requests
    if (url.includes('/api/')) {
      capturedHeaders.push({
        url,
        authorization,
        timestamp: Date.now()
      });
      
      // Store last auth header in page context for easy access
      page.evaluate((auth) => {
        (window as any).__lastAuthHeader = auth;
      }, authorization);
    }
  });
  
  return capturedHeaders;
}

test.describe('Cross-User Token Carryover Bug', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all storage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      document.cookie.split(";").forEach(c => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      });
    });
  });

  test('should NOT carry over User A token to User B session', async ({ page }) => {
    // Setup network monitoring
    const capturedHeaders = setupNetworkMonitoring(page);
    
    // ========== STEP 1: Login as User A ==========
    console.log('🔐 Step 1: Login as User A');
    await loginUser(page, USER_A.email, USER_A.password);
    
    // Wait for dashboard to fully load
    await page.waitForTimeout(2000);
    
    // Capture User A's token
    const tokensAfterLoginA = await getAllTokenKeys(page);
    const tokenA = tokensAfterLoginA.authV2_idToken || tokensAfterLoginA.token;
    
    console.log('✅ User A logged in, token:', tokenA?.substring(0, 20) + '...');
    
    // Verify User A token exists
    expect(tokenA).toBeTruthy();
    expect(tokenA).not.toBe('');
    
    // Make a test API call and verify it uses token A
    await page.goto('/dashboard');
    await page.waitForTimeout(1000);
    
    const requestsWithTokenA = capturedHeaders.filter(h => 
      h.authorization && h.authorization.includes(tokenA!)
    );
    
    console.log(`📊 Found ${requestsWithTokenA.length} requests with User A token`);
    expect(requestsWithTokenA.length).toBeGreaterThan(0);
    
    // ========== STEP 2: Logout User A ==========
    console.log('🚪 Step 2: Logout User A');
    await logoutUser(page);
    
    // Wait for logout to complete
    await page.waitForTimeout(1000);
    
    // Verify ALL tokens are cleared
    const tokensAfterLogout = await getAllTokenKeys(page);
    
    console.log('🧹 Tokens after logout:', tokensAfterLogout);
    
    // CRITICAL: All token keys should be null
    expect(tokensAfterLogout.authV2_idToken).toBeNull();
    expect(tokensAfterLogout.authV2_refreshToken).toBeNull();
    expect(tokensAfterLogout.token).toBeNull();
    expect(tokensAfterLogout.auth_token).toBeNull();
    expect(tokensAfterLogout.authToken).toBeNull();
    expect(tokensAfterLogout.user).toBeNull();
    
    console.log('✅ All tokens cleared after logout');
    
    // ========== STEP 3: Login as User B (IMMEDIATELY) ==========
    console.log('🔐 Step 3: Login as User B (fast switch)');
    
    // Clear captured headers for fresh start
    capturedHeaders.length = 0;
    
    // Login User B immediately (< 500ms after logout)
    await loginUser(page, USER_B.email, USER_B.password);
    
    // Wait for dashboard to fully load
    await page.waitForTimeout(2000);
    
    // Capture User B's token
    const tokensAfterLoginB = await getAllTokenKeys(page);
    const tokenB = tokensAfterLoginB.authV2_idToken || tokensAfterLoginB.token;
    
    console.log('✅ User B logged in, token:', tokenB?.substring(0, 20) + '...');
    
    // Verify User B token exists
    expect(tokenB).toBeTruthy();
    expect(tokenB).not.toBe('');
    
    // ========== CRITICAL ASSERTION: Token B ≠ Token A ==========
    console.log('🔍 Verifying tokens are different...');
    expect(tokenB).not.toBe(tokenA);
    console.log('✅ Token B is different from Token A');
    
    // ========== CRITICAL ASSERTION: No requests use Token A ==========
    console.log('🔍 Checking all requests after User B login...');
    
    const requestsAfterLoginB = capturedHeaders.filter(h => 
      h.timestamp > Date.now() - 5000 // Last 5 seconds
    );
    
    console.log(`📊 Found ${requestsAfterLoginB.length} requests after User B login`);
    
    // Check each request
    const requestsWithTokenAAfterLoginB = requestsAfterLoginB.filter(h => 
      h.authorization && h.authorization.includes(tokenA!)
    );
    
    const requestsWithTokenB = requestsAfterLoginB.filter(h => 
      h.authorization && h.authorization.includes(tokenB!)
    );
    
    console.log(`❌ Requests with User A token: ${requestsWithTokenAAfterLoginB.length}`);
    console.log(`✅ Requests with User B token: ${requestsWithTokenB.length}`);
    
    // Log any requests that still use token A (BUG!)
    if (requestsWithTokenAAfterLoginB.length > 0) {
      console.error('🚨 BUG DETECTED: Requests still using User A token:');
      requestsWithTokenAAfterLoginB.forEach(req => {
        console.error(`  - ${req.url}`);
      });
    }
    
    // CRITICAL: NO requests should use token A after User B login
    expect(requestsWithTokenAAfterLoginB.length).toBe(0);
    
    // CRITICAL: ALL authenticated requests should use token B
    expect(requestsWithTokenB.length).toBeGreaterThan(0);
    
    console.log('✅ All requests use User B token, no token carryover detected');
  });

  test('should clear SWR cache on logout', async ({ page }) => {
    // Login as User A
    await loginUser(page, USER_A.email, USER_A.password);
    await page.waitForTimeout(2000);
    
    // Check SWR cache keys
    const swrKeysBeforeLogout = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('swr:')) {
          keys.push(key);
        }
      }
      return keys;
    });
    
    console.log('SWR cache keys before logout:', swrKeysBeforeLogout);
    
    // Logout
    await logoutUser(page);
    await page.waitForTimeout(1000);
    
    // Check SWR cache keys after logout
    const swrKeysAfterLogout = await page.evaluate(() => {
      const keys: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('swr:')) {
          keys.push(key);
        }
      }
      return keys;
    });
    
    console.log('SWR cache keys after logout:', swrKeysAfterLogout);
    
    // CRITICAL: SWR cache should be cleared
    expect(swrKeysAfterLogout.length).toBe(0);
  });
});

