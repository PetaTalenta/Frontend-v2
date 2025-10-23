'use client';

import React from 'react';
import { PasswordFormData } from '../../types/profile';
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

interface PasswordChangeFormProps {
  showForm: boolean;
  formData: PasswordFormData;
  onPasswordChange: (field: keyof PasswordFormData, value: string) => void;
  onToggleForm: () => void;
  onSubmit: () => void;
  isChangingPassword: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
}

export default function PasswordChangeForm({
  showForm,
  formData,
  onPasswordChange,
  onToggleForm,
  onSubmit,
  isChangingPassword,
  showCurrentPassword,
  showNewPassword,
  onToggleCurrentPassword,
  onToggleNewPassword
}: PasswordChangeFormProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const isFormValid = () => {
    return formData.currentPassword && 
           formData.newPassword && 
           formData.confirmPassword &&
           formData.newPassword === formData.confirmPassword &&
           formData.newPassword.length >= 8;
  };

  if (!showForm) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Security</h3>
          <p className="text-sm text-muted-foreground">Change your password and manage security settings</p>
        </div>
        <button
          onClick={onToggleForm}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Lock className="w-4 h-4 mr-2" strokeWidth={1.75} />
          Change Password
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Security</h3>
          <p className="text-sm text-muted-foreground">Change your password and manage security settings</p>
        </div>
        <button
          onClick={onToggleForm}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Lock className="w-4 h-4 mr-2" strokeWidth={1.75} />
          Change Password
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Current Password */}
        <div className="space-y-2">
          <label htmlFor="currentPassword" className="text-sm font-medium text-foreground">
            Current Password
          </label>
          <div className="relative">
            <input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => onPasswordChange('currentPassword', e.target.value)}
              placeholder="Enter current password"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={onToggleCurrentPassword}
            >
              {showCurrentPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-medium text-foreground">
            New Password
          </label>
          <div className="relative">
            <input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => onPasswordChange('newPassword', e.target.value)}
              placeholder="Enter new password (min. 8 characters)"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <button
              type="button"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={onToggleNewPassword}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
            placeholder="Confirm new password"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        {/* Password Validation Messages */}
        {formData.newPassword && (
          <div className="space-y-1 text-sm">
            <p className={`flex items-center ${formData.newPassword.length >= 8 ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-1">•</span>
              At least 8 characters
            </p>
            {formData.confirmPassword && (
              <p className={`flex items-center ${formData.newPassword === formData.confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                <span className="mr-1">•</span>
                Passwords match
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2 pt-4">
          <button
            type="button"
            onClick={onToggleForm}
            disabled={isChangingPassword}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isFormValid() || isChangingPassword}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          </button>
        </div>
      </form>
    </div>
  );
}