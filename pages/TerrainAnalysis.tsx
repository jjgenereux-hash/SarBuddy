import React, { useState, useRef, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { ViewshedAnalysis } from '@/components/terrain/ViewshedAnalysis';
import { WatershedAnalysis } from '@/components/terrain/WatershedAnalysis';
import { PathfindingAnalysis } from '@/components/terrain/PathfindingAnalysis';
import { HazardIdentification } from '@/components/terrain/HazardIdentification';
import { StaticTerrain3D } from '@/components/terrain/StaticTerrain3D';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mountain, Map, Download, Settings2, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function TerrainAnalysis() {
  const [activeTab, setActiveTab] = useState('viewshed');
  const [mapCenter, setMapCenter] = useState({ lat: 39.7392, lng: -104.9903 });
  const [mapBounds, setMapBounds] = useState({
    north: 39.8392,
    south: 39.6392,
    east: -104.8903,
    west: -105.0903
  });
  const [pathStart, setPathStart] = useState<{ lat: number; lng: number } | null>(null);
  const [pathEnd, setPathEnd] = useState<{ lat: number; lng: number } | null>(null);
  const [overlays, setOverlays] = useState<any[]>([]);
  const [show3D, setShow3D] = useState(false);
  const mapRef = useRef<any>(null);
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Check if user has admin access
  useEffect(() => {
    if (profile?.role !== 'administrator') {
      navigate('/');
    }
  }, [profile, navigate]);

  const handleOverlayUpdate = (overlay: any) => {
    setOverlays(prev => [...prev.filter(o => o.type !== overlay.type), overlay]);
  };

  const exportAllReports = () => {
    const report = {
      analysis: 'Combined Terrain Analysis Report',
      timestamp: new Date().toISOString(),
      location: mapCenter,
      bounds: mapBounds,
      overlays: overlays.map(o => ({
        type: o.type,
        dataPoints: Array.isArray(o.visible) ? o.visible.length : 
                    Array.isArray(o.path) ? o.path.length : 
                    Array.isArray(o.hazards) ? o.hazards.length : 0
      }))
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terrain-analysis-${Date.now()}.json`;
    a.click();
  };

  const clearOverlays = () => {
    setOverlays([]);
    setPathStart(null);
    setPathEnd(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Mountain className="h-8 w-8 text-indigo-600" />
                Advanced Terrain Analysis
              </h1>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShow3D(!show3D)}
              >
                {show3D ? 'Hide' : 'Show'} 3D Terrain
              </Button>
              <Button
                variant="outline"
                onClick={clearOverlays}
              >
                Clear All
              </Button>
              <Button onClick={exportAllReports}>
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
          
          <Alert>
            <Map className="h-4 w-4" />
            <AlertDescription>
              Analyze terrain features for optimal drone flight paths, search area planning, and hazard identification.
              Click on the map to set analysis points.
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Analysis Tools Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 gap-2">
                <TabsTrigger value="viewshed">Viewshed</TabsTrigger>
                <TabsTrigger value="watershed">Watershed</TabsTrigger>
                <TabsTrigger value="pathfinding">Pathfinding</TabsTrigger>
                <TabsTrigger value="hazards">Hazards</TabsTrigger>
              </TabsList>
              
              <TabsContent value="viewshed" className="mt-4">
                <ViewshedAnalysis
                  center={mapCenter}
                  onOverlayUpdate={handleOverlayUpdate}
                />
              </TabsContent>
              
              <TabsContent value="watershed" className="mt-4">
                <WatershedAnalysis
                  bounds={mapBounds}
                  onOverlayUpdate={handleOverlayUpdate}
                />
              </TabsContent>
              
              <TabsContent value="pathfinding" className="mt-4">
                <PathfindingAnalysis
                  start={pathStart}
                  end={pathEnd}
                  onOverlayUpdate={handleOverlayUpdate}
                />
              </TabsContent>
              
              <TabsContent value="hazards" className="mt-4">
                <HazardIdentification
                  bounds={mapBounds}
                  onOverlayUpdate={handleOverlayUpdate}
                />
              </TabsContent>
            </Tabs>
            
            {/* Analysis Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Analysis Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Overlays</span>
                    <span className="font-medium">{overlays.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Analysis Area</span>
                    <span className="font-medium">
                      {((mapBounds.north - mapBounds.south) * (mapBounds.east - mapBounds.west) * 111 * 111).toFixed(1)} km²
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Center Point</span>
                    <span className="font-medium text-xs">
                      {mapCenter.lat.toFixed(4)}, {mapCenter.lng.toFixed(4)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Map Display */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardContent className="p-0">
                {show3D ? (
                  <div className="h-[600px] rounded-lg overflow-hidden">
                    <StaticTerrain3D />
                  </div>
                ) : (
                  <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Map className="h-24 w-24 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Interactive Terrain Map</p>
                      <p className="text-sm text-gray-500">
                        Map visualization with terrain overlays would appear here
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setShow3D(true)}
                      >
                        View 3D Terrain
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}