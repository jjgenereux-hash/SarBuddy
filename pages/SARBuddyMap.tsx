import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapLayers } from '@/components/sarbuddy/MapLayers';
import { MapStats } from '@/components/sarbuddy/MapStats';
import { VetClinicCard } from '@/components/sarbuddy/VetClinicCard';
import { ShelterCard } from '@/components/sarbuddy/ShelterCard';
import { supabase } from '@/lib/supabase';
import { googlePlacesService, VetClinic } from '@/services/googlePlacesService';
import { petfinderService, PetfinderOrganization } from '@/services/petfinderService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Navigation, Plus, AlertCircle, Phone, Loader2, Building2, Users } from 'lucide-react';

mapboxgl.accessToken = 'pk.eyJ1IjoiamFtaWVnZW5lcmV1eCIsImEiOiJjbWgzcmgxNXUxZnd3bmNwb3hndXo5bXBzIn0.AbKTpfHq1mmgwRrrcbEemw';

export default function SARBuddyMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const vetMarkers = useRef<mapboxgl.Marker[]>([]);
  const shelterMarkers = useRef<mapboxgl.Marker[]>([]);
  const [vetClinics, setVetClinics] = useState<VetClinic[]>([]);
  const [shelters, setShelters] = useState<PetfinderOrganization[]>([]);
  const [selectedVet, setSelectedVet] = useState<VetClinic | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<PetfinderOrganization | null>(null);
  const [showEmergencyOnly, setShowEmergencyOnly] = useState(false);
  const [loadingVets, setLoadingVets] = useState(false);
  const [loadingShelters, setLoadingShelters] = useState(false);
  const [vetError, setVetError] = useState<string | null>(null);
  const [shelterError, setShelterError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'vets' | 'shelters'>('vets');
  const [layers, setLayers] = useState({
    breadcrumbs: true,
    sightings: true,
    petcoLoveLost: false,
    shelters: true,
    vets: true,
    heatmap: false
  });
  const [stats, setStats] = useState({
    totalSightings: 0,
    recentSightings: 0,
    searchRadius: 5,
    activeSearchers: 0,
    lastUpdate: 'Just now',
    confidence: 0
  });
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Get user location first
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Initialize map at user location
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [longitude, latitude],
          zoom: 12
        });

        // Add user location marker
        new mapboxgl.Marker({ color: '#3B82F6' })
          .setLngLat([longitude, latitude])
          .setPopup(new mapboxgl.Popup().setHTML('<p>Your Location</p>'))
          .addTo(map.current);

        map.current.on('load', () => {
          loadMapData();
          setupRealtimeUpdates();
        });
      },
      (error) => {
        console.error('Error getting location:', error);
        // Fallback to default location
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-122.4194, 37.7749],
          zoom: 12
        });

        map.current.on('load', () => {
          loadMapData();
          setupRealtimeUpdates();
        });
      }
    );

    return () => {
      map.current?.remove();
    };
  }, []);

  const loadMapData = async () => {
    if (!map.current) return;

    // Load sightings from Supabase
    const { data: sightings } = await supabase
      .from('pet_sightings')
      .select('*')
      .limit(100);

    if (sightings) {
      sightings.forEach(sighting => {
        new mapboxgl.Marker({ color: '#FFD700' })
          .setLngLat([sighting.longitude, sighting.latitude])
          .setPopup(new mapboxgl.Popup().setHTML(
            `<div class="p-2">
              <p class="font-bold">${sighting.pet_name || 'Unknown'}</p>
              <p class="text-sm">${new Date(sighting.created_at).toLocaleString()}</p>
            </div>`
          ))
          .addTo(map.current!);
      });
      
      setStats(prev => ({
        ...prev,
        totalSightings: sightings.length,
        recentSightings: sightings.filter(s => 
          new Date(s.created_at) > new Date(Date.now() - 86400000)
        ).length
      }));
    }
    
    // Load vet clinics if layer is enabled
    if (layers.vets) {
      loadVetClinics();
    }
    
    // Load shelters if layer is enabled
    if (layers.shelters) {
      loadShelters();
    }
  };

  const loadVetClinics = async () => {
    if (!userLocation) {
      console.warn('User location not available yet');
      return;
    }

    setLoadingVets(true);
    setVetError(null);

    try {
      // Try to load real vet data from Google Places
      const clinics = await googlePlacesService.searchVetClinics(
        userLocation.lat,
        userLocation.lng,
        5000 // 5km radius
      );

      if (clinics.length > 0) {
        setVetClinics(clinics);
        displayVetMarkers(clinics);
      } else {
        // Fallback to mock data if no results
        console.warn('No vet clinics found, using mock data');
        const mockVets: VetClinic[] = [
          {
            id: '1',
            name: 'Emergency Pet Hospital',
            address: '123 Market St, San Francisco, CA',
            lat: userLocation.lat + 0.01,
            lng: userLocation.lng + 0.01,
            phone: '(415) 555-0911',
            isEmergency: true,
            isOpen: true,
            hours: ['Open 24/7'],
            rating: 4.8,
            totalRatings: 234,
            distance: 0.5
          },
          {
            id: '2',
            name: 'City Veterinary Clinic',
            address: '456 Mission St, San Francisco, CA',
            lat: userLocation.lat - 0.015,
            lng: userLocation.lng + 0.008,
            phone: '(415) 555-0123',
            isEmergency: false,
            isOpen: false,
            hours: ['Mon-Fri: 9AM-6PM', 'Sat: 10AM-4PM', 'Sun: Closed'],
            rating: 4.5,
            totalRatings: 156,
            distance: 1.2
          },
          {
            id: '3',
            name: 'Pet Emergency & Specialty Center',
            address: '789 Valencia St, San Francisco, CA',
            lat: userLocation.lat + 0.008,
            lng: userLocation.lng - 0.012,
            phone: '(415) 555-9999',
            isEmergency: true,
            isOpen: true,
            hours: ['Emergency Services 24/7', 'Specialty Services: Mon-Fri 8AM-8PM'],
            rating: 4.9,
            totalRatings: 512,
            distance: 0.8
          }
        ];
        
        setVetClinics(mockVets);
        displayVetMarkers(mockVets);
      }
    } catch (error) {
      console.error('Error loading vet clinics:', error);
      setVetError('Failed to load veterinary clinics. Please try again later.');
      
      // Use mock data as fallback
      const mockVets: VetClinic[] = [
        {
          id: '1',
          name: 'Emergency Pet Hospital (Demo)',
          address: 'Demo Location',
          lat: userLocation.lat + 0.01,
          lng: userLocation.lng + 0.01,
          phone: '(415) 555-0911',
          isEmergency: true,
          isOpen: true,
          hours: ['Open 24/7'],
          rating: 4.8,
          totalRatings: 234,
          distance: 0.5
        }
      ];
      
      setVetClinics(mockVets);
      displayVetMarkers(mockVets);
    } finally {
      setLoadingVets(false);
    }
  };

  // Load shelters from Petfinder API
  const loadShelters = async () => {
    if (!userLocation) {
      console.warn('User location not available yet');
      return;
    }

    setLoadingShelters(true);
    setShelterError(null);

    try {
      const organizations = await petfinderService.getOrganizations(
        userLocation.lat,
        userLocation.lng,
        25 // 25 mile radius
      );

      setShelters(organizations);
      displayShelterMarkers(organizations);
    } catch (error) {
      console.error('Error loading shelters:', error);
      setShelterError('Failed to load animal shelters. Please try again later.');
    } finally {
      setLoadingShelters(false);
    }
  };

  // Watch for user location changes to load data
  useEffect(() => {
    if (userLocation && layers.vets) {
      loadVetClinics();
    }
  }, [userLocation, layers.vets]);

  useEffect(() => {
    if (userLocation && layers.shelters) {
      loadShelters();
    }
  }, [userLocation, layers.shelters]);

  const displayVetMarkers = (vets: VetClinic[]) => {
    // Clear existing markers
    vetMarkers.current.forEach(marker => marker.remove());
    vetMarkers.current = [];

    vets.forEach(vet => {
      const el = document.createElement('div');
      el.className = 'vet-marker';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = vet.isEmergency ? '#dc2626' : '#10b981';
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([vet.lng, vet.lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <h3 class="font-bold">${vet.name}</h3>
            <p class="text-sm">${vet.address}</p>
            ${vet.phone ? `<p class="text-sm">${vet.phone}</p>` : ''}
            ${vet.isEmergency ? '<span class="text-red-600 text-xs font-semibold">24/7 Emergency Services</span>' : ''}
            ${vet.rating ? `<p class="text-sm">⭐ ${vet.rating} (${vet.totalRatings} reviews)</p>` : ''}
          </div>
        `))
        .addTo(map.current!);

      vetMarkers.current.push(marker);
    });
  };

  // Display shelter markers on map
  const displayShelterMarkers = (orgs: PetfinderOrganization[]) => {
    // Clear existing markers
    shelterMarkers.current.forEach(marker => marker.remove());
    shelterMarkers.current = [];

    orgs.forEach(org => {
      // Get coordinates from address (mock for now)
      const lat = userLocation!.lat + (Math.random() - 0.5) * 0.05;
      const lng = userLocation!.lng + (Math.random() - 0.5) * 0.05;

      const el = document.createElement('div');
      el.className = 'shelter-marker';
      el.style.width = '35px';
      el.style.height = '35px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = org.intakeStatus === 'open' ? '#3b82f6' : '#fbbf24';
      el.style.border = '3px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.innerHTML = '<span style="color: white; font-size: 18px;">🏠</span>';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setHTML(`
          <div class="p-3">
            <h3 class="font-bold text-lg">${org.name}</h3>
            <p class="text-sm mt-1">${org.address.city}, ${org.address.state}</p>
            ${org.phone ? `<p class="text-sm mt-1">📞 ${org.phone}</p>` : ''}
            <div class="mt-2">
              <span class="text-xs px-2 py-1 rounded ${
                org.intakeStatus === 'open' ? 'bg-green-100 text-green-800' : 
                org.intakeStatus === 'limited' ? 'bg-yellow-100 text-yellow-800' : 
                'bg-red-100 text-red-800'
              }">
                ${org.intakeStatus === 'open' ? 'Accepting Animals' : 
                  org.intakeStatus === 'limited' ? 'Limited Capacity' : 'Full'}
              </span>
              ${org.emergencyIntake ? '<span class="text-xs px-2 py-1 ml-1 rounded bg-red-100 text-red-800">Emergency Intake</span>' : ''}
            </div>
            <p class="text-xs mt-2">Capacity: ${org.capacity.current}/${org.capacity.total}</p>
          </div>
        `))
        .addTo(map.current!);

      shelterMarkers.current.push(marker);
    });
  };

  const handleCallVet = (clinic: VetClinic) => {
    if (clinic.phone) {
      window.location.href = `tel:${clinic.phone}`;
    }
  };

  const handleGetDirections = (clinic: VetClinic) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${clinic.lat},${clinic.lng}`;
    window.open(url, '_blank');
  };

  const handleGetShelterDirections = (shelter: PetfinderOrganization) => {
    const address = `${shelter.address.address1}, ${shelter.address.city}, ${shelter.address.state} ${shelter.address.postcode}`;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };
  const setupRealtimeUpdates = () => {
    const channel = supabase
      .channel('sightings-channel')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'pet_sightings' },
        payload => {
          if (map.current && payload.new) {
            new mapboxgl.Marker({ color: '#FF0000' })
              .setLngLat([payload.new.longitude, payload.new.latitude])
              .addTo(map.current);
            
            setStats(prev => ({
              ...prev,
              totalSightings: prev.totalSightings + 1,
              lastUpdate: 'Just now'
            }));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const toggleLayer = (layerId: string) => {
    setLayers(prev => ({ ...prev, [layerId]: !prev[layerId] }));
  };

  const centerOnUser = () => {
    navigator.geolocation.getCurrentPosition(position => {
      map.current?.flyTo({
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 14
      });
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">SARBuddy Map</h1>
          <div className="flex gap-2">
            <Button onClick={centerOnUser} variant="outline">
              <Navigation className="w-4 h-4 mr-2" />
              My Location
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Report Sighting
            </Button>
          </div>
        </div>

        <MapStats stats={stats} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <Card className="p-0 overflow-hidden">
              <div ref={mapContainer} className="w-full h-[600px]" />
            </Card>
          </div>
          
          <div className="space-y-4">
            <MapLayers layers={layers} onToggleLayer={toggleLayer} />
            
            {/* Tab Switcher */}
            <Card className="p-2">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={activeTab === 'vets' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('vets')}
                  className="flex-1"
                >
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Vets ({vetClinics.length})
                </Button>
                <Button
                  size="sm"
                  variant={activeTab === 'shelters' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('shelters')}
                  className="flex-1"
                >
                  <Building2 className="w-4 h-4 mr-1" />
                  Shelters ({shelters.length})
                </Button>
              </div>
            </Card>
            
            {/* Emergency Vet Quick Access */}
            {activeTab === 'vets' && (
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Emergency Vets
                  </h3>
                  <Badge variant="destructive">{vetClinics.filter(v => v.isEmergency).length}</Badge>
                </div>
                <Button 
                  className="w-full bg-red-600 hover:bg-red-700"
                  onClick={() => setShowEmergencyOnly(!showEmergencyOnly)}
                  disabled={loadingVets}
                >
                  {loadingVets ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading...</>
                  ) : (
                    <><Phone className="w-4 h-4 mr-2" /> Find Nearest Emergency Vet</>
                  )}
                </Button>
              </Card>
            )}

            {/* Shelter Quick Stats */}
            {activeTab === 'shelters' && shelters.length > 0 && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Open for Intake:</span>
                    <Badge className="bg-green-500 text-white">
                      {shelters.filter(s => s.intakeStatus === 'open').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Emergency Intake:</span>
                    <Badge variant="destructive">
                      {shelters.filter(s => s.emergencyIntake).length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Capacity:</span>
                    <span className="text-sm font-bold">
                      {shelters.reduce((sum, s) => sum + s.capacity.available, 0)} spaces
                    </span>
                  </div>
                </div>
              </Card>
            )}

            {/* Error Alerts */}
            {vetError && activeTab === 'vets' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{vetError}</AlertDescription>
              </Alert>
            )}
            
            {shelterError && activeTab === 'shelters' && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{shelterError}</AlertDescription>
              </Alert>
            )}

            {/* Loading States */}
            {loadingVets && activeTab === 'vets' && (
              <Card className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </Card>
            )}
            
            {loadingShelters && activeTab === 'shelters' && (
              <Card className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </Card>
            )}

            {/* Vet Clinics List */}
            {activeTab === 'vets' && !loadingVets && vetClinics.length > 0 && (
              <Card className="p-4 max-h-96 overflow-y-auto">
                <h3 className="font-semibold mb-3">Nearby Veterinary Clinics</h3>
                <div className="space-y-3">
                  {vetClinics
                    .filter(vet => !showEmergencyOnly || vet.isEmergency)
                    .map(vet => (
                      <VetClinicCard
                        key={vet.id}
                        clinic={vet}
                        onGetDirections={handleGetDirections}
                        onCall={handleCallVet}
                        onSelect={setSelectedVet}
                      />
                    ))}
                </div>
              </Card>
            )}
            
            {/* Shelters List */}
            {activeTab === 'shelters' && !loadingShelters && shelters.length > 0 && (
              <Card className="p-4 max-h-96 overflow-y-auto">
                <h3 className="font-semibold mb-3">Animal Shelters & Rescues</h3>
                <div className="space-y-3">
                  {shelters.map(shelter => (
                    <ShelterCard
                      key={shelter.id}
                      shelter={shelter}
                      onGetDirections={() => handleGetShelterDirections(shelter)}
                    />
                  ))}
                </div>
              </Card>
            )}
            
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <Button className="w-full" variant="outline">
                  <Search className="w-4 h-4 mr-2" />
                  Search Filters
                </Button>
                <Button className="w-full" variant="outline">
                  Share Location
                </Button>
                <Button className="w-full" variant="outline">
                  Export Data
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}