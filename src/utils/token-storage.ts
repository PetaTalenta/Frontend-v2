// Centralized token and user storage utilities
// Provides a single source of truth for auth-related localStorage access
//
// ⚠️ DEPRECATED: Use tokenService instead for Auth V2 compatibility
// This file is kept for backward compatibility only

const TOKEN_KEYS = ['authV2_idToken', 'token', 'auth_token', 'authToken'] as const;
const USER_KEYS = ['user', 'user_data'] as const;

/**
 * Get token from localStorage
 * ✅ UPDATED: Now checks Auth V2 key first
 * @deprecated Use tokenService.getIdToken() instead
 */
export function getToken(): string | null {
  for (const key of TOKEN_KEYS) {
    const val = localStorage.getItem(key);
    if (val) return val;
  }
  return null;
}

/**
 * Set token to localStorage
 * ✅ UPDATED: Now syncs to Auth V2 key as well
 * @deprecated Use tokenService.storeTokens() instead
 */
export function setToken(token: string) {
  // Write to Auth V2 key (primary)
  localStorage.setItem('authV2_idToken', token);

  // Also write to legacy keys for backward compatibility
  localStorage.setItem('auth_token', token);
  for (const key of TOKEN_KEYS) {
    if (key !== 'authV2_idToken') {
      localStorage.setItem(key, token);
    }
  }
}

/**
 * Clear token from localStorage
 * ✅ UPDATED: Now clears Auth V2 key as well
 * @deprecated Use tokenService.clearTokens() instead
 */
export function clearToken() {
  for (const key of TOKEN_KEYS) {
    localStorage.removeItem(key);
  }
}

export function getUser<T = any>(): T | null {
  for (const key of USER_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        return JSON.parse(raw) as T;
      } catch {
        // ignore parse errors and continue
      }
    }
  }
  return null;
}

export function setUser(user: any) {
  const raw = JSON.stringify(user);
  localStorage.setItem('user', raw);
  localStorage.setItem('user_data', raw);
}

export function clearUser() {
  for (const key of USER_KEYS) {
    localStorage.removeItem(key);
  }
}

export function clearAuth() {
  clearToken();
  clearUser();
}

