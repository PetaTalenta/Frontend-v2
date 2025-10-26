'use client';

import React from 'react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordRequirement {
  regex: RegExp;
  text: string;
  met: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ 
  password, 
  showRequirements = true 
}) => {
  // If no password, don't show anything
  if (!password) {
    return null;
  }

  // Calculate password strength
  const calculateStrength = (pwd: string): number => {
    if (!pwd) return 0;
    
    let strength = 0;
    
    // Length check
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    
    // Character variety checks
    if (/[a-z]/.test(pwd)) strength++; // Lowercase
    if (/[A-Z]/.test(pwd)) strength++; // Uppercase
    if (/\d/.test(pwd)) strength++;    // Number
    if (/[^a-zA-Z\d]/.test(pwd)) strength++; // Special character
    
    return Math.min(strength, 5); // Max strength is 5
  };

  const strength = calculateStrength(password);
  
  // Determine strength label and color
  const getStrengthInfo = (level: number) => {
    switch (level) {
      case 0:
      case 1:
        return {
          label: 'Sangat Lemah',
          color: 'bg-red-500',
          textColor: 'text-red-600',
          percentage: '20%'
        };
      case 2:
        return {
          label: 'Lemah',
          color: 'bg-orange-500',
          textColor: 'text-orange-600',
          percentage: '40%'
        };
      case 3:
        return {
          label: 'Sedang',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-600',
          percentage: '60%'
        };
      case 4:
        return {
          label: 'Kuat',
          color: 'bg-blue-500',
          textColor: 'text-blue-600',
          percentage: '80%'
        };
      case 5:
        return {
          label: 'Sangat Kuat',
          color: 'bg-green-500',
          textColor: 'text-green-600',
          percentage: '100%'
        };
      default:
        return {
          label: 'Sangat Lemah',
          color: 'bg-red-500',
          textColor: 'text-red-600',
          percentage: '20%'
        };
    }
  };

  const strengthInfo = getStrengthInfo(strength);

  // Password requirements
  const requirements: PasswordRequirement[] = [
    {
      regex: /.{8,}/,
      text: 'Minimal 8 karakter',
      met: password.length >= 8
    },
    {
      regex: /.{12,}/,
      text: 'Minimal 12 karakter (bonus)',
      met: password.length >= 12
    },
    {
      regex: /[a-z]/,
      text: 'Mengandung huruf kecil',
      met: /[a-z]/.test(password)
    },
    {
      regex: /[A-Z]/,
      text: 'Mengandung huruf besar',
      met: /[A-Z]/.test(password)
    },
    {
      regex: /\d/,
      text: 'Mengandung angka',
      met: /\d/.test(password)
    },
    {
      regex: /[^a-zA-Z\d]/,
      text: 'Mengandung karakter khusus (!@#$%^&*)',
      met: /[^a-zA-Z\d]/.test(password)
    }
  ];

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium text-gray-700">Kekuatan Password</span>
          <span className={`text-xs font-medium ${strengthInfo.textColor}`}>
            {strengthInfo.label}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ease-out ${strengthInfo.color}`}
            style={{ width: strengthInfo.percentage }}
          />
        </div>
      </div>

      {/* Requirements List */}
      {showRequirements && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-700">Persyaratan Password:</p>
          <div className="grid grid-cols-1 gap-2">
            {requirements.map((req, index) => (
              <div
                key={index}
                className={`flex items-center text-xs ${
                  req.met ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                <div className="mr-2">
                  {req.met ? (
                    <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    </svg>
                  )}
                </div>
                <span>{req.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Password Tips */}
      {strength < 3 && password.length > 0 && (
        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-xs text-amber-800">
                <strong>Tip:</strong> Gunakan kombinasi huruf besar, huruf kecil, angka, dan karakter khusus untuk password yang lebih kuat.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;