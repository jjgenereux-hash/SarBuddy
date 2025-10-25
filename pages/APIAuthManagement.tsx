import React, { useState } from 'react';
import { ApiKeyDashboard } from '@/components/api/ApiKeyDashboard';
import { RateLimitDashboard } from '@/components/api/RateLimitDashboard';
import { BurstHandler } from '@/components/api/BurstHandler';
import { OAuth2Dashboard } from '@/components/auth/OAuth2Dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Lock, Key, AlertTriangle, Gauge, Zap, Activity, Settings, UserCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export default function APIAuthManagement() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Advanced API & Authentication System</h1>
          <p className="text-lg text-gray-600">
            Enterprise-grade API security with OAuth2 authentication, advanced rate limiting, and dynamic throttling
          </p>
        </div>

        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <strong>Enhanced Security Active:</strong> OAuth2 authentication with multiple providers, JWT token management, 
            per-user quotas, IP-based rate limiting, and intelligent burst handling. All API keys are proxied through secure edge functions.
          </AlertDescription>
        </Alert>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Protected APIs</p>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-xs text-green-600">All secured</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">OAuth Providers</p>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-xs text-purple-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Gauge className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rate Limit Status</p>
                  <p className="text-2xl font-bold">Active</p>
                  <p className="text-xs text-green-600">Dynamic</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Zap className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Burst Capacity</p>
                  <p className="text-2xl font-bold">85%</p>
                  <p className="text-xs text-yellow-600">Available</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Activity className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">System Load</p>
                  <p className="text-2xl font-bold">42%</p>
                  <p className="text-xs text-orange-600">Optimal</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="oauth">OAuth2</TabsTrigger>
            <TabsTrigger value="ratelimits">Rate Limiting</TabsTrigger>
            <TabsTrigger value="burst">Burst Control</TabsTrigger>
            <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Authentication Features</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>OAuth2 Authentication</span>
                        <Badge className="bg-green-500">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>JWT Token Management</span>
                        <Badge className="bg-green-500">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Refresh Token Rotation</span>
                        <Badge className="bg-green-500">Auto</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Scope-Based Permissions</span>
                        <Badge className="bg-green-500">Configured</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Rate Limiting Features</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Per-User Quotas</span>
                        <Badge className="bg-green-500">Active</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Tiered Access Levels</span>
                        <Badge className="bg-green-500">4 Tiers</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>IP-Based Rate Limiting</span>
                        <Badge className="bg-green-500">Enabled</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span>Dynamic Throttling</span>
                        <Badge className="bg-green-500">Auto</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <h4 className="font-semibold mb-2">OAuth Providers</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔍</span>
                        <span className="text-sm">Google OAuth 2.0</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🐙</span>
                        <span className="text-sm">GitHub OAuth</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🪟</span>
                        <span className="text-sm">Microsoft Azure AD</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Token Security</h4>
                    <div className="space-y-1 text-sm">
                      <div>✓ JWT with RS256 signing</div>
                      <div>✓ Automatic token refresh</div>
                      <div>✓ Secure token storage</div>
                      <div>✓ Token introspection</div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg">
                    <h4 className="font-semibold mb-2">Access Control</h4>
                    <div className="space-y-1 text-sm">
                      <div>✓ Scope-based permissions</div>
                      <div>✓ Consent management</div>
                      <div>✓ API key scoping</div>
                      <div>✓ Custom rate limits</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="oauth">
            <OAuth2Dashboard />
          </TabsContent>

          <TabsContent value="ratelimits">
            <RateLimitDashboard />
          </TabsContent>

          <TabsContent value="burst">
            <BurstHandler />
          </TabsContent>

          <TabsContent value="apikeys">
            <ApiKeyDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}