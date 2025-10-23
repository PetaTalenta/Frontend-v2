'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile, ProfileFormData, PasswordFormData } from '../../types/profile';
import { getDummyUserProfile, getDummyProfileFormData, getDummyPasswordFormData } from '../../data/dummy-profile-data';
import ProfileLoading from './ProfileLoading';
import ProfileCard from './ProfileCard';
import SecurityCard from './SecurityCard';
import DeleteAccountSection from './DeleteAccountSection';
import AlertSection from './AlertSection';

export default function ProfilePage() {
  // State management
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

  // Load profile data on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const profileData = getDummyUserProfile();
      const formDataFromProfile = getDummyProfileFormData();
      
      setProfile(profileData);
      setFormData(formDataFromProfile);
      
      console.log('Profile loaded successfully:', profileData);
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
    setIsUpdating(true);
    setError('');
    setSuccess('');
    setPartialUpdateWarning('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate validation
      if (formData.username && formData.username.length < 3) {
        setError('Username must be at least 3 characters long');
        return;
      }

      // Simulate successful update
      console.log('Profile updated with data:', formData);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
      
      // Update local profile state
      if (profile && profile.user.profile) {
        const updatedProfile: UserProfile = {
          ...profile,
          user: {
            ...profile.user,
            username: formData.username || profile.user.username,
            profile: {
              user_id: profile.user.profile.user_id,
              full_name: formData.full_name || profile.user.profile.full_name,
              date_of_birth: formData.date_of_birth || profile.user.profile.date_of_birth,
              gender: formData.gender || profile.user.profile.gender,
              created_at: profile.user.profile.created_at,
              updated_at: profile.user.profile.updated_at
            }
          }
        };
        setProfile(updatedProfile);
      }
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
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
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful password change
      console.log('Password changed successfully');
      setSuccess('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordData(getDummyPasswordFormData());
      
    } catch (err) {
      console.error('Error changing password:', err);
      setError('Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword || deletePassword.trim().length === 0) {
      setError('Password is required to delete your account');
      return;
    }

    setIsDeleting(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate successful account deletion
      console.log('Account deleted successfully');
      setSuccess('Account deleted successfully. Redirecting...');
      setShowDeleteModal(false);
      
      // Simulate redirect after deletion
      setTimeout(() => {
        console.log('Redirecting to login page...');
        // In real app, this would redirect to login page
        window.location.href = '/auth';
      }, 2000);

    } catch (err) {
      console.error('Error deleting account:', err);
      setError('Failed to delete account');
      setIsDeleting(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return <ProfileLoading />;
  }

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-10 sm:px-10 md:py-16">
      <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
            <p className="text-gray-600 mt-2">Manage your account information and settings</p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Alerts */}
        <AlertSection
          error={error}
          success={success}
          partialUpdateWarning={partialUpdateWarning}
        />

        {/* Profile Information Card */}
        <ProfileCard
          profile={profile}
          isEditing={isEditing}
          isUpdating={isUpdating}
          formData={formData}
          onInputChange={handleInputChange}
          onToggleEdit={() => setIsEditing(!isEditing)}
          onSaveProfile={handleSaveProfile}
        />

        {/* Password Change Card */}
        <SecurityCard
          showPasswordForm={showPasswordForm}
          passwordData={passwordData}
          onPasswordChange={handlePasswordChange}
          onTogglePasswordForm={() => setShowPasswordForm(!showPasswordForm)}
          onChangePassword={handleChangePassword}
          isChangingPassword={isChangingPassword}
          showCurrentPassword={showCurrentPassword}
          showNewPassword={showNewPassword}
          onToggleCurrentPassword={() => setShowCurrentPassword(!showCurrentPassword)}
          onToggleNewPassword={() => setShowNewPassword(!showNewPassword)}
        />

        {/* Danger Zone - Account Deletion */}
        <DeleteAccountSection
          showDeleteModal={showDeleteModal}
          deletePassword={deletePassword}
          onDeletePasswordChange={setDeletePassword}
          onToggleDeleteModal={() => setShowDeleteModal(!showDeleteModal)}
          onDeleteAccount={handleDeleteAccount}
          isDeleting={isDeleting}
          authVersion="v1" // Simulate auth version
        />
      </div>
    </div>
  );
}
