import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DroneFleetDashboard } from '@/components/fleet/DroneFleetDashboard';
import { MissionPlanner } from '@/components/mission/MissionPlanner';
import LiveTracker from '@/components/tracking/LiveTracker';
import { WeatherMonitor } from '@/components/admin/WeatherMonitor';
import { Mission3DVisualization } from '@/components/mission/Mission3DVisualization';
import { MaintenanceScheduler } from '@/components/fleet/MaintenanceScheduler';
import { DroneDispatch } from '@/components/admin/DroneDispatch';
import AIVideoAnalysisDashboard from '@/components/ai/AIVideoAnalysisDashboard';
import { Terrain3DVisualization } from '@/components/terrain/Terrain3DVisualization';
import { 
  Plane, Navigation, Radio, Cloud, View, Wrench, Send, Brain, Mountain
} from 'lucide-react';
export default function DroneFleetManagement() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Drone Fleet Management</h1>
          <p className="text-muted-foreground">
            Real-time tracking, mission planning, and automated dispatch system
          </p>
        </div>

        <Tabs defaultValue="fleet" className="space-y-6">
          <TabsList className="grid grid-cols-9 w-full max-w-6xl">
            <TabsTrigger value="fleet" className="flex items-center space-x-2">
              <Plane className="h-4 w-4" />
              <span className="hidden sm:inline">Fleet</span>
            </TabsTrigger>
            <TabsTrigger value="mission" className="flex items-center space-x-2">
              <Navigation className="h-4 w-4" />
              <span className="hidden sm:inline">Mission</span>
            </TabsTrigger>
            <TabsTrigger value="terrain" className="flex items-center space-x-2">
              <Mountain className="h-4 w-4" />
              <span className="hidden sm:inline">Terrain</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center space-x-2">
              <Radio className="h-4 w-4" />
              <span className="hidden sm:inline">Tracking</span>
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="weather" className="flex items-center space-x-2">
              <Cloud className="h-4 w-4" />
              <span className="hidden sm:inline">Weather</span>
            </TabsTrigger>
            <TabsTrigger value="3d" className="flex items-center space-x-2">
              <View className="h-4 w-4" />
              <span className="hidden sm:inline">3D View</span>
            </TabsTrigger>
            <TabsTrigger value="maintenance" className="flex items-center space-x-2">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Maintenance</span>
            </TabsTrigger>
            <TabsTrigger value="dispatch" className="flex items-center space-x-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Dispatch</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="fleet" className="space-y-6">
            <DroneFleetDashboard />
          </TabsContent>

          <TabsContent value="mission" className="space-y-6">
            <MissionPlanner />
          </TabsContent>

          <TabsContent value="terrain" className="space-y-6">
            <Terrain3DVisualization />
          </TabsContent>

          <TabsContent value="tracking" className="space-y-6">
            <LiveTracker />
          </TabsContent>
          
          <TabsContent value="ai-analysis" className="space-y-6">
            <AIVideoAnalysisDashboard />
          </TabsContent>

          <TabsContent value="weather" className="space-y-6">
            <WeatherMonitor />
          </TabsContent>

          <TabsContent value="3d" className="space-y-6">
            <Mission3DVisualization />
          </TabsContent>

          <TabsContent value="maintenance" className="space-y-6">
            <MaintenanceScheduler />
          </TabsContent>

          <TabsContent value="dispatch" className="space-y-6">
            <DroneDispatch />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}