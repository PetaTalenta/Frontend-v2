'use client';

import React from 'react';
import { UserProfile, ProfileFormData } from '../../types/profile';
import { 
  User, 
  Mail, 
  Calendar 
} from 'lucide-react';

interface ProfileInfoProps {
  profile: UserProfile | null;
  isEditing: boolean;
  formData: ProfileFormData;
  onInputChange: (field: keyof ProfileFormData, value: string) => void;
}

export default function ProfileInfo({ 
  profile, 
  isEditing, 
  formData, 
  onInputChange 
}: ProfileInfoProps) {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Account Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-foreground">{profile?.user?.email || 'Not set'}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-foreground">
              Username
            </label>
            {isEditing ? (
              <input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => onInputChange('username', e.target.value)}
                placeholder="Enter username"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            ) : (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                <span className="text-foreground">{profile?.user?.username || 'Not set'}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="token_balance" className="text-sm font-medium text-foreground">
              Token Balance
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🪙</span>
              <span className="text-foreground font-semibold">{profile?.user?.token_balance || 0}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="member_since" className="text-sm font-medium text-foreground">
              Member Since
            </label>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-foreground">{formatDate(profile?.user?.created_at || '')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-foreground">Personal Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-2">
            <label htmlFor="full_name" className="text-sm font-medium text-foreground">
              Full Name
            </label>
            {isEditing ? (
              <input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => onInputChange('full_name', e.target.value)}
                placeholder="Enter full name"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            ) : (
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                <span className="text-foreground">{profile?.user?.profile?.full_name || 'Not set'}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="date_of_birth" className="text-sm font-medium text-foreground">
              Date of Birth
            </label>
            {isEditing ? (
              <input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => onInputChange('date_of_birth', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            ) : (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" strokeWidth={1.75} />
                <span className="text-foreground">{formatDate(profile?.user?.profile?.date_of_birth || '')}</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <label htmlFor="gender" className="text-sm font-medium text-foreground">
              Gender
            </label>
            {isEditing ? (
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => onInputChange('gender', e.target.value)}
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
    </div>
  );
}