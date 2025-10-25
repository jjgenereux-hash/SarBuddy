import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface MapData {
  pets: any[];
  sightings: any[];
  volunteers: any[];
  drones: any[];
  weather: any;
  heatmapData: any[];
  zones: any[];
  predictions: any[];
}

export function useMapDataSync() {
  const [mapData, setMapData] = useState<MapData>({
    pets: [],
    sightings: [],
    volunteers: [],
    drones: [],
    weather: null,
    heatmapData: [],
    zones: [],
    predictions: []
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch all map data
  const fetchMapData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch pets
      const { data: pets } = await supabase
        .from('pets')
        .select('*')
        .eq('status', 'lost')
        .not('location', 'is', null);

      // Fetch sightings
      const { data: sightings } = await supabase
        .from('sightings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      // Fetch volunteers
      const { data: volunteers } = await supabase
        .from('volunteers')
        .select('*')
        .eq('is_active', true);

      // Fetch drones
      const { data: drones } = await supabase
        .from('drones')
        .select('*')
        .eq('status', 'active');

      // Fetch search zones
      const { data: zones } = await supabase
        .from('search_zones')
        .select('*')
        .eq('is_active', true);

      setMapData({
        pets: pets || [],
        sightings: sightings || [],
        volunteers: volunteers || [],
        drones: drones || [],
        weather: null, // Weather data would come from external API
        heatmapData: generateHeatmapData(sightings || []),
        zones: zones || [],
        predictions: [] // Predictions would come from ML service
      });
    } catch (error) {
      console.error('Error fetching map data:', error);
      toast({
        title: "Error",
        description: "Failed to load map data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Generate heatmap data from sightings
  const generateHeatmapData = (sightings: any[]) => {
    return sightings.map(s => ({
      location: new google.maps.LatLng(s.latitude, s.longitude),
      weight: s.confidence_score || 1
    }));
  };

  // Set up real-time subscriptions
  useEffect(() => {
    fetchMapData();

    // Subscribe to real-time updates
    const petsChannel = supabase
      .channel('pets-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pets' 
      }, () => {
        fetchMapData();
      })
      .subscribe();

    const sightingsChannel = supabase
      .channel('sightings-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'sightings' 
      }, () => {
        fetchMapData();
      })
      .subscribe();

    const volunteersChannel = supabase
      .channel('volunteers-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'volunteers' 
      }, () => {
        fetchMapData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(petsChannel);
      supabase.removeChannel(sightingsChannel);
      supabase.removeChannel(volunteersChannel);
    };
  }, [fetchMapData]);

  return {
    mapData,
    loading,
    refetch: fetchMapData
  };
}