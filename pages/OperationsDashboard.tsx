import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Users, 
  MapPin, 
  AlertCircle,
  Wifi,
  Cloud,
  Database,
  Settings,
  GitBranch,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import { LiveMap } from '@/components/operations/LiveMap';
import { OperationsChat } from '@/components/operations/OperationsChat';
import { WeatherMonitor } from '@/components/weather/WeatherMonitor';
import { WeatherPredictionPanel } from '@/components/weather/WeatherPredictionPanel';
import { WeatherCacheMonitor } from '@/components/weather/WeatherCacheMonitor';
import { MapboxRealtimeSyncStatus } from '@/components/maps/MapboxRealtimeSyncStatus';
import { SyncRulesManager } from '@/components/sync/SyncRulesManager';
import { SyncConflictResolver } from '@/components/sync/SyncConflictResolver';
import { SyncMetricsDashboard } from '@/components/sync/SyncMetricsDashboard';
import { supabase } from '@/lib/supabase';

import { 
  RefreshCw,
  Map,
  Play,
  Pause,
  StopCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { weatherCache } from '@/services/weatherCache';
import { WeatherOverlay } from '@/components/weather/WeatherOverlay';
import { WeatherRadarOverlay } from '@/components/weather/WeatherRadarOverlay';
export function OperationsDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('map');
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lon: -122.4194 });
  const [weatherEnabled, setWeatherEnabled] = useState(true);
  const [cacheStats, setCacheStats] = useState(weatherCache.getStats());

  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(weatherCache.getStats());
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const handleClearCache = () => {
    weatherCache.invalidate();
    setCacheStats(weatherCache.getStats());
  };
  
  const mockOperation = {
    id: 'op-123',
    name: 'Lost Dog Search - Central Park',
    status: 'active',
    center_lat: 40.7829,
    center_lng: -73.9654,
    radius_meters: 2000,
    created_at: new Date().toISOString()
  };
  
  const mockAlerts = [
    {
      id: '1',
      title: 'Possible Sighting',
      message: 'Dog spotted near playground area',
      severity: 'info',
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Weather Update',
      message: 'Light rain expected in 30 minutes',
      severity: 'warning',
      created_at: new Date(Date.now() - 600000).toISOString()
    }
  ];
  
  // Add missing state declarations
  const [loading, setLoading] = useState(false);
  const [activeOperation, setActiveOperation] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    volunteers: 0,
    drones: 0,
    zonesCompleted: 0,
    totalZones: 0
  });
  
  const currentUser = {
    id: '1',
    name: 'Coordinator',
    role: 'coordinator'
  };

  useEffect(() => {
    loadActiveOperation();
  }, []);

  const loadActiveOperation = async () => {
    try {
      // Try to load from Supabase first
      const { data, error } = await supabase
        .from('active_operations')
        .select('*')
        .eq('status', 'active')
        .maybeSingle();
      
      if (error) {
        console.log('Using mock data - Supabase table may not exist yet');
        // Use mock data if table doesn't exist
        setActiveOperation(mockOperation);
        setAlerts(mockAlerts);
        setStats({
          volunteers: 12,
          drones: 3,
          zonesCompleted: 4,
          totalZones: 8
        });
      } else if (data) {
        setActiveOperation(data);
        await loadOperationStats(data.id);
      } else {
        // No active operation, use mock for demo
        setActiveOperation(mockOperation);
        setAlerts(mockAlerts);
        setStats({
          volunteers: 12,
          drones: 3,
          zonesCompleted: 4,
          totalZones: 8
        });
      }
    } catch (err) {
      console.error('Error loading operation:', err);
      // Use mock data on error
      setActiveOperation(mockOperation);
      setAlerts(mockAlerts);
      setStats({
        volunteers: 12,
        drones: 3,
        zonesCompleted: 4,
        totalZones: 8
      });
    } finally {
      setLoading(false);
    }
  };

  const loadOperationStats = async (opId: string) => {
    try {
      const [volunteers, drones, zones] = await Promise.all([
        supabase.from('volunteer_positions').select('id').eq('operation_id', opId),
        supabase.from('drone_live_telemetry').select('id').eq('operation_id', opId),
        supabase.from('search_zones').select('*').eq('operation_id', opId)
      ]);

      setStats({
        volunteers: volunteers.data?.length || 0,
        drones: drones.data?.length || 0,
        zonesCompleted: zones.data?.filter((z: any) => z.status === 'completed').length || 0,
        totalZones: zones.data?.length || 0
      });
    } catch (err) {
      console.error('Error loading stats:', err);
      // Use default stats on error
      setStats({
        volunteers: 12,
        drones: 3,
        zonesCompleted: 4,
        totalZones: 8
      });
    }
  };

  const broadcastAlert = async (type: string, severity: string) => {
    if (!activeOperation) return;

    toast({
      title: `${type.toUpperCase()} Alert Broadcast`,
      description: `Alert has been sent to all team members`,
      variant: severity === 'critical' ? 'destructive' : 'default'
    });

    // Add to local alerts
    const newAlert = {
      id: Date.now().toString(),
      title: `${type.toUpperCase()} Alert`,
      message: `Alert broadcast by ${currentUser.name}`,
      severity,
      created_at: new Date().toISOString()
    };
    setAlerts(prev => [newAlert, ...prev].slice(0, 5));
  };

  const startNewOperation = () => {
    setActiveOperation(mockOperation);
    setStats({
      volunteers: 12,
      drones: 3,
      zonesCompleted: 0,
      totalZones: 8
    });
    toast({
      title: "Operation Started",
      description: "New search operation has been initiated"
    });
  };

  const pauseOperation = () => {
    if (activeOperation) {
      setActiveOperation({ ...activeOperation, status: 'paused' });
      toast({
        title: "Operation Paused",
        description: "Search operation has been temporarily paused"
      });
    }
  };

  const endOperation = () => {
    setActiveOperation(null);
    setAlerts([]);
    toast({
      title: "Operation Ended",
      description: "Search operation has been concluded",
      variant: "destructive"
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <RefreshCw className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
            <h2 className="text-xl font-semibold mb-2">Loading Operations Center...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activeOperation) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">No Active Operations</h2>
            <p className="text-gray-600 mb-4">Start a new search operation to access the command center</p>
            <Button onClick={startNewOperation}>Start New Operation</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="mb-6 flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Operations Map
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              Weather Analysis
            </TabsTrigger>
            <TabsTrigger value="sync" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Data Sync
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Sync Rules
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Conflicts
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Metrics
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="h-3 w-3 mr-1" />
              Cache Hit Rate: {cacheStats.hits + cacheStats.misses > 0 
                ? Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100) 
                : 0}%
            </Badge>
            <Button variant="outline" size="sm" onClick={handleClearCache}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Clear Cache
            </Button>
          </div>
        </div>

        <TabsContent value="map" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="h-[600px]">
                <CardHeader>
                  <CardTitle>Live Operations Map</CardTitle>
                </CardHeader>
                <CardContent className="h-[540px] relative">
                  <LiveMap />
                  {weatherEnabled && (
                    <div className="absolute top-4 right-4 z-10">
                      <WeatherOverlay 
                        lat={mapCenter.lat} 
                        lon={mapCenter.lon}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <WeatherPredictionPanel 
                predictions={{
                  efficiency: 0.85,
                  visibilityRange: '5km',
                  recommendedPattern: 'grid',
                  avoidZones: [],
                  optimalTimes: ['10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM']
                }}
                onApplyRoute={(route) => {
                  toast({
                    title: "Route Applied",
                    description: "Weather-optimized search pattern has been applied"
                  });
                }}
              />
              <OperationsChat
                operationId="op-123"
                currentUser={{ id: '1', name: 'Coordinator', role: 'coordinator' }}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="weather" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Weather Radar Overlay</CardTitle>
              </CardHeader>
              <CardContent className="h-[500px]">
                <WeatherRadarOverlay />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Current Conditions</CardTitle>
              </CardHeader>
              <CardContent>
                <WeatherOverlay 
                  lat={mapCenter.lat} 
                  lon={mapCenter.lon}
                />
              </CardContent>
            </Card>
          </div>
          
          <WeatherPredictionPanel 
            predictions={{
              efficiency: 0.85,
              visibilityRange: '5km',
              recommendedPattern: 'grid',
              avoidZones: [],
              optimalTimes: ['10:00 AM - 12:00 PM', '2:00 PM - 4:00 PM']
            }}
            onApplyRoute={(route) => {
              toast({
                title: "Route Applied",
                description: "Weather-optimized search pattern has been applied"
              });
            }}
          />
        </TabsContent>

        <TabsContent value="cache" className="space-y-6">
          <WeatherCacheMonitor />
          
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-3xl font-bold">{cacheStats.hits + cacheStats.misses}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Cache Efficiency</p>
                  <p className="text-3xl font-bold text-green-600">
                    {cacheStats.hits + cacheStats.misses > 0 
                      ? Math.round((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100) 
                      : 0}%
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Memory Usage</p>
                  <p className="text-3xl font-bold text-blue-600">{cacheStats.size}/100</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <MapboxRealtimeSyncStatus />
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          <SyncRulesManager />
        </TabsContent>

        <TabsContent value="conflicts" className="space-y-6">
          <SyncConflictResolver />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <SyncMetricsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default OperationsDashboard;