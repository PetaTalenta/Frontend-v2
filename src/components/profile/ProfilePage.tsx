'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Badge } from '../ui/badge';

import {
  User,
  Mail,
  Calendar,
  Edit,
  Save,
  X,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import apiService from '../../services/apiService';
import authV2Service from '../../services/authV2Service';
import { getFirebaseErrorMessage } from '../../utils/firebase-errors';
import { API_ENDPOINTS, API_CONFIG } from '../../config/api';
import axios from 'axios';

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

interface ProfileFormData {
  username: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, token, logout, updateUser, authVersion } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [partialUpdateWarning, setPartialUpdateWarning] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    full_name: '',
    date_of_birth: '',
    gender: ''
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Load profile data
  useEffect(() => {
    loadProfile();
  }, [token]);

  const loadProfile = async () => {
    if (!token) return;

    setIsLoading(true);
    setError('');

    try {
      const profileData = await apiService.getProfile();
      console.log('Profile data received:', profileData);

      if (profileData && profileData.success) {
        console.log('Profile data structure:', profileData.data);

        // Handle the API response structure: { data: { user: { ..., profile: {...} } } }
        if (profileData.data && profileData.data.user) {
          const userData = profileData.data.user;
          console.log('Processed user data:', userData);

          // Create a normalized profile structure
          const normalizedProfile: UserProfile = {
            user: userData
          };

          setProfile(normalizedProfile);
          setFormData({
            username: userData.username || '',
            full_name: userData.profile?.full_name || '',
            date_of_birth: userData.profile?.date_of_birth || '',
            gender: userData.profile?.gender || ''
          });

          // Update AuthContext with the latest username and name from profile
          const authUpdates: any = {};
          if (userData.username && userData.username !== user?.username) {
            authUpdates.username = userData.username;
          }
          if (userData.profile?.full_name && userData.profile.full_name !== user?.name) {
            authUpdates.name = userData.profile.full_name;
          }

          if (Object.keys(authUpdates).length > 0) {
            console.log('ProfilePage: Updating AuthContext with profile data:', authUpdates);
            updateUser(authUpdates);
          }
        } else {
          console.error('Invalid profile data structure:', profileData);
          setError('Invalid profile data structure received');
        }
      } else {
        console.error('Invalid profile data structure:', profileData);
        setError(profileData?.message || 'Failed to load profile data');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    if (!token) return;

    setIsUpdating(true);
    setError('');
    setSuccess('');
    setPartialUpdateWarning('');

    try {
      console.log('ProfilePage: Starting profile update (Auth Version:', authVersion, ')');

      // Validate and prepare data
      const updateData: any = {};

      // Validate and include fields according to API specification
      if (formData.username && formData.username.trim()) {
        const username = formData.username.trim();
        // Alphanumeric only, 3-100 characters
        if (username.length >= 3 && username.length <= 100 && /^[a-zA-Z0-9]+$/.test(username)) {
          updateData.username = username;
        } else {
          setError('Username must be alphanumeric and 3-100 characters long');
          return;
        }
      }

      if (formData.full_name && formData.full_name.trim()) {
        const fullName = formData.full_name.trim();
        // Maximum 100 characters
        if (fullName.length <= 100) {
          updateData.full_name = fullName;
        } else {
          setError('Full name must be maximum 100 characters');
          return;
        }
      }

      if (formData.date_of_birth) {
        // ISO date format (YYYY-MM-DD), cannot be future date
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateRegex.test(formData.date_of_birth)) {
          const date = new Date(formData.date_of_birth);
          const today = new Date();
          if (date <= today) {
            updateData.date_of_birth = formData.date_of_birth;
          } else {
            setError('Date of birth cannot be in the future');
            return;
          }
        } else {
          setError('Date of birth must be in YYYY-MM-DD format');
          return;
        }
      }

      if (formData.gender && formData.gender !== '') {
        // Must be one of: 'male', 'female'
        if (formData.gender === 'male' || formData.gender === 'female') {
          updateData.gender = formData.gender;
        } else {
          setError('Gender must be either male or female');
          return;
        }
      }

      console.log('ProfilePage: Validated update data:', updateData);

      // Check if there's actually data to update
      if (Object.keys(updateData).length === 0) {
        setError('No changes to save');
        return;
      }

      // AUTH V2: Split updates - Firebase Auth only supports displayName/photoURL
      if (authVersion === 'v2') {
        console.log('ProfilePage: Using Auth V2 dual-update strategy');
        
        // Separate auth fields (displayName) from user fields
        const authFields: any = {};
        const userFields: any = {};

        // Map username to displayName for Auth V2
        if (updateData.username) {
          authFields.displayName = updateData.username;
        }
        if (updateData.full_name) {
          authFields.displayName = updateData.full_name; // Use full_name as displayName
        }

        // All other fields go to user service (if we had one)
        if (updateData.date_of_birth) userFields.date_of_birth = updateData.date_of_birth;
        if (updateData.gender) userFields.gender = updateData.gender;

        let authUpdateSuccess = false;
        let userUpdateSuccess = false;
        const errors: string[] = [];

        // Update auth fields (displayName only for V2)
        if (Object.keys(authFields).length > 0) {
          try {
            console.log('ProfilePage: Updating Firebase auth fields:', authFields);
            await authV2Service.updateProfile(authFields);
            authUpdateSuccess = true;
            console.log('ProfilePage: Firebase auth update successful');
          } catch (authError: any) {
            console.error('ProfilePage: Firebase auth update failed:', authError);
            const errorMsg = getFirebaseErrorMessage(authError);
            errors.push(`Auth update failed: ${errorMsg}`);
          }
        }

        // Update user fields via V1 API (fallback for non-auth fields)
        // Note: This requires the backend to support partial profile updates
        if (Object.keys(userFields).length > 0) {
          try {
            console.log('ProfilePage: Updating user profile fields via V1 API:', userFields);
            const result = await apiService.updateProfile(userFields);
            
            if (result && result.success) {
              userUpdateSuccess = true;
              console.log('ProfilePage: User fields update successful');
            } else {
              errors.push(result?.message || 'Failed to update user profile fields');
            }
          } catch (userError: any) {
            console.error('ProfilePage: User fields update failed:', userError);
            errors.push('Failed to update user profile fields');
          }
        }

        // Handle results
        if (authUpdateSuccess || userUpdateSuccess) {
          if (authUpdateSuccess && !userUpdateSuccess && Object.keys(userFields).length > 0) {
            setPartialUpdateWarning('Display name updated successfully, but other profile fields could not be updated.');
          } else if (!authUpdateSuccess && userUpdateSuccess && Object.keys(authFields).length > 0) {
            setPartialUpdateWarning('Profile fields updated successfully, but display name could not be updated.');
          } else {
            setSuccess('Profile updated successfully');
          }
          
          setIsEditing(false);

          // Update AuthContext with new data
          const authUpdates: any = {};
          if (authFields.displayName) {
            authUpdates.username = authFields.displayName;
            authUpdates.name = authFields.displayName;
          }

          if (Object.keys(authUpdates).length > 0) {
            console.log('ProfilePage: Updating AuthContext after V2 profile save:', authUpdates);
            updateUser(authUpdates);
          }

          await loadProfile(); // Reload profile data
        } else {
          setError(errors.join(' ') || 'Failed to update profile');
        }

      } else {
        // AUTH V1: Single unified update (backward compatibility)
        console.log('ProfilePage: Using Auth V1 unified update');
        
        const result = await apiService.updateProfile(updateData);

        if (result && result.success) {
          setSuccess('Profile updated successfully');
          setIsEditing(false);

          // Update AuthContext with new data if it was changed
          const authUpdates: any = {};
          if (updateData.username) {
            authUpdates.username = updateData.username;
          }
          if (updateData.full_name) {
            authUpdates.name = updateData.full_name;
          }

          if (Object.keys(authUpdates).length > 0) {
            console.log('ProfilePage: Updating AuthContext after V1 profile save:', authUpdates);
            updateUser(authUpdates);
          }

          await loadProfile(); // Reload profile data
        } else {
          // Handle specific error cases
          if (result?.error?.code === 'INVALID_SCHOOL_ID') {
            setError(`School validation failed: ${result.error.message}. Please select a valid school from the dropdown or verify the school ID.`);
          } else {
            setError(result?.message || result?.error?.message || 'Failed to update profile');
          }
        }
      }
    } catch (err: any) {
      console.error('Error updating profile:', err);
      const errorMsg = authVersion === 'v2' ? getFirebaseErrorMessage(err) : 'Failed to update profile';
      setError(errorMsg);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!token) return;

    // AUTH V2: Firebase password changes require reauthentication
    // Recommend using the password reset flow instead
    if (authVersion === 'v2') {
      setError('For security reasons, Firebase authentication requires using the password reset flow. Please use the "Forgot Password" feature from the login page to change your password.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    setIsChangingPassword(true);
    setError('');
    setSuccess('');

    try {
      // AUTH V1: Use traditional password change
      const result = await apiService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      if (result && result.success) {
        setSuccess('Password changed successfully');
        setShowPasswordForm(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        setError(result?.message || 'Failed to change password');
      }
    } catch (err: any) {
      console.error('Error changing password:', err);
      setError('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

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

  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen profile-theme bg-background px-6 py-10 sm:px-8 md:py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen profile-theme bg-background px-6 py-10 sm:px-10 md:py-16">
      <div className="max-w-4xl mx-auto space-y-8 md:space-y-10 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-2">Manage your account information and settings</p>
          </div>
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            className="border-border hover:bg-secondary transition-colors rounded-md"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert className="border-destructive/20 bg-destructive/10">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-[#bbf7d0] bg-[#dcfce7]">
            <CheckCircle className="h-4 w-4 text-[#16a34a]" />
            <AlertDescription className="text-[#166534]">{success}</AlertDescription>
          </Alert>
        )}

        {partialUpdateWarning && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">{partialUpdateWarning}</AlertDescription>
          </Alert>
        )}

        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.avatar} alt={profile?.user?.profile?.full_name || profile?.user?.email || user?.email} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                    {getUserInitials(profile?.user?.profile?.full_name, profile?.user?.email || user?.email)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">
                    {profile?.user?.profile?.full_name || user?.name || 'User'}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {profile?.user?.email || user?.email}
                  </CardDescription>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant={profile?.user?.is_active ? "default" : "secondary"}>
                      {profile?.user?.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {profile?.user?.user_type || 'user'}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
                disabled={isUpdating}
                className="border-border hover:bg-secondary transition-colors rounded-md"
              >
                {isEditing ? (
                  <>
                    <X className="w-4 h-4 mr-2" strokeWidth={1.75} />
                    Cancel
                  </>
                ) : (
                  <>
                    <Edit className="w-4 h-4 mr-2" strokeWidth={1.75} />
                    Edit Profile
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Account Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Account Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                    <span className="text-foreground">{profile?.user?.email || user?.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  {isEditing ? (
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      placeholder="Enter username"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                      <span className="text-foreground">{profile?.user?.username || 'Not set'}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="token_balance">Token Balance</Label>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🪙</span>
                    <span className="text-foreground font-semibold">{profile?.user?.token_balance || 0}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member_since">Member Since</Label>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                    <span className="text-foreground">{formatDate(profile?.user?.created_at || '')}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleInputChange('full_name', e.target.value)}
                      placeholder="Enter full name"
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                      <span className="text-foreground">{profile?.user?.profile?.full_name || 'Not set'}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
                    />
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                      <span className="text-foreground">{formatDate(profile?.user?.profile?.date_of_birth || '')}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  {isEditing ? (
                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-foreground capitalize">{profile?.user?.profile?.gender || 'Not set'}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  disabled={isUpdating}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" strokeWidth={1.75} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" strokeWidth={1.75} />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Change your password and manage security settings</CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="border-[#d3d3d3]"
              >
                <Lock className="w-4 h-4 mr-2" strokeWidth={1.75} />
                Change Password
              </Button>
            </div>
          </CardHeader>
          {showPasswordForm && (
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Enter new password (min. 8 characters)"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPasswordForm(false);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  disabled={isChangingPassword}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleChangePassword}
                  disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                  className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" strokeWidth={1.75} />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" strokeWidth={1.75} />
                      Change Password
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Danger Zone - Account Deletion */}
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

        {/* Delete Account Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
                  Confirm Account Deletion
                </CardTitle>
                <CardDescription>
                  This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="border-destructive/20 bg-destructive/10">
                  <AlertCircle className="h-4 w-4 text-destructive" />
                  <AlertDescription className="text-destructive">
                    <strong>Warning:</strong> All your assessment results, profile data, and token balance will be permanently deleted.
                  </AlertDescription>
                </Alert>

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
      </div>
    </div>
  );
}
