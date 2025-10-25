import React, { useState } from 'react';
import GoogleMapsStatus from '@/components/GoogleMapsStatus';
import GoogleMapView from '@/components/GoogleMapView';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { validateGoogleMapsApiKey } from '@/utils/googleMapsValidator';
import { GOOGLE_MAPS_CONFIG } from '@/config/maps';
import { mockPets } from '@/data/mockPets';
import { MapPin, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

export default function GoogleMapsDebug() {
  const [showTestMap, setShowTestMap] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const validation = validateGoogleMapsApiKey();
  
  const runDiagnostics = async () => {
    const results = [];
    
    // Test 1: Check environment variable
    results.push({
      test: 'Environment Variable',
      passed: !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      message: import.meta.env.VITE_GOOGLE_MAPS_API_KEY 
        ? 'API key found in environment' 
        : 'No API key in environment variables'
    });
    
    // Test 2: Check key format
    results.push({
      test: 'API Key Format',
      passed: validation.keyFormat,
      message: validation.keyFormat 
        ? 'API key format appears valid' 
        : 'API key format may be incorrect'
    });
    
    // Test 3: Check for placeholder
    const placeholders = ['your_google_maps_api_key_here', 'your_api_key', 'xxx'];
    const isPlaceholder = placeholders.includes(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '');
    results.push({
      test: 'Not a Placeholder',
      passed: !isPlaceholder && !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
      message: isPlaceholder 
        ? 'API key is still a placeholder value' 
        : 'API key is not a placeholder'
    });
    
    // Test 4: Try loading Google Maps script
    try {
      const testScript = () => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
        
        window.initMap = () => {
          resolve(true);
          delete window.initMap;
          script.remove();
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Google Maps script'));
          script.remove();
        };
        
        // Set a timeout
        setTimeout(() => {
          reject(new Error('Script load timeout'));
          script.remove();
        }, 5000);
        
        document.head.appendChild(script);
      });
      
      await testScript();
      results.push({
        test: 'Script Loading',
        passed: true,
        message: 'Google Maps script loaded successfully'
      });
    } catch (error) {
      results.push({
        test: 'Script Loading',
        passed: false,
        message: error instanceof Error ? error.message : 'Failed to load script'
      });
    }
    
    // Test 5: Check configuration
    results.push({
      test: 'Configuration Valid',
      passed: GOOGLE_MAPS_CONFIG.hasValidKey(),
      message: GOOGLE_MAPS_CONFIG.hasValidKey() 
        ? 'Configuration is valid' 
        : 'Configuration needs attention'
    });
    
    setTestResults(results);
  };
  
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Google Maps API Diagnostics</h1>
        
        {/* Status Component */}
        <GoogleMapsStatus />
        
        {/* Diagnostic Tests */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Diagnostic Tests</CardTitle>
            <CardDescription>
              Run tests to verify your Google Maps configuration
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runDiagnostics} className="w-full">
              Run Diagnostic Tests
            </Button>
            
            {testResults.length > 0 && (
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {result.passed ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">{result.test}</span>
                    </div>
                    <span className="text-sm text-gray-600">{result.message}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Test Map */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Map Component</CardTitle>
            <CardDescription>
              Test if the map component loads correctly with your API key
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowTestMap(!showTestMap)} 
              className="mb-4"
              disabled={!validation.isValid}
            >
              <MapPin className="h-4 w-4 mr-2" />
              {showTestMap ? 'Hide' : 'Show'} Test Map
            </Button>
            
            {!validation.isValid && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid Configuration</AlertTitle>
                <AlertDescription>
                  Please configure a valid API key before testing the map component.
                </AlertDescription>
              </Alert>
            )}
            
            {showTestMap && validation.isValid && (
              <div className="h-[400px] rounded-lg overflow-hidden border">
                <GoogleMapView 
                  pets={mockPets.slice(0, 5)} 
                  onPetClick={() => {}}
                />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Environment Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 font-mono text-sm">
              <div className="p-3 bg-gray-100 rounded">
                <span className="text-gray-600">Mode:</span> {import.meta.env.MODE}
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <span className="text-gray-600">Production:</span> {import.meta.env.PROD ? 'Yes' : 'No'}
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <span className="text-gray-600">Base URL:</span> {import.meta.env.BASE_URL}
              </div>
              <div className="p-3 bg-gray-100 rounded">
                <span className="text-gray-600">API Key Present:</span> {!!import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Yes' : 'No'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}