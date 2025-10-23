// Profile types untuk UI components
// File ini berisi definisi types yang digunakan untuk profile page

export interface UserProfile {
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

export interface ProfileFormData {
  username: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
}

export interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  isEditing: boolean;
  isUpdating: boolean;
  isChangingPassword: boolean;
  showPasswordForm: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  error: string;
  success: string;
  partialUpdateWarning: string;
  showDeleteModal: boolean;
  deletePassword: string;
  isDeleting: boolean;
}

export interface ProfileActions {
  loadProfile: () => Promise<void>;
  handleInputChange: (field: keyof ProfileFormData, value: string) => void;
  handlePasswordChange: (field: keyof PasswordFormData, value: string) => void;
  handleSaveProfile: () => Promise<void>;
  handleChangePassword: () => Promise<void>;
  handleDeleteAccount: () => Promise<void>;
  setIsEditing: (value: boolean) => void;
  setShowPasswordForm: (value: boolean) => void;
  setShowDeleteModal: (value: boolean) => void;
  setDeletePassword: (value: string) => void;
  setShowCurrentPassword: (value: boolean) => void;
  setShowNewPassword: (value: boolean) => void;
}

// Utility types
export type Gender = 'male' | 'female' | '';

export interface UserBadge {
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  text: string;
}

// UI State types untuk form validation
export interface FormValidation {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface PasswordValidation {
  isValid: boolean;
  minLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}