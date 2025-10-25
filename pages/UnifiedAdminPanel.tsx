import React, { useState, lazy, Suspense } from 'react';
import { 
  LayoutDashboard, 
  Key, 
  Shield, 
  CreditCard, 
  BarChart3, 
  Activity, 
  Plane, 
  Webhook, 
  Terminal,
  Brain,
  Map,
  Settings,
  Users,
  Bell,
  Database,
  Cloud,
  Lock,
  Monitor
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import UnifiedOverview from '@/components/admin/UnifiedOverview';
// Lazy load admin components for better performance
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const APIManagement = lazy(() => import('./APIManagement'));
const APIAuthManagement = lazy(() => import('./APIAuthManagement'));
const PaymentDashboard = lazy(() => import('./PaymentDashboard'));
const AnalyticsDashboard = lazy(() => import('./AnalyticsDashboard'));
const OperationsDashboard = lazy(() => import('./OperationsDashboard'));
const DroneFleetDashboard = lazy(() => import('./DroneFleetDashboard'));
const WebhookDashboard = lazy(() => import('./WebhookDashboard'));
const CommandCenterPage = lazy(() => import('./CommandCenterPage'));
const MLTrainingPipeline = lazy(() => import('./MLTrainingPipeline'));
const MapAnalytics = lazy(() => import('./MapAnalytics'));

const LoadingFallback = () => (
  <div className="space-y-4 p-6">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-64 w-full" />
    <Skeleton className="h-32 w-full" />
  </div>
);

const UnifiedAdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const adminSections = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, badge: null },
    { id: 'command', label: 'Command Center', icon: Terminal, badge: 'Live' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, badge: null },
    { id: 'operations', label: 'Operations', icon: Activity, badge: null },
    { id: 'api', label: 'API Management', icon: Key, badge: null },
    { id: 'auth', label: 'API Auth', icon: Shield, badge: null },
    { id: 'webhooks', label: 'Webhooks', icon: Webhook, badge: null },
    { id: 'payment', label: 'Payments', icon: CreditCard, badge: null },
    { id: 'drones', label: 'Drone Fleet', icon: Plane, badge: '3 Active' },
    { id: 'ml', label: 'ML Training', icon: Brain, badge: null },
    { id: 'maps', label: 'Map Analytics', icon: Map, badge: null },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <UnifiedOverview />
          </Suspense>
        );
      case 'command':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <CommandCenterPage />
          </Suspense>
        );
      case 'analytics':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <AnalyticsDashboard />
          </Suspense>
        );
      case 'operations':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <OperationsDashboard />
          </Suspense>
        );
      case 'api':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <APIManagement />
          </Suspense>
        );
      case 'auth':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <APIAuthManagement />
          </Suspense>
        );
      case 'webhooks':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <WebhookDashboard />
          </Suspense>
        );
      case 'payment':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <PaymentDashboard />
          </Suspense>
        );
      case 'drones':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <DroneFleetDashboard />
          </Suspense>
        );
      case 'ml':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <MLTrainingPipeline />
          </Suspense>
        );
      case 'maps':
        return (
          <Suspense fallback={<LoadingFallback />}>
            <MapAnalytics />
          </Suspense>
        );
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Unified Admin Control Center
          </h1>
          <p className="text-gray-600 mt-2">Centralized management for all system operations</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-11 gap-2 h-auto p-2 bg-white shadow-lg rounded-lg">
            {adminSections.map((section) => {
              const Icon = section.icon;
              return (
                <TabsTrigger
                  key={section.id}
                  value={section.id}
                  className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-500 data-[state=active]:text-white rounded-lg transition-all"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{section.label}</span>
                  {section.badge && (
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {section.badge}
                    </Badge>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="bg-white rounded-lg shadow-xl">
            <ScrollArea className="h-[calc(100vh-200px)]">
              <TabsContent value={activeTab} className="m-0">
                {renderContent()}
              </TabsContent>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default UnifiedAdminPanel;