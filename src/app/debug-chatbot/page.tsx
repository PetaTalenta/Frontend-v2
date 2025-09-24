'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Alert, AlertDescription } from '../../components/ui/alert';
import {
  testChatbotHealth,
  testChatbotAuth,
  testCreateConversation,
  runChatbotDiagnostics,
  getChatbotApiConfig,
  clearChatbotData,
  ChatbotDebugResult
} from '../../utils/debug-chatbot';


function getAllUUIDMappings(): Array<{ resultId: string; uuid: string }> {
  const mappings: Array<{ resultId: string; uuid: string }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (key.startsWith('uuid-mapping-')) {
      const resultId = key.replace('uuid-mapping-', '');
      const uuid = localStorage.getItem(key) || '';
      mappings.push({ resultId, uuid });
    }
  }
  return mappings;
}

function clearUUIDMappings(): { cleared: string[] } {
  const cleared: string[] = [];
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!;
    if (key.startsWith('uuid-mapping-')) keys.push(key);
  }
  keys.forEach(k => { localStorage.removeItem(k); cleared.push(k); });
  return { cleared };
}

function testUUIDMapping() {
  // Minimal self-check: create a mapping and verify retrieval
  const sampleId = 'result-001';
  const uuid = crypto.randomUUID ? crypto.randomUUID() : '00000000-0000-4000-8000-000000000000';
  localStorage.setItem(`uuid-mapping-${sampleId}`, uuid);
  const mappings = getAllUUIDMappings();
  const found = mappings.some(m => m.resultId === sampleId && m.uuid === uuid);
  return {
    success: found,
    results: { created: { sampleId, uuid }, totalMappings: mappings.length }
  };
}

function validateUUIDMappings() {
  const mappings = getAllUUIDMappings();
  const invalid = mappings.filter(m => !/^[0-9a-f-]{36}$/i.test(m.uuid));
  return { success: invalid.length === 0, results: { invalid } };
}
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';

// UUID validation and generation
function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export default function DebugChatbotPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [assessmentId, setAssessmentId] = useState('result-001');
  const [apiConfig, setApiConfig] = useState(getChatbotApiConfig());

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    setIsLoading(true);
    try {
      const result = await testFunction();
      setResults(prev => ({ ...prev, [testName]: result }));
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [testName]: { 
          success: false, 
          message: error.message,
          timestamp: new Date().toISOString()
        } 
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    setResults({});
    
    try {
      const diagnostics = await runChatbotDiagnostics(assessmentId);
      setResults({
        comprehensive: {
          success: diagnostics.overall,
          message: diagnostics.overall ? 'All tests passed' : 'Some tests failed',
          details: diagnostics.results,
          timestamp: new Date().toISOString()
        },
        ...diagnostics.results
      });
    } catch (error) {
      setResults({
        comprehensive: {
          success: false,
          message: 'Diagnostics failed',
          details: { error: error.message },
          timestamp: new Date().toISOString()
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearData = () => {
    const result = clearChatbotData();
    setResults(prev => ({
      ...prev,
      clearData: {
        success: true,
        message: `Cleared ${result.clearedKeys.length} conversations`,
        details: result,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const handleTestUUIDMapping = () => {
    const result = testUUIDMapping();
    setResults(prev => ({
      ...prev,
      uuidMapping: {
        success: result.success,
        message: result.success ? 'All UUID mapping tests passed' : 'Some UUID mapping tests failed',
        details: result.results,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const handleClearUUIDMappings = () => {
    const result = clearUUIDMappings();
    setResults(prev => ({
      ...prev,
      clearUUIDMappings: {
        success: true,
        message: `Cleared ${result.cleared.length} UUID mappings`,
        details: result,
        timestamp: new Date().toISOString()
      }
    }));
  };

  const refreshConfig = () => {
    setApiConfig(getChatbotApiConfig());
  };

  const getUUIDMapping = (resultId: string) => {
    if (isValidUUID(resultId)) return resultId;
    const storageKey = `uuid-mapping-${resultId}`;
    return localStorage.getItem(storageKey) || 'Not mapped yet';
  };

  const ResultCard = ({ title, result }: { title: string; result: ChatbotDebugResult }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          {result.success ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <XCircle className="w-4 h-4 text-red-600" />
          )}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-sm mb-2 ${result.success ? 'text-green-700' : 'text-red-700'}`}>
          {result.message}
        </p>
        {result.details && (
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer mb-2">Details</summary>
            <pre className="bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(result.details, null, 2)}
            </pre>
          </details>
        )}
        <p className="text-xs text-gray-500 mt-2">
          {new Date(result.timestamp).toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">🧪 Chatbot API Debug Tool</h1>
        <p className="text-gray-600">
          Test and debug the chatbot API integration
        </p>
      </div>

      {/* API Configuration */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            API Configuration
            <Button variant="outline" size="sm" onClick={refreshConfig}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <strong>Base URL:</strong> {apiConfig.baseUrl}
            </div>
            <div>
              <strong>Timeout:</strong> {apiConfig.timeout}ms
            </div>
            <div>
              <strong>Token:</strong> {apiConfig.token ? '✅ Present' : '❌ Missing'}
            </div>
            <div>
              <strong>Token Length:</strong> {apiConfig.token?.length || 0}
            </div>
          </div>

          {/* UUID Mappings */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">UUID Mappings</h4>
            <div className="text-sm text-gray-600">
              {(() => {
                const mappings = getAllUUIDMappings();
                if (mappings.length === 0) {
                  return <p>No UUID mappings stored</p>;
                }
                return (
                  <div className="space-y-1">
                    {mappings.map((mapping, index) => (
                      <div key={index} className="font-mono text-xs">
                        {mapping.resultId} → {mapping.uuid.substring(0, 8)}...
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Controls */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Assessment ID for testing:
              </label>
              <div className="flex gap-2">
                <Input
                  value={assessmentId}
                  onChange={(e) => setAssessmentId(e.target.value)}
                  placeholder="Enter assessment ID"
                  className={!isValidUUID(assessmentId) ? 'border-orange-300' : ''}
                />
                <Button
                  variant="outline"
                  onClick={() => setAssessmentId(generateUUID())}
                  className="whitespace-nowrap"
                >
                  Generate UUID
                </Button>
              </div>
              {!isValidUUID(assessmentId) && (
                <p className="text-sm text-orange-600 mt-1">
                  ⚠️ API requires a valid UUID format. Click "Generate UUID" for testing.
                </p>
              )}
              {isValidUUID(assessmentId) && (
                <p className="text-sm text-green-600 mt-1">
                  ✅ Valid UUID format
                </p>
              )}
              {!isValidUUID(assessmentId) && (
                <div className="text-sm text-blue-600 mt-1">
                  <p>🔄 UUID Mapping: {getUUIDMapping(assessmentId)}</p>
                  <p className="text-xs text-gray-500">
                    Non-UUID IDs are automatically mapped to UUIDs for API compatibility
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={runAllTests}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Run All Tests
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => runTest('health', testChatbotHealth)}
                disabled={isLoading}
              >
                Test Health
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => runTest('auth', testChatbotAuth)}
                disabled={isLoading}
              >
                Test Auth
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => runTest('conversation', () => testCreateConversation(assessmentId))}
                disabled={isLoading}
              >
                Test Conversation
              </Button>
              
              <Button
                variant="outline"
                onClick={handleTestUUIDMapping}
                disabled={isLoading}
              >
                Test UUID Mapping
              </Button>

              <Button
                variant="outline"
                onClick={handleClearData}
                className="text-red-600 hover:text-red-700"
              >
                Clear Chat Data
              </Button>

              <Button
                variant="outline"
                onClick={handleClearUUIDMappings}
                className="text-orange-600 hover:text-orange-700"
              >
                Clear UUID Mappings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          {results.comprehensive && (
            <ResultCard title="Comprehensive Test" result={results.comprehensive} />
          )}
          
          {results.health && (
            <ResultCard title="Health Check" result={results.health} />
          )}
          
          {results.auth && (
            <ResultCard title="Authentication" result={results.auth} />
          )}
          
          {results.conversation && (
            <ResultCard title="Conversation Creation" result={results.conversation} />
          )}
          
          {results.uuidMapping && (
            <ResultCard title="UUID Mapping Test" result={results.uuidMapping} />
          )}

          {results.clearData && (
            <ResultCard title="Clear Chat Data" result={results.clearData} />
          )}

          {results.clearUUIDMappings && (
            <ResultCard title="Clear UUID Mappings" result={results.clearUUIDMappings} />
          )}
        </div>
      )}

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600">
          <ol className="list-decimal list-inside space-y-2">
            <li>Make sure you're logged in and have a valid authentication token</li>
            <li>Run "Test Health" to check if the chatbot API is accessible</li>
            <li>Run "Test Auth" to verify your authentication is working</li>
            <li>Run "Test Conversation" to test creating a new conversation</li>
            <li>Use "Run All Tests" for a comprehensive check</li>
            <li>Test "UUID Mapping" to verify ID conversion works correctly</li>
            <li>Check the browser console for detailed logs</li>
          </ol>

          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">UUID Mapping</h4>
            <p className="text-blue-800 text-sm">
              The API requires UUID format for assessment IDs, but our system uses IDs like "result-001".
              The system automatically creates and stores UUID mappings for compatibility.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
