'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import {
  calculateUserStats,
  formatStatsForDashboard,
  getUserActivitySummary,
  UserStats
} from '../../utils/user-stats';
import { 
  BarChart3, 
  CheckCircle, 
  Clock, 
  Coins,
  Plus,
  RefreshCw,
  ArrowLeft,
  TrendingUp,
  User
} from 'lucide-react';

export default function StatsDemoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    loadUserStats();
  }, [user]);

  const loadUserStats = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const stats = await calculateUserStats(user.id);
      setUserStats(stats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulateAssessment = async () => {
    if (!user) return;
    
    setIsSimulating(true);
    try {
      // Demo actions removed in utils version; just refetch stats
      await loadUserStats();
      setIsSimulating(false);
    } catch (error) {
      console.error('Error simulating assessment:', error);
      setIsSimulating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!userStats) return null;

  const statsCards = formatStatsForDashboard(userStats);
  const activitySummary = getUserActivitySummary(userStats);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/dashboard')}
              className="border-[#eaecf0]"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-[#1e1e1e]">
                User Statistics Demo
              </h1>
              <p className="text-sm text-[#64707d]">
                Real-time stats based on your assessment data
              </p>
            </div>
          </div>
          
          <Button 
            onClick={loadUserStats}
            variant="outline"
            size="sm"
            className="border-[#eaecf0]"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Current User Info */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#6475e9]" />
              Current User: {user?.username || user?.name || user?.email}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>User ID:</strong> {user?.id}</p>
                <p><strong>Email:</strong> {user?.email}</p>
              </div>
              <div>
                <p><strong>Active Assessments:</strong> {activitySummary.activeAssessments}</p>
                <p><strong>Completion Rate:</strong> {activitySummary.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statsCards.map((stat) => (
            <Card key={stat.id} className="bg-white border-[#eaecf0]">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-[#1e1e1e]">{stat.value}</p>
                    <p className="text-sm text-[#64707d]">{stat.label}</p>
                  </div>
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: stat.color }}
                  >
                    {stat.id === 'analysis' && <BarChart3 className="w-6 h-6 text-[#6475e9]" />}
                    {stat.id === 'completed' && <CheckCircle className="w-6 h-6 text-green-600" />}
                    {stat.id === 'processing' && <Clock className="w-6 h-6 text-blue-600" />}
                    {stat.id === 'balance' && <Coins className="w-6 h-6 text-purple-600" />}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Activity Summary */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#6475e9]" />
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#1e1e1e] mb-1">
                  {userStats.completed}
                </div>
                <div className="text-sm text-[#64707d]">Completed Assessments</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-[#1e1e1e] mb-1">
                  {userStats.processing}
                </div>
                <div className="text-sm text-[#64707d]">Processing Assessments</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-[#1e1e1e] mb-1">
                  {userStats.tokenBalance}
                </div>
                <div className="text-sm text-[#64707d]">Current Balance</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assessment History */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle>Assessment History</CardTitle>
          </CardHeader>
          <CardContent>
            {userStats.assessmentResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#64707d] mb-4">No assessments found</p>
                <p className="text-sm text-[#64707d]">
                  Your assessment results will appear here after completion
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {userStats.assessmentResults.map((result, index) => (
                  <div key={result.id} className="flex items-center justify-between p-3 border border-[#eaecf0] rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-[#1e1e1e]">{result.persona_profile.title}</h4>
                      <p className="text-sm text-[#64707d]">
                        {new Date(result.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Badge 
                      variant="secondary"
                      className={
                        result.status === 'completed' ? 'bg-green-100 text-green-800' :
                        result.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        result.status === 'queued' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }
                    >
                      {result.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulation Controls */}
        <Card className="bg-gradient-to-r from-[#6475e9] to-[#5a6bd8] text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Simulate Assessment</h3>
                <p className="text-white/90 text-sm">
                  Add a new assessment to see how your stats change in real-time
                </p>
              </div>
              <Button 
                onClick={handleSimulateAssessment}
                disabled={isSimulating}
                variant="secondary"
                className="bg-white text-[#6475e9] hover:bg-white/90"
              >
                {isSimulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Assessment
                  </>
                )}
              </Button>
            </div>
            
            {isSimulating && (
              <div className="mt-4 p-3 bg-white/10 rounded-lg">
                <p className="text-sm text-white/90">
                  ⏳ Simulating assessment processing... This will complete in 3 seconds and update your stats.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Calculation Logic */}
        <Card className="bg-white border-[#eaecf0]">
          <CardHeader>
            <CardTitle>How Stats Are Calculated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-[#1e1e1e] mb-2">📊 Total Analysis</h4>
                  <p className="text-[#64707d]">Total number of assessments (all statuses)</p>
                </div>
                <div>
                  <h4 className="font-medium text-[#1e1e1e] mb-2">✅ Completed</h4>
                  <p className="text-[#64707d]">Assessments with 'completed' status</p>
                </div>
                <div>
                  <h4 className="font-medium text-[#1e1e1e] mb-2">⏳ Processing</h4>
                  <p className="text-[#64707d]">Assessments with 'processing' or 'queued' status</p>
                </div>
                <div>
                  <h4 className="font-medium text-[#1e1e1e] mb-2">🪙 Token Balance</h4>
                  <p className="text-[#64707d]">Base: 10 + (Completed × 5) - (Processing × 2)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
