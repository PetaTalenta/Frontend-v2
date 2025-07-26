'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { checkTokenBalance } from '../../utils/token-balance';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Coins, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

export default function TokenBalanceTestPage() {
  const { user, isAuthenticated } = useAuth();
  const [tokenData, setTokenData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBalance = async () => {
    if (!isAuthenticated) {
      setError('Please login first to check token balance');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await checkTokenBalance();
      setTokenData(result);
      console.log('Token balance check result:', result);
    } catch (err) {
      console.error('Error checking token balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to check token balance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      checkBalance();
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#1e1e1e] mb-2">
            Token Balance Test
          </h1>
          <p className="text-[#64707d]">
            Check your current token balance for API usage
          </p>
        </div>

        {/* Authentication Status */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#6475e9]" />
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Badge 
                  variant={isAuthenticated ? "default" : "secondary"}
                  className={isAuthenticated ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
                </Badge>
                {isAuthenticated && user && (
                  <p className="text-sm text-[#64707d] mt-2">
                    Logged in as: <span className="font-medium">{user.email}</span>
                  </p>
                )}
              </div>
              <Button 
                onClick={checkBalance}
                disabled={!isAuthenticated || loading}
                className="bg-[#6475e9] hover:bg-[#5a6bd8]"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Check Balance
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Token Balance Results */}
        {tokenData && (
          <Card className="bg-white border-[#eaecf0]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {tokenData.hasEnoughTokens ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                )}
                Token Balance Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-[#1e1e1e] mb-1">
                      {tokenData.balance >= 0 ? tokenData.balance : 'Unknown'}
                    </div>
                    <div className="text-sm text-[#64707d]">Current Balance</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-[#1e1e1e] mb-1">
                      2
                    </div>
                    <div className="text-sm text-[#64707d]">Required for Assessment</div>
                  </div>
                  
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Badge 
                      variant={tokenData.hasEnoughTokens ? "default" : "destructive"}
                      className="text-sm"
                    >
                      {tokenData.hasEnoughTokens ? 'Sufficient' : 'Insufficient'}
                    </Badge>
                    <div className="text-sm text-[#64707d] mt-1">Status</div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Message:</strong> {tokenData.message}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && (
          <Card className="bg-white border-red-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle>Token Economy System</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-[#64707d]">
              <p><strong>Base Tokens:</strong> 10 (starting balance)</p>
              <p><strong>Assessment Cost:</strong> 2 tokens per submission</p>
              <p><strong>Earn Tokens:</strong> 5 tokens per completed assessment</p>
              <p><strong>Formula:</strong> Base (10) + (Completed × 5) - (Processing × 2)</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
