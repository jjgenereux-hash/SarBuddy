import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CommandCenter } from '@/components/admin/CommandCenter';
import { Bell, Shield, Users, MapPin, TrendingUp, Dog, AlertCircle, Mail, MessageSquare, PlayCircle, Navigation, Receipt, Clock, Wallet, Map, Palette, UserCog, Eye, BarChart3, Key, Smartphone } from "lucide-react";

import PendingApprovals from "@/components/admin/PendingApprovals";
import UserManagement from "@/components/admin/UserManagement";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import NotificationCenter from "@/components/admin/NotificationCenter";
import K9Dispatch from "@/components/admin/K9Dispatch";
import ContentModeration from "@/components/admin/ContentModeration";
import AdminHeader from "@/components/admin/AdminHeader";
import EmailTemplates from "@/components/admin/EmailTemplates";
import EmailQueue from "@/components/admin/EmailQueue";
import EmailSettings from "@/components/admin/EmailSettings";
import SMSSettings from "@/components/admin/SMSSettings";
import SMSTemplates from "@/components/admin/SMSTemplates";
import SMSAnalytics from "@/components/admin/SMSAnalytics";
import { MissionReplayDashboard } from "@/components/admin/MissionReplayDashboard";
import { MissionPlanner } from "@/components/mission/MissionPlanner";
import { DroneFleetDashboard } from "@/components/fleet/DroneFleetDashboard";
import { TaxReceiptAdmin } from "@/components/admin/TaxReceiptAdmin";
import { VolunteerHoursAdmin } from "@/components/admin/VolunteerHoursAdmin";
import UnifiedAPIMonitor from '@/components/monitoring/UnifiedAPIMonitor';
import { BudgetManager } from '@/components/budget/BudgetManager';
import { MapAnalyticsDashboard } from '@/components/maps/MapAnalyticsDashboard';
import EmailTemplateManager from '@/components/email/EmailTemplateManager';
import { EnhancedUserManagement } from '@/components/admin/EnhancedUserManagement';
import { PetModerationTools } from '@/components/admin/PetModerationTools';
import { SightingVerification } from '@/components/admin/SightingVerification';
import { AnalyticsCharts } from '@/components/admin/AnalyticsCharts';
import APIKeyRotationManager from '@/components/admin/APIKeyRotationManager';
import { MobileAPIBridge } from '@/components/mobile/MobileAPIBridge';
const AdminDashboard = () => {
  const [userRole, setUserRole] = useState<"admin" | "moderator" | "k9staff">("admin");

  const stats = {
    pendingApprovals: 12,
    activeUsers: 1847,
    recoveryRate: 78,
    activeK9Units: 5,
    reportsToday: 23,
    flaggedContent: 3,
    emailsQueued: 8,
    emailsSentToday: 247,
    smsQueued: 5,
    smsSentToday: 189,
  };
  const hasPermission = (feature: string) => {
    const permissions = {
      admin: ["all"],
      moderator: ["approvals", "moderation", "notifications"],
      k9staff: ["k9dispatch", "notifications", "analytics"]
    };
    
    return permissions[userRole].includes("all") || permissions[userRole].includes(feature);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 relative">
      {/* Animated background overlay */}
      <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")"}}></div>
      
      <AdminHeader userRole={userRole} onRoleChange={setUserRole} />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-200">Pending</p>
                  <p className="text-2xl font-bold text-white">{stats.pendingApprovals}</p>
                </div>
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-200">Active Users</p>
                  <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-200">Recovery Rate</p>
                  <p className="text-2xl font-bold text-white">{stats.recoveryRate}%</p>
                </div>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-200">K9 Units</p>
                  <p className="text-2xl font-bold text-white">{stats.activeK9Units}</p>
                </div>
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Dog className="h-8 w-8 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-200">Today's Reports</p>
                  <p className="text-2xl font-bold text-white">{stats.reportsToday}</p>
                </div>
                <div className="p-2 bg-orange-500/20 rounded-lg">
                  <MapPin className="h-8 w-8 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-200">Flagged</p>
                  <p className="text-2xl font-bold text-white">{stats.flaggedContent}</p>
                </div>
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Shield className="h-8 w-8 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap justify-start gap-1 h-auto p-1 bg-white/10 backdrop-blur-md border border-white/20">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="user-management" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <UserCog className="mr-2 h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="pet-moderation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Dog className="mr-2 h-4 w-4" />
              Pet Moderation
            </TabsTrigger>
            <TabsTrigger value="sightings" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Eye className="mr-2 h-4 w-4" />
              Sightings
            </TabsTrigger>
            <TabsTrigger value="command" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Command
            </TabsTrigger>
            <TabsTrigger value="planner" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Planner
            </TabsTrigger>
            <TabsTrigger value="fleet" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Fleet
            </TabsTrigger>
            {hasPermission("approvals") && (
              <TabsTrigger value="approvals" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1">
                Approvals
                {stats.pendingApprovals > 0 && (
                  <Badge className="ml-1 bg-red-600 text-white" variant="destructive">{stats.pendingApprovals}</Badge>
                )}
              </TabsTrigger>
            )}
            {hasPermission("users") && (
              <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Users
              </TabsTrigger>
            )}
            {hasPermission("volunteers") && (
              <TabsTrigger value="volunteers" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Volunteers
              </TabsTrigger>
            )}
            {hasPermission("analytics") && (
              <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Analytics
              </TabsTrigger>
            )}
            {hasPermission("replay") && (
              <TabsTrigger value="replay" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Replay
              </TabsTrigger>
            )}
            {hasPermission("receipts") && (
              <TabsTrigger value="receipts" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Receipts
              </TabsTrigger>
            )}
            {hasPermission("email") && (
              <TabsTrigger value="email" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1">
                Email
                {stats.emailsQueued > 0 && (
                  <Badge className="ml-1 bg-gray-700 text-white" variant="secondary">{stats.emailsQueued}</Badge>
                )}
              </TabsTrigger>
            )}
            {hasPermission("sms") && (
              <TabsTrigger value="sms" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1">
                SMS
                {stats.smsQueued > 0 && (
                  <Badge className="ml-1 bg-gray-700 text-white" variant="secondary">{stats.smsQueued}</Badge>
                )}
              </TabsTrigger>
            )}
            {hasPermission("notifications") && (
              <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Notifications
              </TabsTrigger>
            )}
            {hasPermission("k9dispatch") && (
              <TabsTrigger value="k9dispatch" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                K9 Dispatch
              </TabsTrigger>
            )}
            {hasPermission("moderation") && (
              <TabsTrigger value="moderation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white flex items-center gap-1">
                Moderation
                {stats.flaggedContent > 0 && (
                  <Badge className="ml-1 bg-red-600 text-white" variant="destructive">{stats.flaggedContent}</Badge>
                )}
              </TabsTrigger>
            )}
            {hasPermission("api") && (
              <TabsTrigger value="api" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                API Monitor
              </TabsTrigger>
            )}
            {hasPermission("budget") && (
              <TabsTrigger value="budget" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Budget
              </TabsTrigger>
            )}
            {hasPermission("maps") && (
              <TabsTrigger value="maps" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Maps
              </TabsTrigger>
            )}
            {hasPermission("api") && (
              <TabsTrigger value="key-rotation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Key className="mr-2 h-4 w-4" />
                Key Rotation
              </TabsTrigger>
            )}
            {hasPermission("api") && (
              <TabsTrigger value="mobile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Smartphone className="mr-2 h-4 w-4" />
                Mobile API
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* New Overview Tab */}
          <TabsContent value="overview">
            <AnalyticsCharts />
          </TabsContent>
          
          {/* Enhanced User Management Tab */}
          <TabsContent value="user-management">
            <EnhancedUserManagement />
          </TabsContent>
          
          {/* Pet Moderation Tab */}
          <TabsContent value="pet-moderation">
            <PetModerationTools />
          </TabsContent>
          
          {/* Sighting Verification Tab */}
          <TabsContent value="sightings">
            <SightingVerification />
          </TabsContent>
          
          <TabsContent value="command">
            <CommandCenter />
          </TabsContent>

          <TabsContent value="planner">
            <MissionPlanner />
          </TabsContent>

          <TabsContent value="fleet">
            <DroneFleetDashboard />
          </TabsContent>
          <TabsContent value="approvals">
            {hasPermission("approvals") ? (
              <PendingApprovals />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="users">
            {hasPermission("users") ? (
              <UserManagement />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="volunteers">
            {hasPermission("volunteers") ? (
              <VolunteerHoursAdmin />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            {hasPermission("analytics") ? (
              <AnalyticsDashboard />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="replay">
            {hasPermission("replay") ? (
              <MissionReplayDashboard />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="receipts">
            {hasPermission("receipts") ? (
              <TaxReceiptAdmin />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="email">
            {hasPermission("email") ? (
              <Tabs defaultValue="branded" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="branded">
                    <Palette className="mr-2 h-4 w-4" />
                    Branded Templates
                  </TabsTrigger>
                  <TabsTrigger value="templates">Legacy Templates</TabsTrigger>
                  <TabsTrigger value="queue">
                    Queue
                    {stats.emailsQueued > 0 && (
                      <Badge className="ml-2" variant="secondary">{stats.emailsQueued}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="branded">
                  <EmailTemplateManager />
                </TabsContent>
                
                <TabsContent value="templates">
                  <EmailTemplates />
                </TabsContent>
                
                <TabsContent value="queue">
                  <EmailQueue />
                </TabsContent>
                
                <TabsContent value="settings">
                  <EmailSettings />
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="sms">
            {hasPermission("sms") ? (
              <Tabs defaultValue="templates" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="templates">Templates</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="templates">
                  <SMSTemplates />
                </TabsContent>
                
                <TabsContent value="analytics">
                  <SMSAnalytics />
                </TabsContent>
                
                <TabsContent value="settings">
                  <SMSSettings />
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          <TabsContent value="notifications">
            {hasPermission("notifications") ? (
              <NotificationCenter />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="k9dispatch">
            {hasPermission("k9dispatch") ? (
              <K9Dispatch />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="moderation">
            {hasPermission("moderation") ? (
              <ContentModeration />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="api">
            {hasPermission("api") ? (
              <UnifiedAPIMonitor />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="budget">
            {hasPermission("budget") ? (
              <BudgetManager />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="maps">
            {hasPermission("maps") ? (
              <MapAnalyticsDashboard />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="key-rotation">
            {hasPermission("api") ? (
              <APIKeyRotationManager />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="mobile">
            {hasPermission("api") ? (
              <MobileAPIBridge />
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">You don't have permission to view this section.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;