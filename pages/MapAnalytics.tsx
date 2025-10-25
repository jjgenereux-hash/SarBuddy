import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapAnalyticsDashboard } from '@/components/maps/MapAnalyticsDashboard';
import { GoogleMapsUsageMonitor } from '@/components/maps/GoogleMapsUsageMonitor';
import { MapboxDataLayerManager } from '@/components/maps/MapboxDataLayerManager';
import { MapboxHeatmapLayer } from '@/components/maps/MapboxHeatmapLayer';
import { MapboxRealtimeSyncStatus } from '@/components/maps/MapboxRealtimeSyncStatus';
import { PerformanceMetrics } from '@/components/maps/analytics/PerformanceMetrics';
import { CoverageGaps } from '@/components/maps/analytics/CoverageGaps';
import { ProviderUsageChart } from '@/components/maps/analytics/ProviderUsageChart';
import { FailoverEvents } from '@/components/maps/analytics/FailoverEvents';
import { 
  Map, 
  BarChart3, 
  Layers,
  Flame,
  Cloud,
  Activity,
  AlertCircle,
  TrendingUp,
  Shield,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';

export default function MapAnalytics() {
  const [activeDatasetId, setActiveDatasetId] = useState<string>('pet-sightings-2024');
  const [refreshing, setRefreshing] = useState(false);

  const performanceMetrics = {
    avgLoadTime: 45,
    p95LoadTime: 120,
    cacheEfficiency: 87,
    memoryUsage: 42,
    diskUsage: 68,
    networkLatency: 12,
    throughput: 2.4,
    errorRate: 0.3
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleExport = () => {
    console.log('Exporting analytics data...');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Map Analytics & Data Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor performance, manage data layers, and control real-time synchronization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
              Live
            </div>
          </Badge>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <PerformanceMetrics metrics={performanceMetrics} />

      <Tabs defaultValue="realtime-sync" className="space-y-4">
        <TabsList className="grid grid-cols-8 w-full">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="coverage">
            <Map className="h-4 w-4 mr-2" />
            Coverage
          </TabsTrigger>
          <TabsTrigger value="providers">
            <TrendingUp className="h-4 w-4 mr-2" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="failover">
            <Shield className="h-4 w-4 mr-2" />
            Failover
          </TabsTrigger>
          <TabsTrigger value="data-layers">
            <Layers className="h-4 w-4 mr-2" />
            Layers
          </TabsTrigger>
          <TabsTrigger value="heatmap">
            <Flame className="h-4 w-4 mr-2" />
            Heatmap
          </TabsTrigger>
          <TabsTrigger value="realtime-sync">
            <Cloud className="h-4 w-4 mr-2" />
            Sync
          </TabsTrigger>
          <TabsTrigger value="usage">
            <Activity className="h-4 w-4 mr-2" />
            Usage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <MapAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="coverage">
          <CoverageGaps />
        </TabsContent>

        <TabsContent value="providers">
          <ProviderUsageChart />
        </TabsContent>

        <TabsContent value="failover">
          <FailoverEvents />
        </TabsContent>

        <TabsContent value="data-layers">
          <Card>
            <CardHeader>
              <CardTitle>Mapbox Data Layer Management</CardTitle>
              <CardDescription>
                Upload and manage custom pet sighting data layers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MapboxDataLayerManager onDatasetCreated={setActiveDatasetId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle>Pet Sighting Heatmap</CardTitle>
              <CardDescription>
                Visualize pet sighting density and clusters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MapboxHeatmapLayer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime-sync">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Database Synchronization
              </CardTitle>
              <CardDescription>
                Automatic synchronization between database and Mapbox datasets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MapboxRealtimeSyncStatus datasetId={activeDatasetId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <GoogleMapsUsageMonitor />
        </TabsContent>
      </Tabs>
    </div>
  );
}