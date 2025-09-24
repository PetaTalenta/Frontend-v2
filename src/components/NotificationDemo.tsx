/**
 * Demo component showing how to use the updated WebSocket notifications
 * Following the API documentation format
 */

import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../contexts/AuthContext';

export const NotificationDemo: React.FC = () => {
  const { token } = useAuth();
  const { 
    connected, 
    authenticated, 
    notifications, 
    clearNotifications, 
    removeNotification 
  } = useNotifications(token);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'success':
        return 'bg-green-100 border-green-300 text-green-800';
      case 'error':
        return 'bg-red-100 border-red-300 text-red-800';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">WebSocket Notifications Demo</h2>
      
      {/* Connection Status */}
      <div className="mb-6 p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Connection Status</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Connected: {connected ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${authenticated ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>Authenticated: {authenticated ? 'Yes' : 'No'}</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Real-time Notifications</h3>
          {notifications.length > 0 && (
            <button
              onClick={clearNotifications}
              className="px-3 py-1 text-sm bg-gray-200 hover:bg-gray-300 rounded"
            >
              Clear All
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="p-4 border border-dashed border-gray-300 rounded-lg text-center text-gray-500">
            No notifications yet. Start an analysis to see real-time updates.
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border rounded-lg ${getNotificationColor(notification.type)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1">
                      <div className="font-medium">{notification.message}</div>
                      {notification.metadata?.assessmentName && (
                        <div className="text-sm opacity-75 mt-1">
                          Assessment: {notification.metadata.assessmentName}
                        </div>
                      )}
                      {notification.metadata?.estimatedProcessingTime && (
                        <div className="text-sm opacity-75">
                          Estimated time: {notification.metadata.estimatedProcessingTime}
                        </div>
                      )}
                      {notification.metadata?.processingTime && (
                        <div className="text-sm opacity-75">
                          Processing time: {notification.metadata.processingTime}
                        </div>
                      )}
                      {notification.resultId && (
                        <div className="text-sm opacity-75">
                          Result ID: {notification.resultId}
                        </div>
                      )}
                      {notification.error && (
                        <div className="text-sm opacity-75 mt-1">
                          Error: {notification.error}
                        </div>
                      )}
                      <div className="text-xs opacity-50 mt-2">
                        {notification.timestamp ? new Date(notification.timestamp).toLocaleString() : 'Just now'}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeNotification(notification.id)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Documentation Reference */}
      <div className="p-4 bg-gray-50 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">API Documentation</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div><strong>WebSocket URL:</strong> https://api.futureguide.id</div>
          <div><strong>Protocol:</strong> Socket.IO v4.7.2</div>
          <div><strong>Events:</strong> analysis-started, analysis-complete, analysis-failed</div>
          <div><strong>Authentication:</strong> JWT Token Required</div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo;
