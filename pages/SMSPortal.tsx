import React, { useState } from 'react';
import { Phone, MapPin, Bell, Shield, MessageSquare, CheckCircle, Navigation2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PhoneRegistration from '@/components/sms/PhoneRegistration';
import NotificationPreferences from '@/components/sms/NotificationPreferences';
import SubscriptionStatus from '@/components/sms/SubscriptionStatus';
import NotificationHistory from '@/components/sms/NotificationHistory';

const SMSPortal: React.FC = () => {
  const [isVerified, setIsVerified] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | undefined>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-full">
                <MessageSquare className="w-12 h-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              SMS Alert System
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Get instant notifications when pets go missing in your area
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Phone className="w-4 h-4" />
                <span>Instant Alerts</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Navigation2 className="w-4 h-4" />
                <span>GPS-Based Radius</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                <Shield className="w-4 h-4" />
                <span>Privacy Protected</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          {!isVerified ? (
            <PhoneRegistration 
              onVerified={(phone, location) => {
                setIsVerified(true);
                setPhoneNumber(phone);
                setUserLocation(location);
              }}
            />
          ) : (
            <Tabs defaultValue="preferences" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
                <TabsTrigger value="status">Subscription</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="preferences">
                <NotificationPreferences 
                  phoneNumber={phoneNumber} 
                  initialLocation={userLocation}
                />
              </TabsContent>

              <TabsContent value="status">
                <SubscriptionStatus phoneNumber={phoneNumber} />
              </TabsContent>

              <TabsContent value="history">
                <NotificationHistory phoneNumber={phoneNumber} />
              </TabsContent>
            </Tabs>
          )}

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <Bell className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">Real-Time Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Receive instant SMS notifications when pets are reported missing in your selected area.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <Navigation2 className="w-8 h-8 text-purple-600 mb-2" />
                <CardTitle className="text-lg">Location-Based Radius</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Auto-adjusts notification radius based on your GPS location for optimal coverage.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CheckCircle className="w-8 h-8 text-green-600 mb-2" />
                <CardTitle className="text-lg">Smart Distance Filtering</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Get alerts prioritized by distance from your location with real-time calculations.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Geolocation Features */}
          <Card className="mt-8 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-6 h-6 text-orange-600" />
                Enhanced Geolocation Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-sm mb-2">🎯 Automatic Location Detection</h3>
                  <p className="text-sm text-gray-600">
                    Your device's GPS automatically detects your location for precise alert delivery.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-2">📍 Distance-Based Priority</h3>
                  <p className="text-sm text-gray-600">
                    Alerts are prioritized by distance, showing nearest lost pets first.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-2">🗺️ Interactive Map View</h3>
                  <p className="text-sm text-gray-600">
                    See your location and nearby lost pets on an interactive map with real-time updates.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm mb-2">⚡ Smart Radius Adjustment</h3>
                  <p className="text-sm text-gray-600">
                    Notification radius auto-adjusts based on population density in your area.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SMSPortal;