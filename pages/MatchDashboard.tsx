import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MatchHistory } from '@/components/dashboard/MatchHistory';
import { PendingMatches } from '@/components/dashboard/PendingMatches';
import { MatchStatistics } from '@/components/dashboard/MatchStatistics';
import { ArrowLeft, RefreshCw, Download, Settings, Sparkles, Brain, Zap, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MatchDashboard() {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleExport = () => {
    const data = {
      exportDate: new Date().toISOString(),
      matchCount: 342,
      successRate: 66.4,
      aiAnalyses: 1247,
      avgConfidence: 89.2
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ai-match-statistics.json';
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0a0e27]">
      {/* Header */}
      <div className="bg-gray-900/50 border-b border-cyan-500/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-cyan-400 hover:bg-cyan-500/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-cyan-400" />
                AI Match Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-cyan-500/30 hover:bg-cyan-500/10 text-cyan-400"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="border-purple-500/30 hover:bg-purple-500/10 text-purple-400"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-green-500/30 hover:bg-green-500/10 text-green-400"
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AI Performance Stats */}
        <Card className="mb-8 bg-gray-900/50 border-cyan-500/30 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-cyan-400 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Performance Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg border border-cyan-500/30 hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
                <p className="text-3xl font-bold text-cyan-400">247</p>
                <p className="text-sm text-gray-300">Photos Analyzed</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-lg border border-green-500/30 hover:shadow-[0_0_20px_rgba(57,255,20,0.3)] transition-all">
                <Zap className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-3xl font-bold text-green-400">12</p>
                <p className="text-sm text-gray-300">High Confidence Matches</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-lg border border-purple-500/30 hover:shadow-[0_0_20px_rgba(255,0,255,0.3)] transition-all">
                <Brain className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <p className="text-3xl font-bold text-purple-400">94%</p>
                <p className="text-sm text-gray-300">Accuracy Rate</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-yellow-500/20 to-orange-600/20 rounded-lg border border-yellow-500/30 hover:shadow-[0_0_20px_rgba(255,255,0,0.3)] transition-all">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                <p className="text-3xl font-bold text-yellow-400">3.2s</p>
                <p className="text-sm text-gray-300">Avg Processing Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-gray-900/50 border border-cyan-500/30">
            <TabsTrigger 
              value="pending" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white"
            >
              Pending Matches
            </TabsTrigger>
            <TabsTrigger 
              value="history"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-600 data-[state=active]:text-white"
            >
              Match History
            </TabsTrigger>
            <TabsTrigger 
              value="statistics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
            >
              AI Statistics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <PendingMatches />
          </TabsContent>

          <TabsContent value="history">
            <MatchHistory />
          </TabsContent>

          <TabsContent value="statistics">
            <MatchStatistics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}