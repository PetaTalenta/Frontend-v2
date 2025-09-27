/**
 * API Health Check Utility
 * Tests connectivity to the real API and manages fallback logic
 */

const REAL_API_BASE_URL = 'https://api.futureguide.id';
const HEALTH_CHECK_TIMEOUT = 10000; // 10 seconds
const HEALTH_CHECK_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface HealthCheckResult {
  isAvailable: boolean;
  responseTime: number;
  error?: string;
  timestamp: number;
}

// Cache for health check results
let healthCheckCache: HealthCheckResult | null = null;

/**
 * Test if the real API is available and responding
 */
export async function checkApiHealth(): Promise<HealthCheckResult> {
  // Return cached result if still valid
  if (healthCheckCache && (Date.now() - healthCheckCache.timestamp) < HEALTH_CHECK_CACHE_DURATION) {
    console.log('API Health: Using cached result:', healthCheckCache.isAvailable ? 'Available' : 'Unavailable');
    return healthCheckCache;
  }

  const startTime = Date.now();
  
  try {
    console.log('API Health: Testing connectivity to', REAL_API_BASE_URL);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    const response = await fetch(`${REAL_API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Parse proxy response
    const proxyResult = await response.json();

    const result: HealthCheckResult = {
      isAvailable: proxyResult.success && response.ok,
      responseTime,
      timestamp: Date.now(),
    };

    if (!result.isAvailable) {
      result.error = proxyResult.error || `Health error: ${response.status} ${response.statusText}`;
    }

    healthCheckCache = result;
    console.log(`API Health: Real API is ${result.isAvailable ? 'available' : 'unavailable'} (${responseTime}ms)`);

    return result;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout';
      } else if (error.message.includes('fetch')) {
        errorMessage = 'Network error';
      } else {
        errorMessage = error.message;
      }
    }
    
    const result: HealthCheckResult = {
      isAvailable: false,
      responseTime,
      error: errorMessage,
      timestamp: Date.now(),
    };
    
    healthCheckCache = result;
    console.log(`API Health: Real API unavailable - ${errorMessage} (${responseTime}ms)`);
    
    return result;
  }
}

/**
 * Test the auth endpoint specifically
 */
async function testAuthEndpoint(): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);
    
    const response = await fetch(`${REAL_API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'health-check@test.com',
        password: 'invalid-password-for-health-check'
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    // Any response (even 400/401) means the API is available
    const result: HealthCheckResult = {
      isAvailable: response.status < 500,
      responseTime,
      timestamp: Date.now(),
    };
    
    if (!result.isAvailable) {
      result.error = `Server error: ${response.status} ${response.statusText}`;
    }
    
    console.log(`API Health: Auth endpoint test - ${result.isAvailable ? 'available' : 'unavailable'} (${responseTime}ms)`);
    return result;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      isAvailable: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

/**
 * Get the API base URL - always use proxy to avoid CORS
 */
export async function getApiBaseUrl(): Promise<string> {
  console.log('API Health: Using real API base URL:', REAL_API_BASE_URL);
  return REAL_API_BASE_URL;
}

/**
 * Check if we should use mock API (always false now)
 */
export async function shouldUseMockApi(): Promise<boolean> {
  return false; // Mock API has been removed
}

/**
 * Clear health check cache (useful for testing or manual refresh)
 */
export function clearHealthCheckCache(): void {
  healthCheckCache = null;
  console.log('API Health: Cache cleared');
}

/**
 * Get cached health status without making a new request
 */
export function getCachedHealthStatus(): HealthCheckResult | null {
  return healthCheckCache;
}
