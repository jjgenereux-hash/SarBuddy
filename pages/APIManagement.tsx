import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { APIKeyManager } from '@/components/api/APIKeyManager';
import { UsageAnalytics } from '@/components/api/UsageAnalytics';
import { RateLimitManager } from '@/components/api/RateLimitManager';
import { Shield, Key, Activity, Settings, AlertTriangle, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function APIManagement() {
  const [activeTab, setActiveTab] = useState('keys');

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">API Management</h1>
        <p className="text-muted-foreground">
          Manage API keys, monitor usage, and configure rate limiting
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active API Keys</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">12</p>
              <Key className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">3 created this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Requests (24h)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">45.2K</p>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-green-600 mt-1">↑ 12% from yesterday</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Blocked Threats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">89</p>
              <Shield className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Response Time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">142ms</p>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-xs text-green-600 mt-1">↓ 8ms improvement</p>
          </CardContent>
        </Card>
      </div>

      {/* Security Alert */}
      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> We detected 3 suspicious activity patterns in the last hour. 
          Review the security tab for details.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Usage
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="docs" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <APIKeyManager />
        </TabsContent>

        <TabsContent value="usage">
          <UsageAnalytics />
        </TabsContent>

        <TabsContent value="security">
          <RateLimitManager />
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Integration guide and endpoint reference
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Authentication</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Include your API key in the request headers:
                </p>
                <pre className="bg-muted p-3 rounded-lg text-sm">
                  {`curl -H "X-API-Key: sar_your_api_key_here" \\
     https://api.sarbuddy.com/v1/pets`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Rate Limits</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Rate limits are enforced based on your API key's plan:
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Free Plan:</span>
                    <span className="font-mono">20 req/min, 100 req/hr, 1000 req/day</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Basic Plan:</span>
                    <span className="font-mono">60 req/min, 1000 req/hr, 10000 req/day</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Premium Plan:</span>
                    <span className="font-mono">300 req/min, 5000 req/hr, 50000 req/day</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response Headers</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Each response includes rate limit information:
                </p>
                <pre className="bg-muted p-3 rounded-lg text-sm">
                  {`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640995200`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Error Handling</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  API errors follow standard HTTP status codes:
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>401 Unauthorized:</span>
                    <span>Invalid or missing API key</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>403 Forbidden:</span>
                    <span>API key blocked or insufficient permissions</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>429 Too Many Requests:</span>
                    <span>Rate limit exceeded</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Available Endpoints</h3>
                <div className="space-y-3">
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-sm font-mono">GET /v1/pets</code>
                      <Badge variant="outline">Public</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      List all missing pets with optional filters
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-sm font-mono">POST /v1/pets/report</code>
                      <Badge variant="outline">Authenticated</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Report a new missing pet
                    </p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <code className="text-sm font-mono">POST /v1/analyze/photo</code>
                      <Badge variant="outline">Premium</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      AI-powered photo analysis for pet matching
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}