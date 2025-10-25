import React, { useState } from 'react';
import { EnhancedCommandCenter } from '@/components/admin/EnhancedCommandCenter';
import WeatherMonitor from '@/components/admin/WeatherMonitor';
import DroneMonitor from '@/components/admin/DroneMonitor';
import { MapCacheManager } from '@/components/admin/MapCacheManager';
import { CDNDashboard } from '@/components/cdn/CDNDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Map, Cloud, Plane, Users, AlertTriangle, Activity,
  Settings, Download, Upload, RefreshCw, Maximize2,
  Radio, Wifi, Battery, Signal, HardDrive, Globe
} from 'lucide-react';

const CommandCenterPage: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState('map');

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
        setIsFullscreen(true);
      } else {
        document.exitFullscreen().catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
        setIsFullscreen(false);
      }
    } catch (err) {
      console.warn('Fullscreen not supported:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Radio className="w-6 h-6 text-red-500 animate-pulse" />
              SAR Command Center
            </h1>
            <Badge variant="destructive" className="animate-pulse">
              LIVE OPERATIONS
            </Badge>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              <span>24 Active</span>
              <span className="mx-2">•</span>
              <Plane className="w-4 h-4" />
              <span>3 Airborne</span>
              <span className="mx-2">•</span>
              <Activity className="w-4 h-4" />
              <span>2 Operations</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen}>
              <Maximize2 className="w-4 h-4 mr-2" />
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* System Status Bar */}
      <div className="bg-gray-800 text-white px-6 py-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Wifi className="w-4 h-4 text-green-400" />
              <span>Network: Excellent</span>
            </div>
            <div className="flex items-center gap-2">
              <Signal className="w-4 h-4 text-yellow-400" />
              <span>GPS: 12 Satellites</span>
            </div>
            <div className="flex items-center gap-2">
              <Battery className="w-4 h-4 text-green-400" />
              <span>Power: UPS Active</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Last Update:</span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6 max-w-4xl">
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="w-4 h-4" />
              Live Map
            </TabsTrigger>
            <TabsTrigger value="drones" className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Drone Fleet
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center gap-2">
              <Cloud className="w-4 h-4" />
              Weather
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="cache" className="flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Map Cache
            </TabsTrigger>
            <TabsTrigger value="cdn" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              CDN
            </TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Active Search:</strong> Missing Golden Retriever "Max" - Last seen near Golden Gate Park. 
                3 teams deployed, 2 drones airborne. High priority search zone established.
              </AlertDescription>
            </Alert>
            <div className="h-[calc(100vh-300px)]">
              <EnhancedCommandCenter />
            </div>
          </TabsContent>

          <TabsContent value="drones" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Total Fleet</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">8 Drones</p>
                  <p className="text-xs text-gray-500">3 Active • 5 Ready</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Flight Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">124.5</p>
                  <p className="text-xs text-gray-500">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Area Covered</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">45.2 km²</p>
                  <p className="text-xs text-gray-500">Today</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">Success Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-green-600">87%</p>
                  <p className="text-xs text-gray-500">Pet recoveries</p>
                </CardContent>
              </Card>
            </div>
            <DroneMonitor />
          </TabsContent>

          <TabsContent value="weather" className="space-y-4">
            <WeatherMonitor />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Search Efficiency Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Area Coverage Rate</span>
                        <span className="text-sm font-bold">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Response Time</span>
                        <span className="text-sm font-bold">12 min</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm">Team Coordination</span>
                        <span className="text-sm font-bold">88%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity Log</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Drone 2 reached waypoint 5</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Team Alpha entered search zone B</p>
                        <p className="text-xs text-gray-500">5 minutes ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-1.5"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Weather update: Wind speed increasing</p>
                        <p className="text-xs text-gray-500">8 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cache" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <MapCacheManager />
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Cache Benefits</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                      <div>
                        <p className="text-sm font-medium">Reduced API Calls</p>
                        <p className="text-xs text-gray-500">Save on map service costs</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                      <div>
                        <p className="text-sm font-medium">Faster Load Times</p>
                        <p className="text-xs text-gray-500">Instant tile rendering from cache</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mt-1.5"></div>
                      <div>
                        <p className="text-sm font-medium">Offline Support</p>
                        <p className="text-xs text-gray-500">Continue operations without internet</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5"></div>
                      <div>
                        <p className="text-sm font-medium">Automatic Management</p>
                        <p className="text-xs text-gray-500">Smart LRU eviction and cleanup</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Tips</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-gray-600">
                    <p>• Cache frequently viewed areas before field operations</p>
                    <p>• Enable offline mode for areas with poor connectivity</p>
                    <p>• Clear cache periodically to free up browser storage</p>
                    <p>• Monitor cache size to ensure optimal performance</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cdn" className="space-y-4">
            <CDNDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommandCenterPage;