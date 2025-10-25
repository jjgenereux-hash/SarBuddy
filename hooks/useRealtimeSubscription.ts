import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface VolunteerPosition {
  id: string;
  volunteer_id: string;
  name: string;
  team: string;
  lat: number;
  lng: number;
  status: string;
  battery_level: number;
  signal_strength: number;
  last_update: string;
}

interface DronePosition {
  id: string;
  drone_id: string;
  model: string;
  position: { lat: number; lng: number };
  altitude: number;
  speed: number;
  heading: number;
  battery: number;
  status: string;
  last_update: string;
}

interface PetSighting {
  id: string;
  pet_id: string;
  position: { lat: number; lng: number };
  confidence: number;
  sighted_by: string;
  description: string;
  created_at: string;
}

export function useRealtimeSubscription() {
  const [volunteers, setVolunteers] = useState<VolunteerPosition[]>([]);
  const [drones, setDrones] = useState<DronePosition[]>([]);
  const [petSightings, setPetSightings] = useState<PetSighting[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let channel: RealtimeChannel;

    const setupSubscriptions = async () => {
      // Fetch initial data
      const [volunteersData, dronesData, sightingsData] = await Promise.all([
        supabase.from('volunteer_positions').select('*'),
        supabase.from('drone_positions').select('*'),
        supabase.from('pet_sightings').select('*').order('created_at', { ascending: false }).limit(20)
      ]);

      if (volunteersData.data) setVolunteers(volunteersData.data);
      if (dronesData.data) setDrones(dronesData.data);
      if (sightingsData.data) setPetSightings(sightingsData.data);

      // Set up real-time subscriptions
      channel = supabase
        .channel('command-center')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'volunteer_positions' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setVolunteers(prev => [...prev, payload.new as VolunteerPosition]);
            } else if (payload.eventType === 'UPDATE') {
              setVolunteers(prev => prev.map(v => 
                v.id === payload.new.id ? payload.new as VolunteerPosition : v
              ));
            } else if (payload.eventType === 'DELETE') {
              setVolunteers(prev => prev.filter(v => v.id !== payload.old.id));
            }
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'drone_positions' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setDrones(prev => [...prev, payload.new as DronePosition]);
            } else if (payload.eventType === 'UPDATE') {
              setDrones(prev => prev.map(d => 
                d.id === payload.new.id ? payload.new as DronePosition : d
              ));
            } else if (payload.eventType === 'DELETE') {
              setDrones(prev => prev.filter(d => d.id !== payload.old.id));
            }
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'pet_sightings' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setPetSightings(prev => [payload.new as PetSighting, ...prev].slice(0, 20));
            }
          }
        )
        .subscribe((status) => {
          setIsConnected(status === 'SUBSCRIBED');
        });
    };

    setupSubscriptions();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  return {
    volunteers,
    drones,
    petSightings,
    isConnected,
    updateVolunteerPosition: async (id: string, lat: number, lng: number) => {
      await supabase
        .from('volunteer_positions')
        .update({ lat, lng, last_update: new Date().toISOString() })
        .eq('id', id);
    },
    updateDronePosition: async (id: string, position: any, telemetry: any) => {
      await supabase
        .from('drone_positions')
        .update({ 
          position, 
          altitude: telemetry.altitude,
          speed: telemetry.speed,
          heading: telemetry.heading,
          battery: telemetry.battery,
          last_update: new Date().toISOString() 
        })
        .eq('id', id);
    },
    reportSighting: async (petId: string, position: any, confidence: number, sightedBy: string, description: string) => {
      await supabase
        .from('pet_sightings')
        .insert({ 
          pet_id: petId, 
          position, 
          confidence, 
          sighted_by: sightedBy, 
          description 
        });
    }
  };
}