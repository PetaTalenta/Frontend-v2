// Dummy data untuk profile page
// File ini berisi data statis yang digunakan untuk UI display purposes

import { UserProfile, ProfileFormData, PasswordFormData } from '../types/profile';

// Dummy profile data
export const dummyUserProfile: UserProfile = {
  user: {
    id: "user-123",
    email: "john.doe@example.com",
    username: "johndoe",
    user_type: "user",
    is_active: true,
    token_balance: 150,
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-20T14:45:00Z",
    last_login: "2024-01-22T09:15:00Z",
    profile: {
      user_id: "user-123",
      full_name: "John Doe",
      date_of_birth: "1990-05-15",
      gender: "male",
      created_at: "2024-01-15T10:30:00Z",
      updated_at: "2024-01-20T14:45:00Z"
    }
  }
};

// Dummy form data
export const dummyProfileFormData: ProfileFormData = {
  username: "johndoe",
  full_name: "John Doe",
  date_of_birth: "1990-05-15",
  gender: "male"
};

export const dummyPasswordFormData: PasswordFormData = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: ""
};

// Alternative dummy profiles untuk testing
export const alternativeDummyProfiles: UserProfile[] = [
  {
    user: {
      id: "user-456",
      email: "jane.smith@example.com",
      username: "janesmith",
      user_type: "premium",
      is_active: true,
      token_balance: 500,
      created_at: "2023-12-10T08:20:00Z",
      updated_at: "2024-01-18T16:30:00Z",
      last_login: "2024-01-22T11:45:00Z",
      profile: {
        user_id: "user-456",
        full_name: "Jane Smith",
        date_of_birth: "1992-08-22",
        gender: "female",
        created_at: "2023-12-10T08:20:00Z",
        updated_at: "2024-01-18T16:30:00Z"
      }
    }
  },
  {
    user: {
      id: "user-789",
      email: "admin@example.com",
      username: "admin",
      user_type: "admin",
      is_active: true,
      token_balance: 1000,
      created_at: "2023-10-05T12:00:00Z",
      updated_at: "2024-01-19T10:15:00Z",
      last_login: "2024-01-22T08:30:00Z",
      profile: {
        user_id: "user-789",
        full_name: "Admin User",
        date_of_birth: "1985-03-10",
        gender: "male",
        created_at: "2023-10-05T12:00:00Z",
        updated_at: "2024-01-19T10:15:00Z"
      }
    }
  },
  {
    user: {
      id: "user-101",
      email: "inactive@example.com",
      username: "inactiveuser",
      user_type: "user",
      is_active: false,
      token_balance: 25,
      created_at: "2024-01-01T15:45:00Z",
      updated_at: "2024-01-05T09:20:00Z",
      last_login: "2024-01-05T09:20:00Z",
      profile: {
        user_id: "user-101",
        full_name: "Inactive User",
        date_of_birth: "1995-11-30",
        gender: "female",
        created_at: "2024-01-01T15:45:00Z",
        updated_at: "2024-01-05T09:20:00Z"
      }
    }
  }
];

// Helper functions
export const getDummyUserProfile = (): UserProfile => dummyUserProfile;

export const getDummyProfileFormData = (): ProfileFormData => dummyProfileFormData;

export const getDummyPasswordFormData = (): PasswordFormData => dummyPasswordFormData;

export const getAlternativeProfile = (index: number = 0): UserProfile => {
  return alternativeDummyProfiles[index] || dummyUserProfile;
};

// Mock data untuk testing state changes
export const mockProfileUpdateData = {
  username: "newusername",
  full_name: "New Name",
  date_of_birth: "1990-01-01",
  gender: "male" as const
};

// Utility functions untuk testing
export const createMockProfile = (overrides: Partial<UserProfile> = {}): UserProfile => {
  return {
    ...dummyUserProfile,
    ...overrides,
    user: {
      ...dummyUserProfile.user,
      ...overrides.user,
      profile: overrides.user?.profile || dummyUserProfile.user.profile
    }
  };
};

export const createMockFormData = (overrides: Partial<ProfileFormData> = {}): ProfileFormData => {
  return {
    ...dummyProfileFormData,
    ...overrides
  };
};

// Simulasi loading states
export const createMockLoadingStates = {
  isLoading: true,
  isEditing: false,
  isUpdating: false,
  isChangingPassword: false,
  showPasswordForm: false,
  showCurrentPassword: false,
  showNewPassword: false,
  error: "",
  success: "",
  partialUpdateWarning: "",
  showDeleteModal: false,
  deletePassword: "",
  isDeleting: false
};

// Simulasi error states
export const createMockErrorStates = {
  ...createMockLoadingStates,
  isLoading: false,
  error: "Failed to load profile data"
};

// Simulasi success states
export const createMockSuccessStates = {
  ...createMockLoadingStates,
  isLoading: false,
  success: "Profile updated successfully"
};