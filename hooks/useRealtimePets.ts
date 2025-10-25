import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Pet, Sighting, Match } from '@/services/petService';

export function useRealtimePets(status?: string) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchPets = async () => {
      try {
        setLoading(true);
        const query = supabase.from('pets').select('*');
        if (status) query.eq('status', status);
        
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        
        setPets(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch pets');
      } finally {
        setLoading(false);
      }
    };

    fetchPets();

    // Set up realtime subscription
    const channel = supabase
      .channel('pets-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pets'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPets(prev => [payload.new as Pet, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setPets(prev => prev.map(pet => 
            pet.id === payload.new.id ? payload.new as Pet : pet
          ));
        } else if (payload.eventType === 'DELETE') {
          setPets(prev => prev.filter(pet => pet.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [status]);

  return { pets, loading, error };
}

export function useRealtimeSightings(petId?: string) {
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchSightings = async () => {
      try {
        setLoading(true);
        const query = supabase.from('sightings').select('*');
        if (petId) query.eq('pet_id', petId);
        
        const { data, error } = await query.order('sighting_date', { ascending: false });
        if (error) throw error;
        
        setSightings(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sightings');
      } finally {
        setLoading(false);
      }
    };

    fetchSightings();

    // Set up realtime subscription
    const channel = supabase
      .channel('sightings-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sightings'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (!petId || payload.new.pet_id === petId) {
            setSightings(prev => [payload.new as Sighting, ...prev]);
          }
        } else if (payload.eventType === 'UPDATE') {
          setSightings(prev => prev.map(sighting => 
            sighting.id === payload.new.id ? payload.new as Sighting : sighting
          ));
        } else if (payload.eventType === 'DELETE') {
          setSightings(prev => prev.filter(sighting => sighting.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [petId]);

  return { sightings, loading, error };
}

export function useRealtimeMatches(petId?: string) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const query = supabase.from('matches').select('*');
        if (petId) query.or(`lost_pet_id.eq.${petId},found_pet_id.eq.${petId}`);
        
        const { data, error } = await query.order('confidence_score', { ascending: false });
        if (error) throw error;
        
        setMatches(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();

    // Set up realtime subscription
    const channel = supabase
      .channel('matches-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'matches'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (!petId || payload.new.lost_pet_id === petId || payload.new.found_pet_id === petId) {
            setMatches(prev => [...prev, payload.new as Match].sort((a, b) => b.confidence_score - a.confidence_score));
          }
        } else if (payload.eventType === 'UPDATE') {
          setMatches(prev => prev.map(match => 
            match.id === payload.new.id ? payload.new as Match : match
          ));
        } else if (payload.eventType === 'DELETE') {
          setMatches(prev => prev.filter(match => match.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [petId]);

  return { matches, loading, error };
}