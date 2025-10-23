'use client';

import React from 'react';
import { Save, Loader2 } from 'lucide-react';
import { UserProfile, ProfileFormData } from '../../types/profile';
import ProfileHeader from './ProfileHeader';
import ProfileInfo from './ProfileInfo';

interface ProfileCardProps {
  profile: UserProfile | null;
  isEditing: boolean;
  isUpdating: boolean;
  formData: ProfileFormData;
  onInputChange: (field: keyof ProfileFormData, value: string) => void;
  onToggleEdit: () => void;
  onSaveProfile: () => void;
}

export default function ProfileCard({
  profile,
  isEditing,
  isUpdating,
  formData,
  onInputChange,
  onToggleEdit,
  onSaveProfile
}: ProfileCardProps) {
  const handleSave = () => {
    onSaveProfile();
  };

  const handleCancel = () => {
    onToggleEdit();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6">
        <ProfileHeader
          profile={profile}
          isEditing={isEditing}
          onToggleEdit={onToggleEdit}
          isUpdating={isUpdating}
        />
      </div>
      
      <div className="border-t border-gray-200">
        <div className="p-6">
          <ProfileInfo
            profile={profile}
            isEditing={isEditing}
            formData={formData}
            onInputChange={onInputChange}
          />
          
          {/* Save Button */}
          {isEditing && (
            <div className="flex justify-end space-x-2 mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={handleCancel}
                disabled={isUpdating}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isUpdating}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}