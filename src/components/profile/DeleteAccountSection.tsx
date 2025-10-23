'use client';

import React from 'react';
import { Trash2, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

interface DeleteAccountSectionProps {
  showDeleteModal: boolean;
  deletePassword: string;
  onDeletePasswordChange: (value: string) => void;
  onToggleDeleteModal: () => void;
  onDeleteAccount: () => void;
  isDeleting: boolean;
  authVersion?: string;
}

export default function DeleteAccountSection({
  showDeleteModal,
  deletePassword,
  onDeletePasswordChange,
  onToggleDeleteModal,
  onDeleteAccount,
  isDeleting,
  authVersion = 'v1'
}: DeleteAccountSectionProps) {
  const handleDeleteClick = () => {
    onToggleDeleteModal();
  };

  const handleConfirmDelete = () => {
    onDeleteAccount();
  };

  const handleCancelDelete = () => {
    onToggleDeleteModal();
    onDeletePasswordChange('');
  };

  const isFormValid = deletePassword && deletePassword.trim().length > 0;

  return (
    <>
      <div className="border border-red-200 rounded-lg bg-red-50">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" strokeWidth={1.75} />
                Danger Zone
              </h3>
              <p className="text-sm text-red-700 mt-1">Irreversible account actions</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50 mt-4">
            <div>
              <h4 className="font-semibold text-foreground">Delete Account</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Once you delete your account, there is no going back. Please be certain.
              </p>
            </div>
            <button
              onClick={handleDeleteClick}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ml-4 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.75} />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white rounded-lg border border-red-200 shadow-xl">
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={1.75} />
                <h3 className="text-lg font-semibold text-red-600">
                  Confirm Account Deletion
                </h3>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">
                This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      <strong>Warning:</strong> All your assessment results, profile data, and token balance will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <label htmlFor="deletePassword" className="text-sm font-medium text-gray-900">
                  {authVersion === 'v2' 
                    ? 'Enter your password to confirm' 
                    : 'Enter your password to confirm'}
                </label>
                <input
                  id="deletePassword"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => onDeletePasswordChange(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isDeleting}
                  autoFocus
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-gray-50 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
                <p className="text-xs text-gray-500">
                  {authVersion === 'v2' 
                    ? 'Your Firebase account password is required for security.' 
                    : 'Your current password is required for security.'}
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleCancelDelete}
                  disabled={isDeleting}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={!isFormValid || isDeleting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}