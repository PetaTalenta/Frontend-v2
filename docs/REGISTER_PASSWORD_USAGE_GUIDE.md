# Panduan Penggunaan PasswordStrengthIndicator

## 📦 Quick Start

### 1. Import Komponen
```jsx
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
```

### 2. Basic Usage
```jsx
import { useForm } from 'react-hook-form';

function MyForm() {
  const { register, watch } = useForm();
  const password = watch('password');
  
  return (
    <div>
      <input
        {...register('password', {
          required: 'Password wajib diisi',
          minLength: { value: 6, message: 'Password minimal 6 karakter' },
          validate: {
            hasNumber: (value) => /\d/.test(value) || 'Password harus mengandung angka',
            hasUpperCase: (value) => /[A-Z]/.test(value) || 'Password harus mengandung huruf besar',
            hasLowerCase: (value) => /[a-z]/.test(value) || 'Password harus mengandung huruf kecil'
          }
        })}
        type="password"
      />
      
      <PasswordStrengthIndicator password={password} />
    </div>
  );
}
```

---

## 🎯 Use Cases

### 1. Register Page (Current Implementation)
```jsx
// src/components/auth/Register.jsx
const Register = ({ onRegister }) => {
  const { register, watch } = useForm();
  const password = watch('password');
  
  return (
    <form>
      {/* Other fields... */}
      
      <div>
        <label>Password</label>
        <input
          {...register('password', { /* validations */ })}
          type="password"
        />
        <PasswordStrengthIndicator password={password} />
      </div>
      
      {/* Rest of form... */}
    </form>
  );
};
```

---

### 2. Change Password Page
```jsx
// src/components/profile/ChangePasswordForm.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PasswordStrengthIndicator from '../auth/PasswordStrengthIndicator';

const ChangePasswordForm = () => {
  const { register, watch, handleSubmit } = useForm();
  const newPassword = watch('newPassword');
  
  const onSubmit = async (data) => {
    // Change password logic
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Current Password</label>
        <input
          {...register('currentPassword', { required: true })}
          type="password"
        />
      </div>
      
      <div>
        <label>New Password</label>
        <input
          {...register('newPassword', {
            required: 'New password is required',
            minLength: { value: 6, message: 'Minimal 6 karakter' },
            validate: {
              hasNumber: (v) => /\d/.test(v) || 'Harus ada angka',
              hasUpperCase: (v) => /[A-Z]/.test(v) || 'Harus ada huruf besar',
              hasLowerCase: (v) => /[a-z]/.test(v) || 'Harus ada huruf kecil'
            }
          })}
          type="password"
        />
        
        {/* Password Strength Indicator */}
        <PasswordStrengthIndicator password={newPassword} />
      </div>
      
      <div>
        <label>Confirm New Password</label>
        <input
          {...register('confirmPassword', {
            validate: (value) => value === newPassword || 'Password tidak sama'
          })}
          type="password"
        />
      </div>
      
      <button type="submit">Change Password</button>
    </form>
  );
};

export default ChangePasswordForm;
```

---

### 3. Reset Password Page
```jsx
// src/components/auth/ResetPasswordForm.jsx
import { useForm } from 'react-hook-form';
import { useRouter, useSearchParams } from 'next/navigation';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const { register, watch, handleSubmit } = useForm();
  const newPassword = watch('newPassword');
  
  const onSubmit = async (data) => {
    try {
      // Reset password API call with token
      await resetPasswordAPI({
        token,
        newPassword: data.newPassword
      });
      
      router.push('/auth?success=password-reset');
    } catch (error) {
      console.error('Reset password error:', error);
    }
  };
  
  return (
    <div className="max-w-md mx-auto">
      <h2>Reset Your Password</h2>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>New Password</label>
          <input
            {...register('newPassword', {
              required: 'Password wajib diisi',
              minLength: { value: 6, message: 'Minimal 6 karakter' },
              validate: {
                hasNumber: (v) => /\d/.test(v) || 'Harus ada angka',
                hasUpperCase: (v) => /[A-Z]/.test(v) || 'Harus ada huruf besar',
                hasLowerCase: (v) => /[a-z]/.test(v) || 'Harus ada huruf kecil'
              }
            })}
            type="password"
          />
          
          <PasswordStrengthIndicator password={newPassword} />
        </div>
        
        <div>
          <label>Confirm Password</label>
          <input
            {...register('confirmPassword', {
              validate: (value) => value === newPassword || 'Password tidak sama'
            })}
            type="password"
          />
        </div>
        
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
};

export default ResetPasswordForm;
```

---

### 4. Admin Create User Page
```jsx
// src/components/admin/CreateUserForm.jsx
import { useForm } from 'react-hook-form';
import PasswordStrengthIndicator from '../auth/PasswordStrengthIndicator';

const CreateUserForm = () => {
  const { register, watch, handleSubmit } = useForm();
  const password = watch('password');
  
  const onSubmit = async (data) => {
    // Create user logic
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Email</label>
        <input
          {...register('email', { required: true, pattern: /^\S+@\S+$/i })}
          type="email"
        />
      </div>
      
      <div>
        <label>Full Name</label>
        <input {...register('fullName', { required: true })} />
      </div>
      
      <div>
        <label>Password</label>
        <input
          {...register('password', {
            required: 'Password wajib diisi',
            minLength: { value: 6, message: 'Minimal 6 karakter' },
            validate: {
              hasNumber: (v) => /\d/.test(v) || 'Harus ada angka',
              hasUpperCase: (v) => /[A-Z]/.test(v) || 'Harus ada huruf besar',
              hasLowerCase: (v) => /[a-z]/.test(v) || 'Harus ada huruf kecil'
            }
          })}
          type="password"
        />
        
        <PasswordStrengthIndicator password={password} />
      </div>
      
      <button type="submit">Create User</button>
    </form>
  );
};

export default CreateUserForm;
```

---

## 🎨 Customization Options

### Option 1: Custom Criteria (Remove Optional Special Char)
```jsx
// Create a modified version for stricter validation
const StrictPasswordStrengthIndicator = ({ password = '' }) => {
  const criteria = useMemo(() => {
    return [
      {
        id: 'minLength',
        label: 'Minimal 8 karakter', // Changed from 6
        met: password.length >= 8,
        required: true
      },
      {
        id: 'hasNumber',
        label: 'Mengandung minimal satu angka',
        met: /\d/.test(password),
        required: true
      },
      {
        id: 'hasUpperCase',
        label: 'Mengandung huruf besar',
        met: /[A-Z]/.test(password),
        required: true
      },
      {
        id: 'hasLowerCase',
        label: 'Mengandung huruf kecil',
        met: /[a-z]/.test(password),
        required: true
      },
      {
        id: 'hasSpecialChar',
        label: 'Mengandung karakter spesial (!@#$%)',
        met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        required: true // Now required instead of optional
      }
    ];
  }, [password]);
  
  // Rest of component logic...
};
```

---

### Option 2: Minimal UI Version (No Progress Bar)
```jsx
// Simplified version for tight spaces
const MinimalPasswordStrengthIndicator = ({ password = '' }) => {
  const isValid = useMemo(() => {
    return (
      password.length >= 6 &&
      /\d/.test(password) &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password)
    );
  }, [password]);
  
  if (!password) return null;
  
  return (
    <div className="text-xs mt-1">
      {isValid ? (
        <span className="text-green-600 flex items-center">
          <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Password memenuhi kriteria
        </span>
      ) : (
        <span className="text-gray-500">
          Password harus: 6+ karakter, angka, huruf besar & kecil
        </span>
      )}
    </div>
  );
};
```

---

### Option 3: Compact Checklist (No Progress Bar)
```jsx
// Checklist only, no progress bar
const CompactPasswordStrengthIndicator = ({ password = '' }) => {
  const criteria = [
    { id: 'length', label: '6+ chars', met: password.length >= 6 },
    { id: 'number', label: 'Number', met: /\d/.test(password) },
    { id: 'upper', label: 'Uppercase', met: /[A-Z]/.test(password) },
    { id: 'lower', label: 'Lowercase', met: /[a-z]/.test(password) }
  ];
  
  return (
    <div className="flex gap-2 mt-2 text-xs">
      {criteria.map(c => (
        <span key={c.id} className={c.met ? 'text-green-600' : 'text-gray-400'}>
          {c.met ? '✓' : '○'} {c.label}
        </span>
      ))}
    </div>
  );
};
```

---

## 🔧 Advanced Usage

### With Custom Validation Messages
```jsx
const { register, watch, formState: { errors } } = useForm({
  mode: 'onChange' // Enable real-time validation
});

const password = watch('password');

<div>
  <input
    {...register('password', {
      required: 'Password tidak boleh kosong',
      minLength: {
        value: 6,
        message: 'Password terlalu pendek (min 6 karakter)'
      },
      maxLength: {
        value: 128,
        message: 'Password terlalu panjang (max 128 karakter)'
      },
      validate: {
        hasNumber: (value) => 
          /\d/.test(value) || 'Tambahkan minimal satu angka (0-9)',
        hasUpperCase: (value) => 
          /[A-Z]/.test(value) || 'Tambahkan minimal satu huruf besar (A-Z)',
        hasLowerCase: (value) => 
          /[a-z]/.test(value) || 'Tambahkan minimal satu huruf kecil (a-z)',
        noSpaces: (value) => 
          !/\s/.test(value) || 'Password tidak boleh mengandung spasi'
      }
    })}
    type="password"
  />
  
  {errors.password && (
    <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>
  )}
  
  <PasswordStrengthIndicator password={password} />
</div>
```

---

### With Async Validation (Check Password Breach)
```jsx
const checkPasswordBreach = async (password) => {
  // This is a simplified example
  // In production, use HIBP API or similar
  const commonPasswords = ['password', '123456', 'qwerty'];
  return !commonPasswords.includes(password.toLowerCase());
};

<input
  {...register('password', {
    required: 'Password wajib diisi',
    validate: {
      // Sync validations
      hasNumber: (v) => /\d/.test(v) || 'Harus ada angka',
      hasUpperCase: (v) => /[A-Z]/.test(v) || 'Harus ada huruf besar',
      hasLowerCase: (v) => /[a-z]/.test(v) || 'Harus ada huruf kecil',
      
      // Async validation (debounced)
      notBreached: async (value) => {
        if (value.length < 6) return true; // Skip if too short
        
        const isSecure = await checkPasswordBreach(value);
        return isSecure || 'Password ini terlalu umum dan tidak aman';
      }
    }
  })}
  type="password"
/>

<PasswordStrengthIndicator password={password} />
```

---

## 🎯 Testing Examples

### Unit Test (Jest + Testing Library)
```jsx
// PasswordStrengthIndicator.test.jsx
import { render, screen } from '@testing-library/react';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

describe('PasswordStrengthIndicator', () => {
  test('shows empty state when no password', () => {
    render(<PasswordStrengthIndicator password="" />);
    expect(screen.getByText(/Syarat Password/i)).toBeInTheDocument();
  });
  
  test('shows weak strength for simple password', () => {
    render(<PasswordStrengthIndicator password="test" />);
    expect(screen.getByText(/Lemah/i)).toBeInTheDocument();
  });
  
  test('shows strong strength for complex password', () => {
    render(<PasswordStrengthIndicator password="Test123!" />);
    expect(screen.getByText(/Kuat/i)).toBeInTheDocument();
  });
  
  test('checks all criteria for strong password', () => {
    render(<PasswordStrengthIndicator password="Test123!" />);
    
    const checkmarks = screen.getAllByTestId('criterion-met');
    expect(checkmarks).toHaveLength(4); // 4 out of 5 criteria met
  });
});
```

---

### E2E Test (Playwright)
```javascript
// register.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Register Form Password Validation', () => {
  test('shows password strength indicator as user types', async ({ page }) => {
    await page.goto('/auth');
    
    // Click register tab
    await page.click('text=Register');
    
    // Type weak password
    await page.fill('input[type="password"]', 'test');
    await expect(page.locator('text=Lemah')).toBeVisible();
    
    // Type medium password
    await page.fill('input[type="password"]', 'Test123');
    await expect(page.locator('text=Sedang')).toBeVisible();
    
    // Type strong password
    await page.fill('input[type="password"]', 'Test123!');
    await expect(page.locator('text=Kuat')).toBeVisible();
    await expect(page.locator('text=Password Anda sudah kuat')).toBeVisible();
  });
  
  test('validates all password criteria', async ({ page }) => {
    await page.goto('/auth');
    await page.click('text=Register');
    
    const passwordInput = page.locator('input[name="password"]');
    
    // Check initial state
    await expect(page.locator('text=Minimal 6 karakter')).toBeVisible();
    
    // Type password that meets all criteria
    await passwordInput.fill('Test123!@');
    
    // All checkmarks should be green
    const checkmarks = page.locator('svg[data-met="true"]');
    await expect(checkmarks).toHaveCount(5);
  });
});
```

---

## 📚 Props Documentation

### PasswordStrengthIndicator Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `password` | `string` | `''` | The password string to validate |

### Return Values (Internal State)

| State | Type | Description |
|-------|------|-------------|
| `criteria` | `Array` | Array of password criteria with met status |
| `strength.percentage` | `number` | Password strength percentage (0-100) |
| `strength.level` | `string` | 'weak' \| 'medium' \| 'strong' |
| `strength.color` | `string` | Tailwind color class for progress bar |
| `strength.textColor` | `string` | Tailwind color class for text |

---

## 🎨 Styling Customization

### Custom Colors
```jsx
// Create themed version
const ThemedPasswordStrengthIndicator = ({ password, theme = 'blue' }) => {
  const colorMap = {
    blue: {
      weak: 'bg-blue-200',
      medium: 'bg-blue-400',
      strong: 'bg-blue-600'
    },
    purple: {
      weak: 'bg-purple-200',
      medium: 'bg-purple-400',
      strong: 'bg-purple-600'
    }
  };
  
  // Use theme colors instead of red/yellow/green
  // ... rest of component
};
```

---

## 💡 Tips & Best Practices

### 1. Performance Optimization
```jsx
// Use useMemo to prevent unnecessary recalculations
const criteria = useMemo(() => {
  return [/* criteria array */];
}, [password]);
```

### 2. Accessibility
```jsx
// Add aria-labels
<div role="progressbar" aria-valuenow={strength.percentage} aria-valuemin="0" aria-valuemax="100">
  <div className="progress-bar" style={{ width: `${strength.percentage}%` }} />
</div>
```

### 3. Internationalization
```jsx
const messages = {
  en: {
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong'
  },
  id: {
    weak: 'Lemah',
    medium: 'Sedang',
    strong: 'Kuat'
  }
};

// Use: messages[locale].weak
```

---

## 🚀 Next Steps

1. Implement in other password forms (Change Password, Reset Password)
2. Add unit tests for edge cases
3. Add E2E tests with Playwright
4. Consider adding password generator feature
5. Integrate with password breach checking API (optional)
6. Add internationalization support
7. Track analytics on password strength distribution

---

**That's it!** You now have a comprehensive, reusable password strength indicator component that can be used across your entire application. 🎉
