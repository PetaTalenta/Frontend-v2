/**
 * Debug utilities for token balance issues
 */

export interface TokenBalanceDebugInfo {
  endpoint: string;
  method: string;
  headers: Record<string, string>;
  response?: any;
  error?: string;
  status?: number;
  timestamp: string;
}

export interface DebugSession {
  sessionId: string;
  startTime: string;
  tests: TokenBalanceDebugInfo[];
  summary: {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    recommendations: string[];
  };
}

/**
 * Test token balance endpoint directly
 */
export async function testTokenBalanceEndpoint(
  endpoint: string, 
  token: string,
  description: string = ''
): Promise<TokenBalanceDebugInfo> {
  const debugInfo: TokenBalanceDebugInfo = {
    endpoint,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    timestamp: new Date().toISOString()
  };

  try {
    console.log(`[DEBUG] Testing ${description || endpoint}...`);
    
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: debugInfo.headers
    });

    debugInfo.status = response.status;
    debugInfo.response = await response.json();

    console.log(`[DEBUG] ${description || endpoint} - Status: ${response.status}`, debugInfo.response);

    return debugInfo;
  } catch (error) {
    debugInfo.error = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[DEBUG] ${description || endpoint} - Error:`, error);
    return debugInfo;
  }
}

/**
 * Test all token balance endpoints
 */
export async function testAllTokenBalanceEndpoints(token: string): Promise<DebugSession> {
  const sessionId = `debug-${Date.now()}`;
  const session: DebugSession = {
    sessionId,
    startTime: new Date().toISOString(),
    tests: [],
    summary: {
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      recommendations: []
    }
  };

  console.log(`[DEBUG] Starting token balance debug session: ${sessionId}`);

  // Test endpoints (Mock API removed)
  const endpoints = [
    { url: '/api/proxy/auth/token-balance', description: 'Proxy API' },
    { url: 'https://api.chhrone.web.id/api/auth/token-balance', description: 'Real API Direct' }
  ];

  for (const endpoint of endpoints) {
    const result = await testTokenBalanceEndpoint(endpoint.url, token, endpoint.description);
    session.tests.push(result);
  }

  // Generate summary
  session.summary.totalTests = session.tests.length;
  session.summary.successfulTests = session.tests.filter(t => t.status === 200).length;
  session.summary.failedTests = session.tests.filter(t => t.status !== 200 || t.error).length;

  // Generate recommendations
  session.summary.recommendations = generateRecommendations(session.tests);

  console.log(`[DEBUG] Debug session completed:`, session.summary);
  return session;
}

/**
 * Generate recommendations based on test results
 */
function generateRecommendations(tests: TokenBalanceDebugInfo[]): string[] {
  const recommendations: string[] = [];

  const proxyApiTest = tests.find(t => t.endpoint.includes('/api/proxy/auth/token-balance'));
  const realApiTest = tests.find(t => t.endpoint.includes('https://api.chhrone.web.id'));

  // Check proxy API
  if (proxyApiTest?.status === 200) {
    recommendations.push('✅ Proxy API is working correctly');
  } else if (proxyApiTest?.status === 401) {
    recommendations.push('❌ Proxy API authentication failed - check token validity');
  } else if (proxyApiTest?.error) {
    recommendations.push('❌ Proxy API failed - check proxy configuration');
  }

  // Check real API
  if (realApiTest?.status === 200) {
    recommendations.push('✅ Real API is accessible and working');
  } else if (realApiTest?.status === 401) {
    recommendations.push('❌ Real API authentication failed - token may be invalid or expired');
  } else if (realApiTest?.error) {
    recommendations.push('❌ Real API not accessible - check network connection');
  }

  // Token balance specific checks
  const successfulTests = tests.filter(t => t.status === 200);
  if (successfulTests.length > 0) {
    const tokenBalances = successfulTests.map(t => {
      const balance = t.response?.data?.tokenBalance;
      return { endpoint: t.endpoint, balance };
    });

    const uniqueBalances = [...new Set(tokenBalances.map(tb => tb.balance))];
    
    if (uniqueBalances.length === 1) {
      recommendations.push(`✅ Consistent token balance across all APIs: ${uniqueBalances[0]}`);
    } else {
      recommendations.push('⚠️ Inconsistent token balance between APIs - database sync issue?');
      tokenBalances.forEach(tb => {
        recommendations.push(`  - ${tb.endpoint}: ${tb.balance} tokens`);
      });
    }
  }

  // General recommendations
  if (tests.every(t => t.status !== 200)) {
    recommendations.push('🔧 All APIs failed - check authentication token and network connection');
  }

  if (tests.some(t => t.status === 200) && tests.some(t => t.status !== 200)) {
    recommendations.push('🔧 Mixed results - some APIs working, others failing');
  }

  return recommendations;
}

/**
 * Validate token format
 */
export function validateTokenFormat(token: string): {
  isValid: boolean;
  issues: string[];
  tokenInfo: {
    length: number;
    prefix: string;
    hasBearer: boolean;
    format: 'jwt' | 'unknown';
  };
} {
  const issues: string[] = [];
  
  if (!token) {
    issues.push('Token is empty or null');
    return {
      isValid: false,
      issues,
      tokenInfo: {
        length: 0,
        prefix: '',
        hasBearer: false,
        format: 'unknown'
      }
    };
  }

  const hasBearer = token.startsWith('Bearer ');
  const actualToken = hasBearer ? token.substring(7) : token;
  
  let format: 'jwt' | 'unknown' = 'unknown';
  
  // Check if it's a JWT (has 3 parts separated by dots)
  if (actualToken.split('.').length === 3) {
    format = 'jwt';
  }

  if (actualToken.length < 10) {
    issues.push('Token is too short');
  }

  if (format === 'unknown') {
    issues.push('Token format not recognized (not JWT)');
  }

  return {
    isValid: issues.length === 0,
    issues,
    tokenInfo: {
      length: actualToken.length,
      prefix: actualToken.substring(0, 20) + '...',
      hasBearer,
      format
    }
  };
}

/**
 * Check localStorage and context consistency
 */
export function checkTokenConsistency(): {
  isConsistent: boolean;
  issues: string[];
  tokens: {
    localStorage: string | null;
    contextAvailable: boolean;
  };
} {
  const issues: string[] = [];
  const localStorageToken = localStorage.getItem('token');
  
  // Note: We can't access React context from here, so we'll just check localStorage
  const tokens = {
    localStorage: localStorageToken,
    contextAvailable: false // This would need to be checked from React component
  };

  if (!localStorageToken) {
    issues.push('No token found in localStorage');
  }

  return {
    isConsistent: issues.length === 0,
    issues,
    tokens
  };
}

/**
 * Export debug session to JSON for sharing
 */
export function exportDebugSession(session: DebugSession): string {
  return JSON.stringify(session, null, 2);
}

/**
 * Quick diagnostic function
 */
export async function quickDiagnostic(): Promise<{
  status: 'healthy' | 'issues' | 'critical';
  summary: string;
  details: any;
}> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return {
      status: 'critical',
      summary: 'No authentication token found',
      details: { issue: 'User not logged in or token expired' }
    };
  }

  const tokenValidation = validateTokenFormat(token);
  if (!tokenValidation.isValid) {
    return {
      status: 'critical',
      summary: 'Invalid token format',
      details: tokenValidation
    };
  }

  try {
    const session = await testAllTokenBalanceEndpoints(token);
    
    if (session.summary.successfulTests === 0) {
      return {
        status: 'critical',
        summary: 'All token balance APIs failed',
        details: session
      };
    } else if (session.summary.failedTests > 0) {
      return {
        status: 'issues',
        summary: `${session.summary.successfulTests}/${session.summary.totalTests} APIs working`,
        details: session
      };
    } else {
      return {
        status: 'healthy',
        summary: 'All token balance APIs working correctly',
        details: session
      };
    }
  } catch (error) {
    return {
      status: 'critical',
      summary: 'Diagnostic failed',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    };
  }
}
