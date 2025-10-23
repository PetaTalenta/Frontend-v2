'use client';

import React from 'react';
import { useOfflineStatus } from '../../lib/offline';

const OfflineStatusIndicator: React.FC = () => {
  const { isOnline, queueSize } = useOfflineStatus();

  if (isOnline && queueSize === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 max-w-sm p-4 rounded-lg border shadow-lg transition-all duration-300 ${
      isOnline 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-red-50 border-red-200 text-red-800'
    }`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          {isOnline ? (
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {isOnline ? 'Koneksi Tersambung' : 'Offline Mode'}
          </h3>
          <div className="mt-1 text-sm">
            {isOnline ? (
              queueSize > 0 ? `Memproses ${queueSize} tindakan tertunda...` : 'Semua data telah disinkronkan'
            ) : (
              'Anda sedang offline. Perubahan akan disimpan dan disinkronkan saat koneksi tersedia.'
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineStatusIndicator;