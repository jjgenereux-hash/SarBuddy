import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, Settings, History, AlertTriangle, Activity } from 'lucide-react';
import RealTimeAlertMonitor from '@/components/alerts/RealTimeAlertMonitor';
import NotificationHistory from '@/components/alerts/NotificationHistory';
import EscalationRules from '@/components/alerts/EscalationRules';
import AlertPreferences from '@/components/alerts/AlertPreferences';

export default function AlertsDashboard() {
  const [activeTab, setActiveTab] = useState('monitor');

  // Example pet data - in production this would come from context or props
  const examplePet = {
    id: '123',
    name: 'Max'
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-500" />
            Alert System Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time monitoring and notification management for pet sightings
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="monitor" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monitor
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="escalation" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Escalation
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitor" className="space-y-6">
          <RealTimeAlertMonitor />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <NotificationHistory />
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AlertPreferences petId={examplePet.id} petName={examplePet.name} />
            <Card>
              <CardHeader>
                <CardTitle>Global Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Default Notification Channels</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure which channels are enabled by default for new pets
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Emergency Contacts</h4>
                    <p className="text-sm text-muted-foreground">
                      Add backup contacts for critical alerts
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Location Services</h4>
                    <p className="text-sm text-muted-foreground">
                      Enable location-based alerts and proximity notifications
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="escalation" className="space-y-6">
          <EscalationRules />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Alert Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span className="text-sm">Average Response Time</span>
                    <span className="font-bold">3.2 min</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span className="text-sm">Delivery Success Rate</span>
                    <span className="font-bold text-green-600">98.5%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span className="text-sm">False Positive Rate</span>
                    <span className="font-bold text-yellow-600">12%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 border rounded">
                    <span className="text-sm">Escalation Rate</span>
                    <span className="font-bold">8.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">SMS</span>
                      <span className="text-sm">342 sent today</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '75%' }} />
                    </div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Push</span>
                      <span className="text-sm">521 sent today</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div className="p-3 border rounded">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Email</span>
                      <span className="text-sm">189 sent today</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '45%' }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}