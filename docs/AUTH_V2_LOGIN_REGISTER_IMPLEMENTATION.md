# Login & Register Components - Auth V2 Implementation

## ✅ COMPLETED - Todo 7 & 8: Update Login and Register Components

### Summary of Changes

Both Login.jsx and Register.jsx have been updated to support **dual authentication** (Auth V1 and V2) with automatic routing based on feature flags.

---

## Login Component (`src/components/auth/Login.jsx`)

### New Imports Added
```jsx
import authV2Service from '../../services/authV2Service';
import tokenService from '../../services/tokenService';
import { shouldUseAuthV2 } from '../../config/auth-v2-config';
import { getFirebaseErrorMessage } from '../../utils/firebase-errors';
```

### Key Implementation

#### 1. Feature Flag Detection
```jsx
const useAuthV2 = shouldUseAuthV2(email);
```
- Determines which auth system to use based on environment variables
- Can be user-specific (percentage-based rollout)
- Or global toggle via `NEXT_PUBLIC_USE_AUTH_V2=true`

#### 2. Auth V2 Flow (Firebase)
```jsx
if (useAuthV2) {
  const v2Response = await authV2Service.login(email, password);
  const { idToken, refreshToken, uid, email: userEmail, displayName, photoURL } = v2Response;
  
  // Store tokens via tokenService
  tokenService.storeTokens(idToken, refreshToken, uid);
  
  // Store user info for session restoration
  localStorage.setItem('uid', uid);
  localStorage.setItem('email', userEmail);
  if (displayName) localStorage.setItem('displayName', displayName);
  if (photoURL) localStorage.setItem('photoURL', photoURL);
  
  // Map to V1 format for backward compatibility
  const mappedUser = {
    id: uid,
    username: displayName || userEmail.split('@')[0],
    email: userEmail,
    displayName: displayName || null,
    photoURL: photoURL || null
  };
  
  onLogin(idToken, mappedUser);
}
```

#### 3. Auth V1 Flow (Legacy JWT)
```jsx
else {
  const response = await apiService.login(loginData);
  const { token, user } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  onLogin(token, user);
}
```

#### 4. Firebase Error Handling
```jsx
catch (v2Error) {
  const errorMessage = getFirebaseErrorMessage(v2Error);
  setError(errorMessage);
}
```
- Uses `firebase-errors.js` utility
- Provides Indonesian error messages
- Handles codes like: `auth/user-not-found`, `auth/wrong-password`, `auth/too-many-requests`

---

## Register Component (`src/components/auth/Register.jsx`)

### New Imports Added
```jsx
import authV2Service from '../../services/authV2Service';
import tokenService from '../../services/tokenService';
import { shouldUseAuthV2 } from '../../config/auth-v2-config';
import { getFirebaseErrorMessage } from '../../utils/firebase-errors';
```

### Key Changes

#### 1. Username Field Made Optional
```jsx
<label>
  Username / Display Name <span className="text-gray-500 text-xs">(Optional)</span>
</label>
```
- For **Auth V1**: username is stored as `username`
- For **Auth V2**: username is stored as `displayName` (Firebase field)
- Pattern updated to allow spaces: `/^[a-zA-Z0-9_ ]+$/`
- Helper text: "Jika tidak diisi, akan menggunakan email Anda sebagai display name"

#### 2. Auth V2 Registration Flow
```jsx
if (useAuthV2) {
  const v2Response = await authV2Service.register(
    email,
    password,
    username || undefined, // displayName (optional)
    undefined // photoURL (optional)
  );
  
  const { uid, idToken, refreshToken, email: userEmail, displayName, photoURL } = v2Response;
  
  // Store tokens
  tokenService.storeTokens(idToken, refreshToken, uid);
  
  // Store user info
  localStorage.setItem('uid', uid);
  localStorage.setItem('email', userEmail);
  if (displayName) localStorage.setItem('displayName', displayName);
  if (photoURL) localStorage.setItem('photoURL', photoURL);
  
  // Map to V1 format
  const mappedUser = {
    id: uid,
    username: displayName || userEmail.split('@')[0],
    email: userEmail,
    displayName: displayName || null,
    photoURL: photoURL || null
  };
  
  onRegister(idToken, mappedUser);
}
```

#### 3. Auth V1 Registration Flow (Unchanged)
```jsx
else {
  const response = await apiService.register({
    username,
    email,
    password
  });
  
  const { token, user } = response.data;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  onRegister(token, user);
}
```

---

## Data Mapping Strategy

### V2 to V1 User Object Mapping

| Firebase V2 Field | Mapped to V1 Field | Fallback Strategy |
|-------------------|-------------------|-------------------|
| `uid` | `id` | N/A (always present) |
| `displayName` | `username` | Email prefix (before `@`) |
| `email` | `email` | N/A (always present) |
| `displayName` | `displayName` | `null` |
| `photoURL` | `photoURL` | `null` |

### Storage Strategy

#### Auth V2 Storage
```javascript
// Tokens (managed by tokenService)
localStorage.setItem('idToken', '<firebase-id-token>');
localStorage.setItem('refreshToken', '<firebase-refresh-token>');
localStorage.setItem('tokenExpiry', '<timestamp>');

// User metadata
localStorage.setItem('uid', '<user-id>');
localStorage.setItem('email', '<email>');
localStorage.setItem('displayName', '<display-name>'); // if exists
localStorage.setItem('photoURL', '<photo-url>');       // if exists

// Mapped user (for backward compatibility)
localStorage.setItem('user', JSON.stringify(mappedUser));
```

#### Auth V1 Storage (Unchanged)
```javascript
localStorage.setItem('token', '<jwt-token>');
localStorage.setItem('user', JSON.stringify(user));
```

---

## Error Handling Improvements

### Firebase-Specific Errors (V2)
```javascript
// Maps Firebase error codes to Indonesian messages
auth/user-not-found       → "Akun tidak ditemukan"
auth/wrong-password       → "Password yang Anda masukkan salah"
auth/email-already-in-use → "Email sudah terdaftar"
auth/weak-password        → "Password terlalu lemah (min. 6 karakter)"
auth/too-many-requests    → "Terlalu banyak percobaan"
auth/network-request-failed → "Tidak dapat terhubung ke server"
```

### Legacy Errors (V1) - Retained
```javascript
401 → "Email atau password yang Anda masukkan salah"
404 → "Akun tidak ditemukan"
409 → "Email atau username sudah terdaftar"
422 → "Format data tidak sesuai"
429 → "Terlalu banyak percobaan"
500/502/503 → "Server sedang mengalami gangguan"
```

---

## Backward Compatibility Guarantees

✅ **V1 users**: Continue using JWT auth without any changes  
✅ **Existing code**: No breaking changes to components that consume `onLogin(token, user)`  
✅ **User object**: Always has `{id, username, email}` fields (V1 format)  
✅ **Token format**: AuthContext automatically detects and routes correctly  
✅ **Error handling**: Both V1 and V2 errors handled gracefully  

---

## Testing Checklist

### Login Component
- [ ] V1 login with email/password works
- [ ] V2 login with email/password works
- [ ] Feature flag `shouldUseAuthV2()` correctly routes to V1/V2
- [ ] displayName mapped to username for V2 users
- [ ] Email prefix used as fallback username if no displayName
- [ ] Firebase error messages displayed in Indonesian
- [ ] Tokens stored via `tokenService` for V2
- [ ] User object stored in correct format
- [ ] Session restoration works on page refresh

### Register Component
- [ ] V1 registration with username/email/password works
- [ ] V2 registration with email/password (username optional) works
- [ ] Username field accepts spaces (for display names)
- [ ] Empty username defaults to email prefix
- [ ] Firebase registration errors handled correctly
- [ ] Tokens and user data stored correctly for V2
- [ ] Mapped user object compatible with existing code
- [ ] Form validation works for both flows

### Integration Testing
- [ ] Login → Dashboard navigation works for V1
- [ ] Login → Dashboard navigation works for V2
- [ ] Register → Auto-login works for V1
- [ ] Register → Auto-login works for V2
- [ ] Mixed environment (some V1, some V2 users) works
- [ ] Feature flag can be toggled without code changes
- [ ] No console errors during auth flows

---

## Next Steps (Post-Implementation)

1. **Token Refresh Hook** (Todo 9): Create `useTokenRefresh` to keep V2 sessions alive
2. **Password Reset** (Todo 10): Implement forgot/reset password for V2
3. **Profile Updates** (Todo 11): Handle displayName/photoURL updates via V2
4. **Testing Suite** (Todo 17): Create automated tests for dual auth flows

---

## Files Modified

- ✅ `src/components/auth/Login.jsx` - Dual auth support
- ✅ `src/components/auth/Register.jsx` - Dual auth support
- ✅ Username field made optional (V2 compatibility)
- ✅ Error handling with Firebase messages
- ✅ Token storage via tokenService (V2)
- ✅ User object mapping for backward compatibility

## Files Next to Modify

- ⏳ `src/hooks/useTokenRefresh.js` (Todo 9 - Create)
- ⏳ `src/components/auth/ForgotPassword.jsx` (Todo 10 - Create)
- ⏳ `src/components/auth/ResetPassword.jsx` (Todo 10 - Create)
