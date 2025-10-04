# Auth V2 Account Deletion Implementation

## Overview
This document describes the implementation of account deletion with dual-auth support (Auth V1 and Auth V2). The feature includes a secure password confirmation modal and handles the different endpoints and requirements for each authentication system.

## Key Features

### 1. Dual Authentication Support
- **Auth V1**: Uses `DELETE /api/auth/account` with password confirmation
- **Auth V2**: Uses `DELETE /api/auth/v2/user` via `authV2Service.deleteAccount()` with password confirmation

### 2. Security Requirements
Both authentication versions require **password confirmation** to prevent accidental or unauthorized account deletions:
- Users must enter their current password
- Password is verified by backend before deletion
- Firebase (V2) validates password against Firebase Authentication
- V1 validates password against database

### 3. User Experience
- Clear warning messages about data loss
- Confirmation modal with danger styling
- 2-second delay before logout to show success message
- Automatic redirect to login page after deletion

## Implementation Details

### Modified Files

#### 1. **ProfilePage.tsx** - Profile Component

**Location**: `src/components/profile/ProfilePage.tsx`

**New Imports**:
```typescript
import { Trash2, AlertTriangle } from 'lucide-react';
import { API_ENDPOINTS, API_CONFIG } from '../../config/api';
import axios from 'axios';
```

**New State**:
```typescript
const [showDeleteModal, setShowDeleteModal] = useState(false);
const [deletePassword, setDeletePassword] = useState('');
const [isDeleting, setIsDeleting] = useState(false);
```

**New Handler**: `handleDeleteAccount()`

### Account Deletion Flow

#### Auth V1 Flow
```
User clicks "Delete Account"
  ↓
Modal appears with warning
  ↓
User enters password
  ↓
axios.delete('/api/auth/account', { data: { password } })
  ↓
Backend validates password
  ↓
Account deleted from database
  ↓
Success message → 2s delay → logout()
```

#### Auth V2 Flow (Firebase)
```
User clicks "Delete Account"
  ↓
Modal appears with warning
  ↓
User enters Firebase password
  ↓
authV2Service.deleteAccount(password)
  ↓
Backend validates password with Firebase
  ↓
Firebase user deleted
  ↓
Database records cleaned up
  ↓
tokenService.clearTokens()
  ↓
Success message → 2s delay → logout()
```

### Code Implementation

#### handleDeleteAccount Function

```typescript
const handleDeleteAccount = async () => {
  if (!token) return;

  // Validate password for both V1 and V2
  if (!deletePassword || deletePassword.trim().length === 0) {
    setError('Password is required to delete your account');
    return;
  }

  setIsDeleting(true);
  setError('');
  setSuccess('');

  try {
    console.log('ProfilePage: Starting account deletion (Auth Version:', authVersion, ')');

    if (authVersion === 'v2') {
      // AUTH V2: Use Firebase account deletion endpoint
      console.log('ProfilePage: Using Auth V2 deleteAccount');
      await authV2Service.deleteAccount(deletePassword);
      console.log('ProfilePage: Auth V2 account deletion successful');
    } else {
      // AUTH V1: Use traditional deletion endpoint
      console.log('ProfilePage: Using Auth V1 account deletion');
      const response = await axios.delete(
        `${API_CONFIG.BASE_URL}${API_ENDPOINTS.AUTH.DELETE_ACCOUNT}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: { password: deletePassword }
        }
      );
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Failed to delete account');
      }
      console.log('ProfilePage: Auth V1 account deletion successful');
    }

    // Show success message briefly before logout
    setSuccess('Account deleted successfully. Redirecting...');
    setShowDeleteModal(false);
    
    // Wait 2 seconds then logout
    setTimeout(() => {
      console.log('ProfilePage: Logging out after account deletion');
      logout();
    }, 2000);

  } catch (err: any) {
    console.error('Error deleting account:', err);
    const errorMsg = authVersion === 'v2' 
      ? getFirebaseErrorMessage(err)
      : (err.response?.data?.message || err.message || 'Failed to delete account');
    
    setError(errorMsg);
    setIsDeleting(false);
  }
};
```

### UI Components

#### Danger Zone Section
```tsx
<Card className="border-destructive">
  <CardHeader>
    <div>
      <CardTitle className="text-destructive flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
        Danger Zone
      </CardTitle>
      <CardDescription>Irreversible account actions</CardDescription>
    </div>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
      <div>
        <h4 className="font-semibold text-foreground">Delete Account</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Once you delete your account, there is no going back. Please be certain.
        </p>
      </div>
      <Button
        variant="destructive"
        onClick={() => setShowDeleteModal(true)}
        className="ml-4"
      >
        <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.75} />
        Delete Account
      </Button>
    </div>
  </CardContent>
</Card>
```

#### Delete Confirmation Modal
```tsx
{showDeleteModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <Card className="w-full max-w-md border-destructive">
      <CardHeader>
        <CardTitle className="text-destructive flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
          Confirm Account Deletion
        </CardTitle>
        <CardDescription>
          This action cannot be undone. This will permanently delete your account 
          and remove all your data from our servers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Warning Alert */}
        <Alert className="border-destructive/20 bg-destructive/10">
          <AlertCircle className="h-4 w-4 text-destructive" />
          <AlertDescription className="text-destructive">
            <strong>Warning:</strong> All your assessment results, profile data, 
            and token balance will be permanently deleted.
          </AlertDescription>
        </Alert>

        {/* Password Input */}
        <div className="space-y-2">
          <Label htmlFor="deletePassword">
            {authVersion === 'v2' 
              ? 'Enter your password to confirm' 
              : 'Enter your password to confirm'}
          </Label>
          <Input
            id="deletePassword"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Enter your password"
            disabled={isDeleting}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            {authVersion === 'v2' 
              ? 'Your Firebase account password is required for security.' 
              : 'Your current password is required for security.'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowDeleteModal(false);
              setDeletePassword('');
              setError('');
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteAccount}
            disabled={isDeleting || !deletePassword}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" strokeWidth={1.75} />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.75} />
                Delete My Account
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
)}
```

## API Endpoints

### Auth V1 (Legacy)
```
DELETE /api/auth/account
Headers:
  Authorization: Bearer <jwt_token>
Body:
  {
    "password": "user_current_password"
  }
Response:
  {
    "success": true,
    "message": "Account deleted successfully"
  }
```

### Auth V2 (Firebase)
```
DELETE /api/auth/v2/user
Headers:
  Authorization: Bearer <firebase_id_token>
Body:
  {
    "password": "user_firebase_password"
  }
Response:
  {
    "success": true,
    "message": "Account deleted successfully"
  }
```

## Backend Processing

### Auth V1 Backend Flow
1. Validate JWT token
2. Extract user ID from token
3. Verify password matches user's stored password hash
4. Delete user profile data
5. Delete user assessment results
6. Delete user from database
7. Return success response

### Auth V2 Backend Flow
1. Validate Firebase ID token
2. Extract Firebase UID
3. Call Firebase Admin SDK to verify password (reauthentication)
4. Delete user from Firebase Authentication
5. Delete user profile data from database (using UID as foreign key)
6. Delete user assessment results
7. Return success response

**Critical**: Firebase user must be deleted LAST (after database cleanup) because once Firebase user is deleted, authentication fails and we lose the ability to verify the user's identity for cleanup operations.

## Error Handling

### Common Errors

#### Auth V1 Errors
```javascript
// Invalid password
{
  "success": false,
  "message": "Invalid password"
}

// User not found
{
  "success": false,
  "message": "User not found"
}

// Database error
{
  "success": false,
  "message": "Failed to delete account"
}
```

#### Auth V2 Errors (Firebase)
```javascript
// Invalid password (mapped to Indonesian)
{
  "code": "auth/wrong-password",
  "message": "Password salah"
}

// User not found in Firebase
{
  "code": "auth/user-not-found",
  "message": "Pengguna tidak ditemukan"
}

// Token expired
{
  "code": "auth/id-token-expired",
  "message": "Sesi Anda telah berakhir. Silakan login ulang"
}

// Network error
{
  "code": "auth/network-request-failed",
  "message": "Gagal terhubung ke server. Periksa koneksi internet Anda"
}
```

### Error Display

**Auth V2**: Uses `getFirebaseErrorMessage()` to show Indonesian error messages
```typescript
const errorMsg = authVersion === 'v2' 
  ? getFirebaseErrorMessage(err)
  : (err.response?.data?.message || err.message || 'Failed to delete account');

setError(errorMsg);
```

**Auth V1**: Shows backend error message directly
```typescript
setError(err.response?.data?.message || 'Failed to delete account');
```

## Security Considerations

### 1. Password Verification
- **NEVER** delete accounts without password verification
- Both V1 and V2 require current password
- Backend must verify password before deletion

### 2. Token Validation
- Auth V1: JWT token must be valid
- Auth V2: Firebase ID token must be valid and not expired

### 3. Data Cleanup Order
**Auth V2 Critical Sequence**:
1. Verify password with Firebase
2. Delete database records (profile, results, etc.)
3. Delete Firebase user (LAST STEP)

**Why this order?**
- Once Firebase user is deleted, all future auth requests fail
- Database cleanup requires authenticated requests
- Must clean database BEFORE deleting Firebase account

### 4. No Account Recovery
- Deleted accounts CANNOT be recovered
- Users are warned multiple times before deletion
- Success message shown briefly before logout

### 5. Session Cleanup
- After deletion, `logout()` is called
- V2: `tokenService.clearTokens()` called automatically by `authV2Service.deleteAccount()`
- V1: Tokens cleared by logout flow
- User redirected to login page

## User Experience Flow

### Step-by-Step User Journey

1. **Navigate to Profile Page**
   - User sees "Danger Zone" section at bottom
   - Red warning styling indicates danger

2. **Click "Delete Account" Button**
   - Modal opens with dark overlay
   - Clear warning about permanent deletion
   - Lists what will be deleted (results, profile, tokens)

3. **Enter Password**
   - Auto-focused password input
   - Helper text explains why password is needed
   - "Delete My Account" button disabled until password entered

4. **Confirm Deletion**
   - Button shows loading state ("Deleting...")
   - Backend processes deletion
   - Takes 1-3 seconds typically

5. **Success Feedback**
   - Green success alert: "Account deleted successfully. Redirecting..."
   - Modal closes automatically
   - 2-second pause to read message

6. **Automatic Logout**
   - `logout()` called after 2 seconds
   - User redirected to login page
   - All auth data cleared

### Error Recovery
If deletion fails:
- Error message shown in modal (not dismissed)
- Password field remains filled
- User can retry immediately
- Modal stays open for correction

## Testing Checklist

### Manual Testing Required

#### Auth V1 Account Deletion
- [ ] Login with V1 account
- [ ] Navigate to profile page
- [ ] Scroll to "Danger Zone"
- [ ] Click "Delete Account" → Modal opens
- [ ] Try deleting without password → Error shown
- [ ] Enter wrong password → "Invalid password" error
- [ ] Enter correct password → Account deleted
- [ ] Verify success message appears
- [ ] Verify automatic redirect to login after 2s
- [ ] Try logging in with deleted account → Should fail
- [ ] Verify database records deleted (profile, results)

#### Auth V2 Account Deletion (Firebase)
- [ ] Enable V2: `NEXT_PUBLIC_USE_AUTH_V2=true`, `NEXT_PUBLIC_AUTH_V2_ROLLOUT_PERCENTAGE=100`
- [ ] Register new V2 account
- [ ] Navigate to profile page
- [ ] Scroll to "Danger Zone"
- [ ] Click "Delete Account" → Modal opens
- [ ] Try deleting without password → Error shown
- [ ] Enter wrong password → Firebase error in Indonesian
- [ ] Enter correct Firebase password → Account deleted
- [ ] Verify `authV2Service.deleteAccount()` called
- [ ] Verify `tokenService.clearTokens()` called
- [ ] Verify success message appears
- [ ] Verify automatic redirect to login after 2s
- [ ] Try logging in with deleted account → Firebase "user not found"
- [ ] Verify Firebase user deleted (check Firebase Console)
- [ ] Verify database records deleted (profile, results)

#### Edge Cases
- [ ] Token expired during deletion → Auto-refresh or error
- [ ] Network error during deletion → Error handled gracefully
- [ ] Click cancel in modal → Modal closes, no deletion
- [ ] Close modal (ESC or click outside) → No deletion occurs
- [ ] Multiple rapid clicks on "Delete My Account" → Only one request sent
- [ ] User has active assessments → Deleted anyway (user warned)
- [ ] User has token balance → Lost (user warned in modal)

### Automated Testing (Future)
```typescript
describe('Account Deletion', () => {
  it('should show delete account button in danger zone', () => {});
  it('should open confirmation modal on delete click', () => {});
  it('should require password for deletion', () => {});
  it('should show error for invalid password (V1)', () => {});
  it('should show Firebase error for invalid password (V2)', () => {});
  it('should successfully delete V1 account', () => {});
  it('should successfully delete V2 account', () => {});
  it('should call logout after successful deletion', () => {});
  it('should clear all tokens after deletion', () => {});
  it('should redirect to login page after deletion', () => {});
});
```

## Backend Requirements

### Current Backend Support
- ✅ Auth V1: `DELETE /api/auth/account` endpoint exists
- ✅ Auth V2: `DELETE /api/auth/v2/user` endpoint exists
- ✅ Password verification implemented in both
- ✅ Database cleanup for user records

### Required Backend Features
1. **Transaction Support**: Ensure atomic deletion (all or nothing)
2. **Cascade Deletion**: 
   - Delete user → Delete profile → Delete results → Delete tokens
   - Use database foreign key constraints with `ON DELETE CASCADE`
3. **Firebase Integration** (V2):
   - Firebase Admin SDK for user deletion
   - Password verification via Firebase Auth
4. **Audit Logging**: Log all account deletions for compliance
5. **Rate Limiting**: Prevent deletion spam attacks

### Database Schema Considerations
```sql
-- Ensure cascade deletion is set up
ALTER TABLE user_profiles 
  ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE CASCADE;

ALTER TABLE assessment_results 
  ADD CONSTRAINT fk_user
  FOREIGN KEY (user_id) REFERENCES users(id)
  ON DELETE CASCADE;

-- For Auth V2, use Firebase UID as foreign key
ALTER TABLE user_profiles_v2
  ADD CONSTRAINT fk_firebase_user
  FOREIGN KEY (firebase_uid) REFERENCES firebase_users(uid)
  ON DELETE CASCADE;
```

## Known Limitations

### Current Implementation
1. **No "soft delete"**: Account is permanently deleted, not just deactivated
2. **No grace period**: Deletion is immediate, no 30-day recovery window
3. **No email confirmation**: Only password required, no email link verification
4. **No data export**: Users cannot download their data before deletion (GDPR consideration)

### Future Enhancements
1. **Soft Delete**: Add `is_deleted` flag and delete after 30 days
2. **Email Confirmation**: Send email with confirmation link before deletion
3. **Data Export**: Allow users to download JSON of all their data
4. **Account Deactivation**: Option to deactivate instead of delete
5. **Deletion Reasons**: Ask why user is deleting account (analytics)

## Compliance Considerations

### GDPR (EU Users)
- ✅ Users can delete their personal data
- ⚠️ No audit trail of deletion (should be logged)
- ⚠️ No data export before deletion (required by GDPR)
- ⚠️ No confirmation of complete deletion (email receipt)

### Recommendations for Compliance
1. **Audit Logging**: Log all deletions with timestamp, IP, user ID
2. **Email Receipt**: Send confirmation email after deletion
3. **Data Export**: Implement "Download My Data" feature
4. **Retention Policy**: Document how long deleted data is retained (backups)

## Troubleshooting

### "Password is required to delete your account"
**Cause**: User clicked delete without entering password

**Solution**: Enter password in the confirmation modal

### "Invalid password" (Auth V1)
**Cause**: Wrong password entered

**Solution**: Enter correct current password

### Firebase Error: "Password salah" (Auth V2)
**Cause**: Wrong Firebase password entered

**Solution**: Enter correct Firebase account password (same as login)

### "Failed to delete account" (Generic Error)
**Cause**: Backend error or network issue

**Solutions**:
- Check network connectivity
- Try again in a few minutes
- Check backend logs for specific error
- Verify backend services are running

### Account Deletion Succeeds But User Not Logged Out
**Cause**: `logout()` function failed or setTimeout didn't trigger

**Solutions**:
- Manually navigate to login page
- Clear browser cookies/localStorage
- Refresh the page

### Firebase User Deleted But Database Records Remain (V2)
**Cause**: Backend deletion order incorrect (Firebase deleted first)

**Solution**: Backend must delete database records BEFORE Firebase user

## Related Documentation
- [Auth V2 Context Implementation](./AUTH_V2_CONTEXT_IMPLEMENTATION.md)
- [Auth V2 Profile Update Implementation](./AUTH_V2_PROFILE_UPDATE_IMPLEMENTATION.md)
- [Auth V2 Password Reset Implementation](./AUTH_V2_PASSWORD_RESET_IMPLEMENTATION.md)
- [Firebase Error Handling](../src/utils/firebase-errors.js)
- [API Endpoints Configuration](../src/config/api.js)

## Completion Status
- ✅ ProfilePage.tsx updated with delete account UI
- ✅ Confirmation modal with password input
- ✅ Dual auth support (V1 and V2)
- ✅ Security warnings and danger styling
- ✅ Firebase error message integration
- ✅ Automatic logout after deletion
- ✅ TypeScript compilation successful
- ✅ Documentation complete
- ⏳ Manual testing pending
- ⏳ GDPR compliance enhancements (future)

**Last Updated**: 2024-10-04
**Implementation Status**: Complete - Ready for Testing
