'use client';

import React, { useState, useEffect } from 'react';
import { navigationDebugger, checkNavigationHealth } from '../../utils/navigation-debug';

interface NavigationDebugPanelProps {
  isVisible?: boolean;
  onClose?: () => void;
}

export default function NavigationDebugPanel({ isVisible = false, onClose }: NavigationDebugPanelProps) {
  const [events, setEvents] = useState(navigationDebugger.getEvents());
  const [health, setHealth] = useState(checkNavigationHealth());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(navigationDebugger.getEvents());
      setHealth(checkNavigationHealth());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) {
    return (
      <div 
        className="fixed bottom-4 right-4 z-50"
        style={{ zIndex: 9999 }}
      >
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-red-500 text-white px-3 py-2 rounded-lg text-sm shadow-lg hover:bg-red-600"
          title="Navigation Debug Panel"
        >
          🐛 Debug
        </button>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      style={{ zIndex: 9999 }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="bg-gray-800 text-white px-4 py-3 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Navigation Debug Panel</h2>
          <button
            onClick={onClose || (() => setIsExpanded(false))}
            className="text-gray-300 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[70vh]">
          {/* Health Status */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Navigation Health</h3>
            <div className={`p-3 rounded-lg ${health.isHealthy ? 'bg-green-100 border border-green-300' : 'bg-red-100 border border-red-300'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-lg ${health.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
                  {health.isHealthy ? '✅' : '❌'}
                </span>
                <span className={`font-semibold ${health.isHealthy ? 'text-green-800' : 'text-red-800'}`}>
                  {health.isHealthy ? 'Healthy' : 'Issues Detected'}
                </span>
              </div>
              
              {health.issues.length > 0 && (
                <div className="mb-2">
                  <strong className="text-red-800">Issues:</strong>
                  <ul className="list-disc list-inside text-red-700 text-sm">
                    {health.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {health.recommendations.length > 0 && (
                <div>
                  <strong className="text-blue-800">Recommendations:</strong>
                  <ul className="list-disc list-inside text-blue-700 text-sm">
                    {health.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Current State */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Current State</h3>
            <div className="bg-gray-100 p-3 rounded-lg">
              <p><strong>Current URL:</strong> {window.location.href}</p>
              <p><strong>Pathname:</strong> {window.location.pathname}</p>
              <p><strong>Total Events:</strong> {events.length}</p>
            </div>
          </div>

          {/* Recent Events */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Recent Navigation Events</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {events.length === 0 ? (
                <p className="text-gray-500 italic">No navigation events recorded</p>
              ) : (
                events.slice(0, 10).map((event, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${event.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`font-semibold ${event.success ? 'text-green-800' : 'text-red-800'}`}>
                        {event.success ? '✅' : '❌'} {event.from} → {event.to}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Method:</span> {event.method}
                      {event.error && (
                        <div className="text-red-600 mt-1">
                          <span className="font-medium">Error:</span> {event.error}
                        </div>
                      )}
                      {event.context && (
                        <div className="text-blue-600 mt-1">
                          <span className="font-medium">Context:</span> {JSON.stringify(event.context)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigationDebugger.clearEvents();
                setEvents([]);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Clear Events
            </button>
            <button
              onClick={() => {
                const debugInfo = navigationDebugger.exportDebugInfo();
                const blob = new Blob([JSON.stringify(debugInfo, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `navigation-debug-${new Date().toISOString()}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Export Debug Info
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook for easy debugging
export function useNavigationDebug() {
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+D to toggle debug panel
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDebug(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    showDebug,
    setShowDebug,
    DebugPanel: () => (
      <NavigationDebugPanel 
        isVisible={showDebug} 
        onClose={() => setShowDebug(false)} 
      />
    )
  };
}
