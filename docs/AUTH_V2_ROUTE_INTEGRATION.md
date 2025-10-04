# Auth V2 Route Integration for Password Reset

## Overview
This document describes the implementation of Next.js App Router pages for the password reset flow. The routes integrate the ForgotPassword and ResetPassword components with proper metadata, SEO settings, and navigation.

## Routes Created

### 1. `/forgot-password` - Request Password Reset
**Purpose**: Page where users enter their email to receive a password reset link

**Location**: `src/app/forgot-password/page.tsx`

**Features**:
- ✅ Server Component with metadata for SEO
- ✅ Client Component wrapper for routing
- ✅ Back navigation to `/auth` (login page)
- ✅ Proper metadata with noindex/nofollow (security best practice)

**File Structure**:
```
src/app/forgot-password/
├── page.tsx                    # Server Component with metadata
```

**Component Structure**:
```
src/components/auth/
├── ForgotPassword.jsx          # Core component (existing)
└── ForgotPasswordWrapper.tsx   # Client wrapper with router (NEW)
```

### 2. `/reset-password` - Set New Password
**Purpose**: Page where users set a new password using the reset code from email

**Location**: `src/app/reset-password/page.tsx`

**Features**:
- ✅ Server Component with metadata for SEO
- ✅ Client Component wrapper for component rendering
- ✅ Auto-detects auth version from URL params (`oobCode` or `token`)
- ✅ Auto-redirects to login after successful reset
- ✅ Proper metadata with noindex/nofollow

**File Structure**:
```
src/app/reset-password/
├── page.tsx                    # Server Component with metadata
```

**Component Structure**:
```
src/components/auth/
├── ResetPassword.jsx           # Core component (existing)
└── ResetPasswordWrapper.tsx    # Client wrapper (NEW)
```

## Implementation Details

### forgot-password/page.tsx (Server Component)

```typescript
import { Metadata } from 'next';
import ForgotPasswordWrapper from '../../components/auth/ForgotPasswordWrapper';

export const metadata: Metadata = {
  title: 'Lupa Password - FutureGuide',
  description: 'Reset password akun FutureGuide Anda. Masukkan email untuk menerima link reset password.',
  robots: {
    index: false, // Prevent search engine indexing
    follow: false,
  },
};

export default function Page() {
  return <ForgotPasswordWrapper />;
}
```

**Key Points**:
- ✅ Export `metadata` for Next.js SEO
- ✅ `robots: { index: false }` - Security best practice for auth pages
- ✅ Indonesian metadata for local users
- ✅ Server-side rendered (no 'use client')

### ForgotPasswordWrapper.tsx (Client Component)

```typescript
'use client';

import { useRouter } from 'next/navigation';
import ForgotPassword from './ForgotPassword';

export default function ForgotPasswordWrapper() {
  const router = useRouter();

  const handleBack = () => {
    router.push('/auth');
  };

  return <ForgotPassword onBack={handleBack} />;
}
```

**Key Points**:
- ✅ `'use client'` directive for Next.js 13+ App Router
- ✅ Uses `next/navigation` router (not `next/router`)
- ✅ Provides `onBack` callback to ForgotPassword component
- ✅ Navigates back to `/auth` (login page)

### reset-password/page.tsx (Server Component)

```typescript
import { Metadata } from 'next';
import ResetPasswordWrapper from '../../components/auth/ResetPasswordWrapper';

export const metadata: Metadata = {
  title: 'Reset Password - FutureGuide',
  description: 'Buat password baru untuk akun FutureGuide Anda.',
  robots: {
    index: false, // Prevent search engine indexing
    follow: false,
  },
};

export default function Page() {
  return <ResetPasswordWrapper />;
}
```

**Key Points**:
- ✅ Similar structure to forgot-password
- ✅ SEO metadata configured
- ✅ No indexing for security
- ✅ Server-side rendered

### ResetPasswordWrapper.tsx (Client Component)

```typescript
'use client';

import ResetPassword from './ResetPassword';

export default function ResetPasswordWrapper() {
  return <ResetPassword />;
}
```

**Key Points**:
- ✅ Simple wrapper for client-side rendering
- ✅ ResetPassword component doesn't need router (auto-redirects via window.location)
- ✅ Minimal wrapper to satisfy Next.js server/client boundary

## Login Component Integration

### Updated Login.jsx

**Location**: `src/components/auth/Login.jsx`

**Changes**:
1. Added `import Link from 'next/link';`
2. Replaced `<a href="#">` with `<Link href="/forgot-password">`
3. Changed text from "Forgot your password?" to "Lupa password?" (Indonesian)

**Before**:
```jsx
<a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
  Forgot your password?
</a>
```

**After**:
```jsx
<Link 
  href="/forgot-password" 
  className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
>
  Lupa password?
</Link>
```

**Benefits**:
- ✅ Client-side navigation (faster, no full page reload)
- ✅ Prefetching (Next.js automatically prefetches link on hover)
- ✅ Better UX with instant navigation
- ✅ Consistent with Next.js best practices

## User Journey Flow

### Complete Password Reset Flow

```
┌──────────────────────────────────────────────────────────────┐
│                        Login Page                             │
│                       (/auth)                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Email: [________________]                             │  │
│  │  Password: [________________]                          │  │
│  │  [Login Button]                                        │  │
│  │                                                        │  │
│  │  Forgot Password? → [Lupa password?] ←── LINK         │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           ↓ Click "Lupa password?"
┌──────────────────────────────────────────────────────────────┐
│                  Forgot Password Page                         │
│                  (/forgot-password)                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  [← Back to Login]                                     │  │
│  │                                                        │  │
│  │  Email: [________________]                             │  │
│  │  [Send Reset Link]                                     │  │
│  │                                                        │  │
│  │  ✉️ Success: Check your email for reset link          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           ↓ User clicks link in email
┌──────────────────────────────────────────────────────────────┐
│                   Reset Password Page                         │
│         (/reset-password?oobCode=xxx)  [V2]                   │
│         (/reset-password?token=xxx)    [V1]                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  New Password: [________________]  👁                  │  │
│  │  Confirm Password: [________________]                  │  │
│  │  [Reset Password]                                      │  │
│  │                                                        │  │
│  │  ✅ Success! Redirecting to login...                   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           ↓ Auto-redirect after 3 seconds
┌──────────────────────────────────────────────────────────────┐
│                        Login Page                             │
│                       (/auth)                                 │
│  User can now login with new password                         │
└──────────────────────────────────────────────────────────────┘
```

## URL Parameters

### Auth V2 (Firebase)
```
https://futureguide.id/reset-password?oobCode=ABC123XYZ
```
- `oobCode`: Firebase Out-of-Band code from password reset email
- Auto-detected by ResetPassword component
- Used with `authV2Service.resetPassword(oobCode, newPassword)`

### Auth V1 (Legacy)
```
https://futureguide.id/reset-password?token=DEF456UVW
```
- `token`: JWT-based reset token from password reset email
- Auto-detected by ResetPassword component
- Used with `apiService.resetPassword({token, newPassword})`

### Detection Logic in ResetPassword Component
```javascript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const oobCode = params.get('oobCode');
  const token = params.get('token');

  if (oobCode) {
    // Auth V2 flow
    setResetCode(oobCode);
    setAuthVersion('v2');
  } else if (token) {
    // Auth V1 flow
    setResetCode(token);
    setAuthVersion('v1');
  } else {
    setError('Invalid reset link');
  }
}, []);
```

## SEO & Security Considerations

### Metadata Configuration

**Best Practices Implemented**:
```typescript
export const metadata: Metadata = {
  title: 'Lupa Password - FutureGuide',
  description: 'Reset password akun FutureGuide Anda...',
  robots: {
    index: false,  // ✅ Prevent Google indexing
    follow: false, // ✅ Prevent link following
  },
};
```

**Why `noindex, nofollow`?**
1. **Security**: Password reset pages should not be indexed by search engines
2. **Privacy**: Prevents users from accidentally finding old reset links
3. **SEO**: These are functional pages, not content pages
4. **Best Practice**: Standard for all authentication/sensitive pages

### Password Reset Email Format

**Auth V2 Email** (Firebase sends automatically):
```
Subject: Reset Your Password - FutureGuide

Hi [User],

Click the link below to reset your password:
https://futureguide.id/reset-password?oobCode=ABC123XYZ

This link expires in 1 hour.

If you didn't request this, please ignore this email.
```

**Auth V1 Email** (Backend sends):
```
Subject: Reset Your Password - FutureGuide

Hi [Username],

Click the link below to reset your password:
https://futureguide.id/reset-password?token=DEF456UVW

This link expires in 1 hour.

If you didn't request this, please contact support.
```

## Error Handling

### Invalid Reset Link
```
User lands on /reset-password without query params
  ↓
ResetPassword component detects no oobCode or token
  ↓
Shows error: "Invalid reset link"
  ↓
User can click "Back to Login"
```

### Expired Reset Link
```
User clicks old reset link
  ↓
Backend validates oobCode/token
  ↓
Returns error: "Reset link has expired"
  ↓
User sees Firebase error in Indonesian
  ↓
User can request new reset link
```

### Network Errors
```
User submits new password
  ↓
Network request fails
  ↓
Error caught and displayed
  ↓
User can retry immediately
```

## File Summary

### New Files Created
1. ✅ `src/app/forgot-password/page.tsx` - Server Component with metadata
2. ✅ `src/app/reset-password/page.tsx` - Server Component with metadata
3. ✅ `src/components/auth/ForgotPasswordWrapper.tsx` - Client wrapper
4. ✅ `src/components/auth/ResetPasswordWrapper.tsx` - Client wrapper

### Modified Files
1. ✅ `src/components/auth/Login.jsx` - Added Link to forgot-password

### Existing Components (No Changes)
1. ✅ `src/components/auth/ForgotPassword.jsx` - Already implemented (Todo 10)
2. ✅ `src/components/auth/ResetPassword.jsx` - Already implemented (Todo 10)

## Testing Checklist

### Manual Testing Required

#### Route Navigation
- [ ] Navigate to `/auth` (login page)
- [ ] Click "Lupa password?" link
- [ ] Verify navigation to `/forgot-password`
- [ ] Verify client-side navigation (no page reload)
- [ ] Click "Back to Login" button
- [ ] Verify navigation back to `/auth`

#### Forgot Password Page
- [ ] Access `/forgot-password` directly via URL
- [ ] Verify page loads correctly
- [ ] Verify metadata (check browser tab title)
- [ ] Enter email and submit
- [ ] Verify dual auth routing (V1 vs V2)
- [ ] Verify success message
- [ ] Verify email received (check spam folder)

#### Reset Password Page
- [ ] Access `/reset-password` without query params → Error shown
- [ ] Access with `?oobCode=test` → V2 flow detected
- [ ] Access with `?token=test` → V1 flow detected
- [ ] Enter new password and submit
- [ ] Verify password validation (8+ chars)
- [ ] Verify confirm password matching
- [ ] Verify success message
- [ ] Verify auto-redirect to login after 3s
- [ ] Login with new password → Success

#### Auth V1 Flow
- [ ] Request password reset for V1 user
- [ ] Click link in email (contains `?token=...`)
- [ ] Verify V1 reset flow
- [ ] Reset password successfully
- [ ] Login with new password

#### Auth V2 Flow (Firebase)
- [ ] Request password reset for V2 user
- [ ] Click link in email (contains `?oobCode=...`)
- [ ] Verify V2 reset flow
- [ ] Reset password successfully
- [ ] Verify Firebase error messages in Indonesian
- [ ] Login with new password

#### Edge Cases
- [ ] Expired reset link → Error message shown
- [ ] Invalid oobCode/token → Error message shown
- [ ] Network error during reset → Error handled gracefully
- [ ] Password too short (<8 chars) → Validation error
- [ ] Passwords don't match → Validation error
- [ ] Submit with empty fields → Validation errors
- [ ] Access reset page while logged in → ?
- [ ] Multiple reset requests → Last link valid

### Browser Testing
- [ ] Chrome/Edge (Windows)
- [ ] Firefox
- [ ] Safari (macOS/iOS)
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)

### SEO Verification
```bash
# Check robots meta tag
curl -s https://futureguide.id/forgot-password | grep "robots"
# Expected: <meta name="robots" content="noindex, nofollow">

curl -s https://futureguide.id/reset-password | grep "robots"
# Expected: <meta name="robots" content="noindex, nofollow">
```

## Deployment Notes

### Environment Variables
No new environment variables required. Uses existing:
- `NEXT_PUBLIC_USE_AUTH_V2` - Feature flag for Auth V2
- `NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE` - Rollout percentage
- `NEXT_PUBLIC_API_BASE_URL` - API endpoint

### Build Verification
```bash
# Ensure routes are built correctly
npm run build

# Check build output for new routes
ls .next/server/app/forgot-password
ls .next/server/app/reset-password

# Expected: page.js files in both directories
```

### Route Verification (Production)
After deployment:
```bash
# Test route accessibility
curl -I https://futureguide.id/forgot-password
# Expected: HTTP 200 OK

curl -I https://futureguide.id/reset-password
# Expected: HTTP 200 OK

curl -I https://futureguide.id/reset-password?oobCode=test
# Expected: HTTP 200 OK (even with invalid code)
```

## Performance Considerations

### Client-Side Navigation
- ✅ Next.js Link component prefetches on hover
- ✅ Instant navigation (no server roundtrip)
- ✅ Shared layout reduces bundle size

### Code Splitting
- ✅ ForgotPassword component only loaded when needed
- ✅ ResetPassword component only loaded when needed
- ✅ Reduces initial bundle size for login page

### SEO Impact
- ✅ Noindex prevents duplicate content issues
- ✅ Server-side rendering for metadata
- ✅ Proper HTML structure for accessibility

## Accessibility

### Keyboard Navigation
- ✅ Link is keyboard-accessible (Tab to focus)
- ✅ Enter key activates navigation
- ✅ Back button keyboard-accessible

### Screen Readers
- ✅ Link text is descriptive ("Lupa password?")
- ✅ Proper heading hierarchy in components
- ✅ Form labels associated with inputs

### ARIA Labels (Inherited from Components)
- ✅ Password visibility toggle labeled
- ✅ Error messages announced
- ✅ Success messages announced

## Future Enhancements

### Potential Improvements
1. **Email Verification**: Verify email exists before sending reset link
2. **Rate Limiting UI**: Show "Too many requests" message
3. **Link Expiry Timer**: Show countdown before link expires
4. **Multi-language Support**: Add English translations
5. **Social Login Reset**: Handle password reset for social auth users
6. **SMS Reset Option**: Alternative to email-based reset
7. **Security Questions**: Additional verification before reset

### Analytics Tracking
```typescript
// Track password reset attempts
analytics.track('password_reset_requested', {
  authVersion: 'v2',
  email: hashedEmail
});

// Track successful resets
analytics.track('password_reset_completed', {
  authVersion: 'v2',
  resetMethod: 'email'
});
```

## Troubleshooting

### "Cannot find module" errors
**Cause**: TypeScript path alias not resolving

**Solution**: Use relative imports instead
```typescript
// Instead of: import X from '@/components/...'
import X from '../../components/...'
```

### Metadata not appearing in browser
**Cause**: Using 'use client' in page component

**Solution**: Separate server (metadata) and client (interactive) components
```typescript
// page.tsx - Server Component
export const metadata = {...};
export default function Page() {
  return <ClientWrapper />;
}

// ClientWrapper.tsx - Client Component
'use client';
export default function ClientWrapper() {
  return <Component />;
}
```

### Link not navigating
**Cause**: Using `<a>` tag instead of `<Link>`

**Solution**: Always use Next.js `<Link>` for internal navigation

### Reset link showing "Invalid reset link"
**Cause**: URL parameter missing or misspelled

**Solution**: Ensure email contains correct query parameter:
- Auth V2: `?oobCode=...`
- Auth V1: `?token=...`

## Related Documentation
- [Auth V2 Password Reset Implementation](./AUTH_V2_PASSWORD_RESET_IMPLEMENTATION.md)
- [Auth V2 Implementation Progress](./AUTH_V2_IMPLEMENTATION_PROGRESS.md)
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

## Completion Status
- ✅ `/forgot-password` route created with metadata
- ✅ `/reset-password` route created with metadata
- ✅ Client wrapper components created
- ✅ Login component updated with Link
- ✅ SEO metadata configured (noindex, nofollow)
- ✅ Server/Client component separation
- ✅ Navigation flow complete
- ✅ Documentation complete
- ⏳ Manual testing pending
- ⏳ Production deployment pending

**Last Updated**: 2024-10-04
**Implementation Status**: Complete - Ready for Testing
