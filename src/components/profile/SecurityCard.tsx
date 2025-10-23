'use client';

import React from 'react';
import { PasswordFormData } from '../../types/profile';
import PasswordChangeForm from './PasswordChangeForm';

interface SecurityCardProps {
  showPasswordForm: boolean;
  passwordData: PasswordFormData;
  onPasswordChange: (field: keyof PasswordFormData, value: string) => void;
  onTogglePasswordForm: () => void;
  onChangePassword: () => void;
  isChangingPassword: boolean;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
}

export default function SecurityCard({
  showPasswordForm,
  passwordData,
  onPasswordChange,
  onTogglePasswordForm,
  onChangePassword,
  isChangingPassword,
  showCurrentPassword,
  showNewPassword,
  onToggleCurrentPassword,
  onToggleNewPassword
}: SecurityCardProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <PasswordChangeForm
          showForm={showPasswordForm}
          formData={passwordData}
          onPasswordChange={onPasswordChange}
          onToggleForm={onTogglePasswordForm}
          onSubmit={onChangePassword}
          isChangingPassword={isChangingPassword}
          showCurrentPassword={showCurrentPassword}
          showNewPassword={showNewPassword}
          onToggleCurrentPassword={onToggleCurrentPassword}
          onToggleNewPassword={onToggleNewPassword}
        />
      </div>
    </div>
  );
}