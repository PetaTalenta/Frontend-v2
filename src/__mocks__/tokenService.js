// Mock tokenService for testing
const tokenService = {
  storeTokens: jest.fn((tokenData) => {
    localStorage.setItem('idToken', tokenData.idToken);
    localStorage.setItem('refreshToken', tokenData.refreshToken);
    localStorage.setItem('uid', tokenData.uid);
    localStorage.setItem('email', tokenData.email);
    const expiryTime = Date.now() + tokenData.expiresIn * 1000;
    localStorage.setItem('tokenExpiry', expiryTime.toString());
  }),
  
  getIdToken: jest.fn(() => localStorage.getItem('idToken')),
  
  getRefreshToken: jest.fn(() => localStorage.getItem('refreshToken')),
  
  isTokenExpired: jest.fn(() => {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return true;
    const expiryTime = parseInt(expiry);
    const bufferTime = 5 * 60 * 1000; // 5 minutes
    return Date.now() >= expiryTime - bufferTime;
  }),
  
  refreshAuthToken: jest.fn(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    return 'new-id-token';
  }),
  
  clearTokens: jest.fn(() => {
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('uid');
    localStorage.removeItem('email');
    localStorage.removeItem('tokenExpiry');
  }),
  
  getAuthVersion: jest.fn(() => {
    const hasV2Tokens = localStorage.getItem('idToken') && localStorage.getItem('uid');
    return hasV2Tokens ? 'v2' : 'v1';
  }),
  
  getTokenStatus: jest.fn(() => {
    const hasTokens = !!localStorage.getItem('idToken');
    const isExpired = tokenService.isTokenExpired();
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    const needsRefresh = tokenExpiry ? parseInt(tokenExpiry) - Date.now() < 10 * 60 * 1000 : false;
    
    return {
      hasTokens,
      isExpired,
      needsRefresh,
    };
  }),
};

export default tokenService;
