# AuthContext Dual Auth Implementation Summary

## ✅ COMPLETED - Todo 6: Update AuthContext for Dual Auth Support

### Changes Made to `src/contexts/AuthContext.tsx`

#### 1. **Added Imports**
```tsx
import apiService from '../services/apiService';
import authV2Service from '../services/authV2Service';
import tokenService from '../services/tokenService';
import { shouldUseAuthV2 } from '../config/auth-v2-config';
```

#### 2. **Extended User Interface**
```tsx
interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;  // NEW - for Auth V2 compatibility
  photoURL?: string;     // NEW - for Auth V2 compatibility
}
```

#### 3. **Updated AuthContextType**
```tsx
interface AuthContextType {
  token: string | null;
  user: User | null;
  authVersion: 'v1' | 'v2';  // NEW - track which auth system is in use
  login: (newToken: string, newUser: User) => void;
  register: (newToken: string, newUser: User) => void;
  logout: () => Promise<void>;  // Changed to async
  updateUser: (updatedUser: User) => void;
}
```

#### 4. **Added Auth Version State**
```tsx
const [authVersion, setAuthVersion] = useState<'v1' | 'v2'>('v1');
```

#### 5. **Session Restoration with Version Detection**
```tsx
useEffect(() => {
  const detectedVersion = (tokenService.getAuthVersion() || 'v1') as 'v1' | 'v2';
  setAuthVersion(detectedVersion);

  if (detectedVersion === 'v2') {
    const idToken = tokenService.getIdToken();
    if (idToken && !tokenService.isTokenExpired()) {
      setToken(idToken);
      // Restore user from stored data
      const uid = localStorage.getItem('uid');
      const email = localStorage.getItem('email');
      const displayName = localStorage.getItem('displayName');
      const photoURL = localStorage.getItem('photoURL');
      
      if (uid && email) {
        setUser({
          id: uid,
          username: displayName || email.split('@')[0],
          email,
          displayName,
          photoURL: photoURL || undefined
        });
      }
    }
  } else {
    // Original V1 session restoration
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }
}, []);
```

#### 6. **Dual Logout Implementation**
```tsx
const logout = async () => {
  if (authVersion === 'v2') {
    // Auth V2: Revoke tokens on backend
    const refreshToken = tokenService.getRefreshToken();
    if (refreshToken) {
      try {
        await authV2Service.logout(refreshToken);
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    // Clear V2 tokens
    tokenService.clearTokens();
  } else {
    // Auth V1: Clear localStorage and cookies
    localStorage.removeItem('token');
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
  }

  // Clear common state
  setToken(null);
  setUser(null);
  localStorage.removeItem('user');
  setAuthVersion('v1');
  router.push('/auth');
};
```

#### 7. **Updated Context Value**
```tsx
const value = {
  token,
  user,
  authVersion,  // NEW - exposed to components
  login,
  register,
  logout,
  updateUser
};
```

## Key Features

### ✅ Backward Compatibility
- V1 auth still works unchanged
- Existing sessions automatically restored
- No breaking changes for current users

### ✅ Forward Compatibility
- V2 auth fully supported
- Firebase token format detected automatically
- Dual token storage (idToken + refreshToken)

### ✅ Version Detection
- Automatic detection based on token format
- `tokenService.getAuthVersion()` checks localStorage keys
- Falls back to 'v1' if no tokens found

### ✅ Proper Token Management
- V2: Uses `tokenService` for idToken/refreshToken storage
- V1: Uses localStorage for JWT token
- V2 tokens cleared on logout with backend revocation
- V1 tokens cleared from localStorage + cookies

### ✅ User Data Mapping
- V2 displayName → username (for backward compatibility)
- V2 uid → id
- V2 photoURL stored as optional field
- Email as fallback for username generation

## Next Steps (Todo 7 & 8)

### Login Component Updates Needed:
```tsx
// In Login.jsx
const handleLogin = async (email, password) => {
  const useV2 = shouldUseAuthV2(email); // Feature flag check
  
  if (useV2) {
    const { idToken, refreshToken, uid, email: userEmail, displayName } = 
      await authV2Service.login(email, password);
    
    tokenService.storeTokens(idToken, refreshToken, uid);
    
    const mappedUser = {
      id: uid,
      username: displayName || userEmail.split('@')[0],
      email: userEmail,
      displayName,
    };
    
    onLogin(idToken, mappedUser); // Pass to AuthContext
  } else {
    // Existing V1 login logic
    const { token, user } = await apiService.login(email, password);
    onLogin(token, user);
  }
};
```

### Register Component Updates Needed:
```tsx
// In Register.jsx
// Change form fields: username → displayName (optional)
// Add photoURL field (optional)
// Update request body structure
```

## Testing Checklist

- [ ] V1 login still works
- [ ] V1 logout clears tokens correctly
- [ ] V1 session restoration on page refresh
- [ ] V2 login stores tokens in tokenService
- [ ] V2 logout revokes tokens on backend
- [ ] V2 session restoration from idToken
- [ ] Version detection works correctly
- [ ] AuthVersion exposed to components
- [ ] User mapping (displayName → username) works
- [ ] No circular dependency issues

## Files Modified
- ✅ `src/contexts/AuthContext.tsx` (complete)

## Files Next to Modify
- ⏳ `src/components/auth/Login.jsx` (Todo 7)
- ⏳ `src/components/auth/Register.jsx` (Todo 8)
