# 🎯 Quick Reference: Error Message Handling

## For Developers

### How It Works Now

```javascript
// In any component that uses authentication:
import { getFirebaseErrorMessage } from '@/utils/firebase-errors';

try {
  await authV2Service.login(email, password);
} catch (error) {
  // This automatically extracts the best error message!
  const userMessage = getFirebaseErrorMessage(error);
  setError(userMessage); // Display to user
}
```

### Error Priority System

The system checks errors in this order:

```
1. error.response.data.error.code  → Check API_ERROR_MESSAGES
2. error.response.data.code        → Check API_ERROR_MESSAGES  
3. error.response.data.error.message → Use if specific
4. error.response.status           → Check HTTP_ERROR_MESSAGES
5. error.response.data.message     → Use as fallback (avoid "Operation failed")
```

### Adding New Error Mappings

**File**: `src/utils/firebase-errors.js`

```javascript
// Add to API_ERROR_MESSAGES object:
const API_ERROR_MESSAGES = {
  // ... existing mappings ...
  
  // Add your new error code here:
  'NEW_ERROR_CODE': 'Pesan error yang user-friendly dalam Bahasa Indonesia',
};
```

### Common Patterns

#### ✅ DO: Use the utility function
```javascript
import { getFirebaseErrorMessage } from '@/utils/firebase-errors';

catch (error) {
  const message = getFirebaseErrorMessage(error);
  setError(message);
}
```

#### ❌ DON'T: Use raw error messages
```javascript
catch (error) {
  // This might show "Operation failed"!
  setError(error.message); 
}
```

### Test Your Error Messages

Run the test script:
```bash
node testing/test-error-messages.js
```

### Available Helper Functions

```javascript
import {
  getFirebaseErrorMessage,    // Get user-friendly message
  isFirebaseAuthError,         // Check if Firebase error
  requiresReauth,              // Check if needs re-login
  isRateLimitError,            // Check if rate limited
  isNetworkError,              // Check if network issue
  getErrorCategory,            // Get error category
  createUserError,             // Create full error object
  logAuthError,                // Log error (dev only)
} from '@/utils/firebase-errors';
```

### Example: Complete Error Handling

```javascript
import {
  getFirebaseErrorMessage,
  requiresReauth,
  isRateLimitError,
  isNetworkError,
  logAuthError
} from '@/utils/firebase-errors';

const handleLogin = async (email, password) => {
  try {
    await authV2Service.login(email, password);
    // Success!
  } catch (error) {
    // Log for debugging (dev only)
    logAuthError('Login', error);
    
    // Get user-friendly message
    const message = getFirebaseErrorMessage(error);
    setError(message);
    
    // Take specific actions based on error type
    if (requiresReauth(error)) {
      // Clear tokens and redirect to login
      tokenService.clearTokens();
      router.push('/auth/login');
    } else if (isRateLimitError(error)) {
      // Disable form temporarily
      setIsDisabled(true);
      setTimeout(() => setIsDisabled(false), 60000); // 1 minute
    } else if (isNetworkError(error)) {
      // Show retry button
      setShowRetry(true);
    }
  }
};
```

### Error Message Guidelines

When adding new error mappings, follow these guidelines:

1. **Use Indonesian** - All user-facing messages should be in Bahasa Indonesia
2. **Be Specific** - Tell users exactly what went wrong
3. **Be Actionable** - Include what users should do next
4. **Be Friendly** - Use polite, helpful language
5. **Be Clear** - Avoid technical jargon

#### ✅ Good Examples:
```javascript
'EMAIL_EXISTS': 'Email sudah terdaftar. Silakan login atau gunakan email lain.'
'WEAK_PASSWORD': 'Password terlalu lemah. Gunakan minimal 6 karakter dengan kombinasi huruf dan angka.'
```

#### ❌ Bad Examples:
```javascript
'EMAIL_EXISTS': 'Duplicate key error' // Too technical
'WEAK_PASSWORD': 'Invalid input' // Not specific enough
```

### Debugging Tips

1. **Check the full error object:**
```javascript
catch (error) {
  console.log('Full error:', error);
  console.log('Response:', error.response?.data);
  console.log('Status:', error.response?.status);
  console.log('Error code:', error.response?.data?.error?.code);
}
```

2. **Test with mock errors:**
```javascript
const mockError = {
  response: {
    data: {
      error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
      message: 'Operation failed'
    },
    status: 401
  }
};
const message = getFirebaseErrorMessage(mockError);
console.log('User will see:', message);
```

### API Response Structure

The backend returns errors in this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",      // ← Use this for mapping
    "message": "Specific message"  // ← Use this if no mapping
  },
  "message": "Operation failed",   // ← Avoid using this
  "timestamp": "2025-10-08T14:42:19.105Z"
}
```

### Need Help?

- 📝 See full documentation: `docs/ERROR_MESSAGE_FIX.md`
- 📊 See comparison: `docs/ERROR_MESSAGE_COMPARISON.md`
- 🧪 Run tests: `node testing/test-error-messages.js`

---

**Last Updated**: October 8, 2025
