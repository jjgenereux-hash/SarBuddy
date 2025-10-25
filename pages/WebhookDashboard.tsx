import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WebhookEndpointManager } from '@/components/webhooks/WebhookEndpointManager';
import { WebhookSubscriptionManager } from '@/components/webhooks/WebhookSubscriptionManager';
import { WebhookDeliveryLog } from '@/components/webhooks/WebhookDeliveryLog';
import { Webhook, Settings, Bell, History, Shield, Code } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function WebhookDashboard() {
  const [activeTab, setActiveTab] = useState('endpoints');

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Webhook className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Webhook Management</h1>
        </div>
        <p className="text-muted-foreground">
          Configure webhook endpoints to receive real-time notifications about pet sightings, 
          status changes, and search operations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="endpoints" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Endpoints
          </TabsTrigger>
          <TabsTrigger value="subscriptions" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Subscriptions
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Delivery Log
          </TabsTrigger>
          <TabsTrigger value="documentation" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Documentation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="endpoints">
          <WebhookEndpointManager />
        </TabsContent>

        <TabsContent value="subscriptions">
          <WebhookSubscriptionManager />
        </TabsContent>

        <TabsContent value="deliveries">
          <WebhookDeliveryLog />
        </TabsContent>

        <TabsContent value="documentation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Documentation</CardTitle>
              <CardDescription>
                Learn how to integrate with SAR Buddy webhooks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Security</h3>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All webhook payloads are signed using HMAC-SHA256. Verify the signature 
                    by comparing the X-Webhook-Signature header with your computed signature.
                  </AlertDescription>
                </Alert>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Payload Format</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
{`{
  "id": "delivery-uuid",
  "event": "pet.sighted",
  "data": {
    // Event-specific data
  },
  "timestamp": "2024-01-01T00:00:00Z"
}`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Headers</h3>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div><code>X-Webhook-Signature</code>: HMAC-SHA256 signature</div>
                  <div><code>X-Webhook-Event</code>: Event type identifier</div>
                  <div><code>X-Webhook-Delivery</code>: Unique delivery ID</div>
                  <div><code>Content-Type</code>: application/json</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Retry Policy</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Failed deliveries are retried with exponential backoff</li>
                  <li>Default: 3 attempts with 2x backoff multiplier</li>
                  <li>Initial delay: 1 second, max delay: 1 hour</li>
                  <li>Webhooks timeout after 30 seconds</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Available Events</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Pet Events</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• pet.reported - New missing pet</li>
                      <li>• pet.found - Pet recovered</li>
                      <li>• pet.sighted - Sighting reported</li>
                      <li>• pet.status_changed - Status update</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Search Events</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• search.started - Search begun</li>
                      <li>• search.completed - Search ended</li>
                      <li>• search.zone_updated - Zone changed</li>
                      <li>• team.formed - Team created</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Volunteer Events</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• volunteer.joined - Joined search</li>
                      <li>• volunteer.checked_in - Location check-in</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">AI & Drone Events</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground">
                      <li>• drone.deployed - Drone launched</li>
                      <li>• drone.anomaly_detected - AI detection</li>
                      <li>• match.potential - Possible match</li>
                      <li>• match.confirmed - Match verified</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Signature Verification (Node.js)</h3>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
{`const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const computed = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(computed)
  );
}`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response Requirements</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Return HTTP 200-299 status code for successful receipt</li>
                  <li>Response body is optional and logged for debugging</li>
                  <li>4xx errors are not retried (considered permanent failures)</li>
                  <li>5xx errors and timeouts trigger retry logic</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}