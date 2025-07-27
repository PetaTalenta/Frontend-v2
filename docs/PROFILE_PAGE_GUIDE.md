# 👤 Profile Page Guide

## Overview
Halaman profile yang lengkap untuk PetaTalenta ATMA Platform yang memungkinkan user untuk melihat dan mengedit informasi akun mereka, serta mengubah password.

## 🎯 Fitur Utama

### 1. **Profile Information Display**
- Menampilkan informasi akun user yang sedang login
- Avatar dengan inisial nama atau email
- Status akun (Active/Inactive)
- User type badge
- Token balance
- Member since date

### 2. **Profile Editing**
- Edit username
- Edit full name
- Edit date of birth
- Edit gender (male/female)
- Real-time form validation
- Save/Cancel functionality

### 3. **Password Management**
- Change password form
- Current password verification
- New password confirmation
- Password visibility toggle
- Secure password requirements

### 4. **API Integration**
- Real API integration dengan fallback ke mock data
- Proper error handling
- Loading states
- Success/error notifications

## 🔧 Implementasi Teknis

### File Structure
```
├── app/profile/page.tsx                  # Profile route
├── components/profile/
│   └── ProfilePage.tsx                   # Main profile component
├── services/profile-api.ts               # Profile API service
├── app/api/proxy/auth/
│   ├── profile/route.ts                  # Profile API proxy
│   └── change-password/route.ts          # Password change API proxy
└── docs/PROFILE_PAGE_GUIDE.md           # This guide
```

### API Endpoints Used
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `POST /api/auth/change-password` - Change password

### Profile Data Structure
```typescript
interface UserProfile {
  user: {
    id: string;
    email: string;
    username: string;
    user_type: string;
    is_active: boolean;
    token_balance: number;
    created_at: string;
    updated_at: string;
    last_login?: string;
    profile?: {
      user_id: string;
      full_name: string;
      date_of_birth: string;
      gender: string;
      created_at: string;
      updated_at: string;
    };
  };
}
```

## 🎨 UI Components

### ProfilePage Component
- Responsive card layout
- Form dengan validation
- Loading states
- Error/success alerts
- Avatar dengan fallback
- Badge untuk status

### Form Fields
- **Username**: Alphanumeric, 3-100 characters
- **Full Name**: Maximum 100 characters
- **Date of Birth**: ISO date format, tidak boleh future date
- **Gender**: Male/Female dropdown
- **School ID**: Positive integer

### Password Form
- **Current Password**: Required untuk verification
- **New Password**: Minimum 8 characters, harus ada letter dan number
- **Confirm Password**: Harus match dengan new password

## 🔐 Security Features

### Authentication
- Requires valid JWT token
- Protected route (hanya bisa diakses setelah login)
- Authorization header validation

### Password Security
- Current password verification
- Strong password requirements
- Password confirmation
- Secure API transmission

### Data Validation
- Client-side form validation
- Server-side validation
- Input sanitization
- Error handling

## 🚀 Usage

### Accessing Profile Page
1. User harus login terlebih dahulu
2. Klik avatar di header dashboard
3. Pilih "Profile" dari dropdown menu
4. Atau navigate langsung ke `/profile`

### Editing Profile
1. Klik "Edit Profile" button
2. Ubah field yang diinginkan
3. Klik "Save Changes" atau "Cancel"
4. Success/error message akan ditampilkan

### Changing Password
1. Klik "Change Password" button
2. Masukkan current password
3. Masukkan new password (min 8 chars)
4. Confirm new password
5. Klik "Change Password"

## 🔄 API Integration

### Real API
- Production: `https://api.chhrone.web.id`
- Development: Proxy melalui `/api/proxy/auth/`

### Mock API Fallback
- Automatic fallback jika real API tidak tersedia
- Mock data untuk development
- Consistent response format

### Error Handling
- Network errors
- Authentication errors
- Validation errors
- Server errors
- User-friendly error messages

## 🎯 Features Highlights

### Responsive Design
- Mobile-friendly layout
- Adaptive card sizing
- Touch-friendly buttons
- Proper spacing

### User Experience
- Intuitive navigation
- Clear visual feedback
- Loading indicators
- Success/error notifications
- Smooth transitions

### Accessibility
- Proper labels
- Keyboard navigation
- Screen reader friendly
- Color contrast compliance

## 🔧 Configuration

### Environment Variables
```env
NODE_ENV=development|production
NEXT_PUBLIC_USE_MOCK_API=true|false
```

### API Timeouts
- Profile requests: 15 seconds
- Health checks: 5 seconds
- Password changes: 15 seconds

## 🐛 Troubleshooting

### Common Issues
1. **Profile not loading**: Check authentication token
2. **Update fails**: Verify field validation
3. **Password change fails**: Check current password
4. **API errors**: Check network connection

### Debug Mode
- Console logs untuk API calls
- Error details dalam browser console
- Network tab untuk request/response

## 🔮 Future Enhancements

### Planned Features
- Profile picture upload
- Email change functionality
- Account deletion
- Privacy settings
- Notification preferences

### Potential Improvements
- Real-time validation
- Auto-save drafts
- Profile completion progress
- Social media links
- Two-factor authentication

## 📝 Notes

- Profile page menggunakan same styling pattern dengan dashboard
- Consistent dengan design system yang ada
- Fully integrated dengan authentication system
- Ready untuk production use
- Extensible untuk future features
