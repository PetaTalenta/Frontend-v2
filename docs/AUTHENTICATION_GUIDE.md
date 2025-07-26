# 🔐 Authentication System Guide

## Overview
Sistem autentikasi lengkap untuk PetaTalenta ATMA Platform dengan Next.js, menggunakan JWT tokens dan route protection middleware.

## 🎯 Fitur Utama

### 1. **Secure Authentication**
- JWT-based token authentication
- Secure password handling
- Persistent sessions dengan localStorage dan cookies
- Automatic token refresh capability

### 2. **User Management**
- Login dan registration forms
- User profile management
- Session management
- Logout functionality

### 3. **Route Protection**
- Server-side middleware protection
- Client-side route guards
- Automatic redirects untuk unauthorized access
- Protected dan public route definitions

### 4. **UI Components**
- Modern authentication forms
- Responsive design
- Loading states dan error handling
- User dropdown menu dengan profile info

## 🔧 Implementasi Teknis

### File Structure
```
├── contexts/AuthContext.tsx              # Authentication context
├── components/auth/
│   ├── AuthPage.tsx                      # Main auth page
│   ├── Login.tsx                         # Login form
│   ├── Register.tsx                      # Registration form
│   └── AuthGuard.tsx                     # Client-side route guard
├── app/auth/page.tsx                     # Auth route
├── middleware.ts                         # Server-side route protection
└── docs/AUTHENTICATION_GUIDE.md         # This guide
```

### Authentication Flow

1. **Initial Load**
   ```typescript
   // Check localStorage for existing token
   const savedToken = localStorage.getItem('token');
   const savedUser = localStorage.getItem('user');
   
   // Set cookie for server-side middleware
   document.cookie = `token=${savedToken}; path=/; max-age=${7 * 24 * 60 * 60}`;
   ```

2. **Login Process**
   ```typescript
   const login = (token: string, user: User) => {
     // Store in state
     setToken(token);
     setUser(user);
     
     // Persist in localStorage
     localStorage.setItem('token', token);
     localStorage.setItem('user', JSON.stringify(user));
     
     // Set cookie for middleware
     document.cookie = `token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
     
     // Redirect to dashboard
     router.push('/dashboard');
   };
   ```

3. **Route Protection**
   ```typescript
   // Server-side middleware
   export function middleware(request: NextRequest) {
     const token = request.cookies.get('token')?.value;
     const isProtectedRoute = protectedRoutes.some(route => 
       pathname.startsWith(route)
     );
     
     if (isProtectedRoute && !token) {
       return NextResponse.redirect(new URL('/auth', request.url));
     }
   }
   ```

## 🚀 Cara Menggunakan

### 1. Setup Authentication
```tsx
// app/layout.tsx
import { AuthProvider } from '../contexts/AuthContext';
import AuthGuard from '../components/auth/AuthGuard';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthGuard>
            {children}
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 2. Using Auth Context
```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please login</div>;
  }
  
  return (
    <div>
      Welcome, {user?.name}!
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### 3. Protected Routes
Routes yang memerlukan authentication:
- `/dashboard` - Main dashboard
- `/assessment` - Assessment pages
- `/results` - Results pages
- `/select-assessment` - Assessment selection

Routes yang dapat diakses tanpa authentication:
- `/auth` - Login/Register page

## 🎨 UI Components

### AuthPage Component
- Split layout dengan branding di kiri
- Tab navigation untuk Login/Register
- Responsive design
- Animated background

### Login Form
- Email dan password validation
- Show/hide password toggle
- Remember me checkbox
- Demo credentials display
- Loading states

### Register Form
- Full name, email, password fields
- Password confirmation
- Terms and conditions checkbox
- Form validation
- Loading states

### User Menu (Dashboard Header)
- User avatar dengan initials
- Dropdown menu dengan profile info
- Logout functionality
- Settings dan profile links

## 📱 Demo Credentials

Untuk testing, gunakan credentials berikut:

```
Email: demo@petatalenta.com
Password: demo123

Email: test@example.com  
Password: test123
```

## 🔄 Route Configuration

### Protected Routes
```typescript
const protectedRoutes = [
  '/dashboard',
  '/assessment',
  '/assessment-demo', 
  '/select-assessment',
  '/results',
  '/all-questions'
];
```

### Public Routes
```typescript
const publicRoutes = ['/auth'];
```

### Middleware Logic
- Root path (`/`) redirects berdasarkan authentication status
- Protected routes redirect ke `/auth` jika tidak authenticated
- Public routes redirect ke `/dashboard` jika sudah authenticated

## 🛡️ Security Features

### Token Management
- JWT tokens stored di localStorage dan cookies
- Automatic cookie setting untuk server-side middleware
- Token expiration handling (7 days default)
- Secure cookie flags

### Route Protection
- Server-side middleware protection
- Client-side route guards
- Automatic redirects
- Loading states selama authentication check

### Form Security
- Input validation dan sanitization
- Password strength requirements
- CSRF protection ready
- XSS prevention

## 🔮 Future Enhancements

1. **Real API Integration**
   - Connect to actual authentication API
   - Proper error handling
   - Token refresh mechanism

2. **Enhanced Security**
   - Two-factor authentication
   - Password reset functionality
   - Account verification

3. **User Management**
   - Profile editing
   - Avatar upload
   - Account settings

4. **Social Authentication**
   - Google OAuth
   - GitHub OAuth
   - Microsoft OAuth

## 🐛 Troubleshooting

### Common Issues

1. **Infinite Redirect Loop**
   - Check middleware configuration
   - Verify token format dan expiration
   - Clear localStorage dan cookies

2. **Authentication Not Persisting**
   - Check cookie settings
   - Verify localStorage access
   - Check browser security settings

3. **Route Protection Not Working**
   - Verify middleware.ts configuration
   - Check route patterns
   - Ensure cookies are set properly

### Debug Tips
```javascript
// Check authentication state
console.log('Auth State:', {
  isAuthenticated: !!localStorage.getItem('token'),
  user: JSON.parse(localStorage.getItem('user') || '{}'),
  cookie: document.cookie
});

// Clear authentication
localStorage.removeItem('token');
localStorage.removeItem('user');
document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
```

## 📚 References

- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [JWT.io](https://jwt.io/)
- [React Hook Form](https://react-hook-form.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

*Dibuat untuk sistem ATMA (AI-Driven Talent Mapping Assessment) - PetaTalenta*
