// Centralized token and user storage utilities
// Provides a single source of truth for auth-related localStorage access

const TOKEN_KEYS = ['token', 'auth_token', 'authToken'] as const;
const USER_KEYS = ['user', 'user_data'] as const;

export function getToken(): string | null {
  for (const key of TOKEN_KEYS) {
    const val = localStorage.getItem(key);
    if (val) return val;
  }
  return null;
}

export function setToken(token: string) {
  // Write to a primary key and keep legacy keys in sync
  localStorage.setItem('auth_token', token);
  for (const key of TOKEN_KEYS) {
    localStorage.setItem(key, token);
  }
}

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

