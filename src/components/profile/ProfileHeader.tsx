'use client';

import React from 'react';
import { UserProfile } from '../../types/profile';
import { Edit, X } from 'lucide-react';

interface ProfileHeaderProps {
  profile: UserProfile | null;
  isEditing: boolean;
  onToggleEdit: () => void;
  isUpdating?: boolean;
}

export default function ProfileHeader({ 
  profile, 
  isEditing, 
  onToggleEdit, 
  isUpdating = false 
}: ProfileHeaderProps) {
  const getUserInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Avatar */}
        <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
          <span className="text-lg font-semibold text-gray-600">
            {getUserInitials(profile?.user?.profile?.full_name, profile?.user?.email)}
          </span>
        </div>
        
        {/* User Info */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {profile?.user?.profile?.full_name || 'User'}
          </h2>
          <p className="text-base text-muted-foreground">
            {profile?.user?.email}
          </p>
          
          {/* Badges */}
          <div className="flex items-center space-x-2 mt-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              profile?.user?.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {profile?.user?.is_active ? 'Active' : 'Inactive'}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {profile?.user?.user_type || 'user'}
            </span>
          </div>
        </div>
      </div>
      
      {/* Edit Button */}
      <button
        onClick={onToggleEdit}
        disabled={isUpdating}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      </button>
    </div>
  );
}