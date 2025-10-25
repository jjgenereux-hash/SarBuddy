import React, { useState } from 'react';
import { Users, Navigation, Shield, Activity, MapPin, AlertTriangle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import GPSTracker from '@/components/tracking/GPSTracker';
import TeamCoordinator from '@/components/tracking/TeamCoordinator';
import LiveTracker from '@/components/tracking/LiveTracker';

export default function TeamTrackingDashboard() {
  const [userRole] = useState<'volunteer' | 'coordinator'>('coordinator');
  const [teamId] = useState('team-alpha');
  const [memberId] = useState('member-001');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Team Tracking System</h1>
          <p className="text-muted-foreground mt-1">
            Real-time GPS tracking and coordination for search teams
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-medium">Role: {userRole === 'coordinator' ? 'Coordinator' : 'Volunteer'}</span>
        </div>
      </div>

      {/* Emergency Notice */}
      <Alert>
        <Activity className="h-4 w-4" />
        <AlertTitle>Active Search Mission</AlertTitle>
        <AlertDescription>
          Missing person search in Golden Gate Park area. All teams maintain 15-minute check-in intervals.
        </AlertDescription>
      </Alert>

      {/* Main Content */}
      <Tabs defaultValue="coordinator" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="coordinator" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Team Coordinator
          </TabsTrigger>
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <Navigation className="h-4 w-4" />
            My Tracker
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Live View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="coordinator" className="space-y-4">
          <TeamCoordinator />
        </TabsContent>

        <TabsContent value="tracker" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>GPS Tracking</CardTitle>
                  <CardDescription>
                    Your location is being shared with the search coordinator
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GPSTracker 
                    teamId={teamId} 
                    memberId={memberId}
                    onLocationUpdate={(location) => console.log('Location updated:', location)}
                  />
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Found Clue</div>
                    <div className="text-xs text-muted-foreground">Mark location with evidence</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Request Backup</div>
                    <div className="text-xs text-muted-foreground">Call for additional team members</div>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Weather Alert</div>
                    <div className="text-xs text-muted-foreground">Report hazardous conditions</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Team Alpha</span>
                      <span className="text-green-600">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Members Online</span>
                      <span>4/5</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Area Coverage</span>
                      <span>2.3 km²</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Search Duration</span>
                      <span>02:45:00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="live" className="space-y-4">
          <LiveTracker />
        </TabsContent>
      </Tabs>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">12</div>
                <div className="text-xs text-muted-foreground">Active Teams</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">47</div>
                <div className="text-xs text-muted-foreground">Volunteers</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">8.7</div>
                <div className="text-xs text-muted-foreground">km² Covered</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">0</div>
                <div className="text-xs text-muted-foreground">SOS Alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}