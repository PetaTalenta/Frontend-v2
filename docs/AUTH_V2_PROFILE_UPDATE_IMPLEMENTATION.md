# Auth V2 Profile Update Implementation

## Overview
This document describes the implementation of dual-auth profile update logic in the FutureGuide frontend. The system supports both Auth V1 (legacy JWT) and Auth V2 (Firebase) authentication systems, with special handling for Firebase's limited profile update capabilities.

## Key Architectural Decisions

### 1. Firebase Auth V2 Limitations
Firebase Authentication has **strict limitations** on what profile fields can be updated:
- ✅ **Supported**: `displayName`, `photoURL`
- ❌ **Not Supported**: All other fields (bio, phone, date_of_birth, gender, etc.)

### 2. Dual-Update Strategy for Auth V2
To work around Firebase limitations, we implemented a **split-update strategy**:

```
Auth V2 User Updates:
├─ Firebase Auth Fields (displayName, photoURL)
│  └─ Route to: authV2Service.updateProfile()
│     Method: PATCH /api/auth/profile
│
└─ User Profile Fields (date_of_birth, gender, etc.)
   └─ Route to: apiService.updateProfile() (V1 API fallback)
      Method: PUT /api/auth/profile
```

### 3. Field Mapping for V2
| UI Field       | Firebase Field | User Service Field | Notes |
|----------------|----------------|--------------------|-------|
| Username       | displayName    | N/A                | Mapped to displayName for V2 |
| Full Name      | displayName    | full_name          | Primary displayName source |
| Photo/Avatar   | photoURL       | N/A                | Direct mapping |
| Date of Birth  | N/A            | date_of_birth      | User service only |
| Gender         | N/A            | gender             | User service only |

**Priority Rule**: If both `username` and `full_name` are provided, `full_name` takes precedence for `displayName`.

## Implementation Details

### Modified Files

#### 1. **ProfilePage.tsx** - Main Profile Component

**Location**: `src/components/profile/ProfilePage.tsx`

**Key Changes**:
- Added `authV2Service` and `getFirebaseErrorMessage` imports
- Added `authVersion` from AuthContext
- Added `partialUpdateWarning` state for dual-update failures
- Complete rewrite of `handleSaveProfile()` function
- Updated `handleChangePassword()` with V2 limitations warning

**New Dependencies**:
```typescript
import authV2Service from '../../services/authV2Service';
import { getFirebaseErrorMessage } from '../../utils/firebase-errors';

// From AuthContext
const { authVersion } = useAuth(); // 'v1' | 'v2'
```

### Profile Update Flow

#### Auth V1 Flow (Legacy - Unchanged)
```
User submits profile form
  ↓
Validate all fields
  ↓
Single API call: apiService.updateProfile(allFields)
  ↓
Update AuthContext
  ↓
Reload profile data
```

#### Auth V2 Flow (New - Dual Update)
```
User submits profile form
  ↓
Validate all fields
  ↓
Split fields into two groups:
  ├─ authFields: {displayName, photoURL}
  └─ userFields: {date_of_birth, gender, etc.}
  ↓
Parallel updates:
  ├─ authV2Service.updateProfile(authFields)
  └─ apiService.updateProfile(userFields)
  ↓
Collect success/failure results
  ↓
Show appropriate message:
  ├─ Both succeed → "Profile updated successfully"
  ├─ Only auth succeeds → "Display name updated, but other fields failed"
  ├─ Only user succeeds → "Profile fields updated, but display name failed"
  └─ Both fail → Show error message
  ↓
Update AuthContext (if auth fields changed)
  ↓
Reload profile data
```

### Code Example - handleSaveProfile()

```typescript
const handleSaveProfile = async () => {
  if (!token) return;

  setIsUpdating(true);
  setError('');
  setSuccess('');
  setPartialUpdateWarning('');

  try {
    // ... validation logic ...

    // AUTH V2: Dual-update strategy
    if (authVersion === 'v2') {
      const authFields: any = {};
      const userFields: any = {};

      // Map username/full_name to displayName
      if (updateData.username) {
        authFields.displayName = updateData.username;
      }
      if (updateData.full_name) {
        authFields.displayName = updateData.full_name; // Overrides username
      }

      // All other fields → user service
      if (updateData.date_of_birth) userFields.date_of_birth = updateData.date_of_birth;
      if (updateData.gender) userFields.gender = updateData.gender;

      let authUpdateSuccess = false;
      let userUpdateSuccess = false;
      const errors: string[] = [];

      // Update auth fields (displayName)
      if (Object.keys(authFields).length > 0) {
        try {
          await authV2Service.updateProfile(authFields);
          authUpdateSuccess = true;
        } catch (authError: any) {
          const errorMsg = getFirebaseErrorMessage(authError);
          errors.push(`Auth update failed: ${errorMsg}`);
        }
      }

      // Update user fields via V1 API fallback
      if (Object.keys(userFields).length > 0) {
        try {
          const result = await apiService.updateProfile(userFields);
          if (result && result.success) {
            userUpdateSuccess = true;
          } else {
            errors.push(result?.message || 'Failed to update user profile fields');
          }
        } catch (userError: any) {
          errors.push('Failed to update user profile fields');
        }
      }

      // Handle partial success/failure
      if (authUpdateSuccess || userUpdateSuccess) {
        if (authUpdateSuccess && !userUpdateSuccess && Object.keys(userFields).length > 0) {
          setPartialUpdateWarning('Display name updated successfully, but other profile fields could not be updated.');
        } else if (!authUpdateSuccess && userUpdateSuccess && Object.keys(authFields).length > 0) {
          setPartialUpdateWarning('Profile fields updated successfully, but display name could not be updated.');
        } else {
          setSuccess('Profile updated successfully');
        }
        
        setIsEditing(false);
        await loadProfile();
      } else {
        setError(errors.join(' ') || 'Failed to update profile');
      }

    } else {
      // AUTH V1: Single unified update (backward compatibility)
      const result = await apiService.updateProfile(updateData);
      // ... standard V1 handling ...
    }
  } catch (err: any) {
    const errorMsg = authVersion === 'v2' ? getFirebaseErrorMessage(err) : 'Failed to update profile';
    setError(errorMsg);
  } finally {
    setIsUpdating(false);
  }
};
```

## Password Change Handling

### Auth V1 - Traditional Flow
Users can change passwords directly through the profile page using their current password:
- Input: Current password + New password
- Validation: Password strength (min 8 chars), confirmation match
- API: `apiService.changePassword({currentPassword, newPassword})`
- Result: Immediate password change

### Auth V2 - Security-First Approach
Firebase requires **reauthentication** for password changes. Instead of implementing complex reauthentication flows, we redirect users to the **password reset flow**:

```typescript
const handleChangePassword = async () => {
  if (!token) return;

  // Auth V2: Require password reset flow for security
  if (authVersion === 'v2') {
    setError('For security reasons, Firebase authentication requires using the password reset flow. Please use the "Forgot Password" feature from the login page to change your password.');
    return;
  }

  // Auth V1: Traditional password change
  // ... existing logic ...
};
```

**User Experience for V2**:
1. User clicks "Change Password" in profile
2. Sees error message recommending password reset
3. User navigates to login page
4. Clicks "Forgot Password"
5. Receives email with reset link
6. Completes password reset via email

**Why this approach?**
- ✅ More secure (email verification)
- ✅ No need to store/validate current password
- ✅ Consistent with Firebase best practices
- ✅ Simpler codebase (no reauthentication logic)

## UI Components

### Alert States

#### Success (Green)
```tsx
{success && (
  <Alert className="border-[#bbf7d0] bg-[#dcfce7]">
    <CheckCircle className="h-4 w-4 text-[#16a34a]" />
    <AlertDescription className="text-[#166534]">{success}</AlertDescription>
  </Alert>
)}
```

#### Error (Red)
```tsx
{error && (
  <Alert className="border-destructive/20 bg-destructive/10">
    <AlertCircle className="h-4 w-4 text-destructive" />
    <AlertDescription className="text-destructive">{error}</AlertDescription>
  </Alert>
)}
```

#### Partial Success Warning (Orange) - **NEW**
```tsx
{partialUpdateWarning && (
  <Alert className="border-orange-200 bg-orange-50">
    <AlertCircle className="h-4 w-4 text-orange-600" />
    <AlertDescription className="text-orange-800">{partialUpdateWarning}</AlertDescription>
  </Alert>
)}
```

## Error Handling

### Firebase Errors (V2)
All Firebase errors are mapped to user-friendly Indonesian messages via `getFirebaseErrorMessage()`:

```typescript
try {
  await authV2Service.updateProfile(authFields);
} catch (authError: any) {
  const errorMsg = getFirebaseErrorMessage(authError);
  // Examples:
  // - "auth/requires-recent-login" → "Silakan login ulang untuk melakukan perubahan ini"
  // - "auth/invalid-display-name" → "Nama tampilan tidak valid"
  errors.push(`Auth update failed: ${errorMsg}`);
}
```

### API Errors (V1)
Standard API error messages from the backend:
```typescript
if (result?.error?.code === 'INVALID_SCHOOL_ID') {
  setError(`School validation failed: ${result.error.message}`);
} else {
  setError(result?.message || 'Failed to update profile');
}
```

## Testing Checklist

### Manual Testing Required

#### Auth V1 Testing
- [ ] Login with V1 account (feature flag: `NEXT_PUBLIC_USE_AUTH_V2=false`)
- [ ] Navigate to profile page
- [ ] Edit username → Verify update successful
- [ ] Edit full_name → Verify update successful
- [ ] Edit date_of_birth → Verify update successful
- [ ] Edit gender → Verify update successful
- [ ] Edit all fields together → Verify update successful
- [ ] Change password → Verify password change works
- [ ] Verify AuthContext updates with new username/name
- [ ] Verify profile page reloads with new data

#### Auth V2 Testing (Dual Update Strategy)
- [ ] Enable V2: `NEXT_PUBLIC_USE_AUTH_V2=true`, `NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=100`
- [ ] Register new V2 account
- [ ] Navigate to profile page
- [ ] Edit username only → Verify displayName updated in Firebase
- [ ] Edit full_name only → Verify displayName updated (overrides username)
- [ ] Edit date_of_birth only → Verify fallback to V1 API
- [ ] Edit gender only → Verify fallback to V1 API
- [ ] Edit username + date_of_birth together → Verify both updates
- [ ] Edit full_name + gender together → Verify both updates
- [ ] Test partial failure scenario:
  - [ ] Disconnect from user service
  - [ ] Edit username (auth) + gender (user)
  - [ ] Verify partial warning appears
- [ ] Test password change → Verify warning message shown
- [ ] Verify "Forgot Password" flow works from login page

#### Edge Cases
- [ ] Empty form submission → "No changes to save" error
- [ ] Invalid username format → Validation error
- [ ] Future date_of_birth → Validation error
- [ ] Full_name > 100 chars → Validation error
- [ ] Gender not "male"/"female" → Validation error
- [ ] Network error during auth update → Error handled gracefully
- [ ] Network error during user update → Error handled gracefully
- [ ] Firebase token expired → Auto-refresh via interceptor

### Browser Console Logs
Expected console output during V2 profile update:
```
ProfilePage: Starting profile update (Auth Version: v2 )
ProfilePage: Validated update data: {username: "newusername", date_of_birth: "2000-01-01"}
ProfilePage: Using Auth V2 dual-update strategy
ProfilePage: Updating Firebase auth fields: {displayName: "newusername"}
Auth V2: Update profile attempt
Auth V2: Profile update successful
ProfilePage: Firebase auth update successful
ProfilePage: Updating user profile fields via V1 API: {date_of_birth: "2000-01-01"}
ProfilePage: User fields update successful
ProfilePage: Updating AuthContext after V2 profile save: {username: "newusername", name: "newusername"}
AuthContext: Updating user with profile data: {username: "newusername", name: "newusername"}
```

## Backend Requirements

### Current Backend Support
- ✅ Auth V2 service supports `PATCH /api/auth/profile` (displayName, photoURL)
- ✅ Auth V1 service supports `PUT /api/auth/profile` (all fields)

### Required Backend Changes (Future Enhancement)
To fully support V2 profile updates, backend needs:
1. **User Service Endpoint** (separate from auth service):
   ```
   PATCH /api/user/profile
   Fields: date_of_birth, gender, bio, phone, address, etc.
   Auth: Requires Firebase ID token
   ```

2. **API Gateway Routing**:
   - Route `/api/auth/v2/*` → auth-v2-service (Firebase)
   - Route `/api/user/*` → user-service (profile data)

3. **Database Schema**:
   - Auth table: uid (Firebase), email, displayName, photoURL
   - User table: uid (FK), date_of_birth, gender, bio, phone, etc.

**Current Workaround**: Using V1 API endpoint for non-auth fields. This works but creates dependency on V1 auth service.

## Security Considerations

### 1. Token-Based Authorization
Both V1 and V2 updates require valid tokens:
- V1: JWT token in `Authorization: Bearer <token>`
- V2: Firebase ID token in `Authorization: Bearer <idToken>`

### 2. Password Change Security
- V1: Requires current password validation (server-side)
- V2: Requires email-based password reset (more secure)

### 3. Profile Data Privacy
- Users can only update their own profiles
- Token verification ensures user identity
- No admin override from profile page

### 4. Input Validation
- Client-side validation (immediate feedback)
- Server-side validation (security enforcement)
- Sanitization in backend (XSS prevention)

## Migration Path

### Phase 1 (Current): Dual-Update Strategy ✅
- Auth V2 users use split update (auth + user fields)
- Auth V1 users use unified update
- Both systems work simultaneously

### Phase 2 (Future): Dedicated User Service
- Create separate user service for profile data
- Migrate all non-auth fields to user service
- Remove dependency on V1 API for V2 users

### Phase 3 (Future): V1 Deprecation
- All users migrated to V2
- Remove V1 auth service
- Unified profile update through user service

## Known Limitations

### Current Implementation
1. **No photoURL support yet**: UI doesn't have photo upload component
2. **Fallback to V1 API**: User fields still route through V1 API
3. **No password change for V2**: Must use password reset flow
4. **Partial failure handling**: Updates may partially succeed

### Firebase Limitations (By Design)
1. **No custom fields**: Firebase Auth only stores displayName, photoURL, email
2. **Reauthentication required**: Password changes need recent login
3. **Token expiration**: 1 hour lifetime (auto-refresh implemented)

## Troubleshooting

### "Profile updated successfully, but other fields could not be updated"
**Cause**: Firebase auth update succeeded, but V1 API fallback failed

**Solutions**:
- Check V1 API service status
- Verify user has profile record in V1 database
- Check network connectivity
- Review backend logs for V1 API errors

### "For security reasons, Firebase authentication requires using the password reset flow"
**Cause**: User tried to change password with Auth V2 account

**Solution**: Use "Forgot Password" feature from login page

### AuthContext not updating after profile save
**Cause**: `updateUser()` not called or authUpdates object empty

**Solutions**:
- Verify `authVersion` is correctly detected
- Check console logs for "Updating AuthContext after profile save"
- Ensure displayName was actually changed

### Firebase token expired error during update
**Cause**: ID token expired (1 hour lifetime)

**Solution**: Implemented auto-refresh in axios interceptor - should handle automatically

## Related Documentation
- [Auth V2 Context Implementation](./AUTH_V2_CONTEXT_IMPLEMENTATION.md)
- [Auth V2 Login/Register Implementation](./AUTH_V2_LOGIN_REGISTER_IMPLEMENTATION.md)
- [Auth V2 Password Reset Implementation](./AUTH_V2_PASSWORD_RESET_IMPLEMENTATION.md)
- [Auth V2 Phase 1 Summary](./AUTH_V2_PHASE1_SUMMARY.md)
- [Firebase Error Handling](../src/utils/firebase-errors.js)

## Completion Status
- ✅ ProfilePage.tsx updated with dual auth support
- ✅ Split-update strategy for V2 (auth + user fields)
- ✅ Partial update warning UI component
- ✅ Password change with V2 limitations handling
- ✅ Firebase error message integration
- ✅ TypeScript compilation successful
- ✅ Documentation complete
- ⏳ Manual testing pending
- ⏳ User service endpoint (future enhancement)

**Last Updated**: 2024-01-XX
**Implementation Status**: Complete - Ready for Testing
