import { useState, useEffect } from 'react';
import { databaseService, Pet, Sighting } from '@/services/databaseService';

export function useDatabasePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [sightings, setSightings] = useState<Sighting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPets();
    loadSightings();
    
    // Subscribe to real-time updates
    const petsSubscription = databaseService.subscribeToPets((payload) => {
      if (payload.eventType === 'INSERT') {
        setPets(prev => [payload.new as Pet, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setPets(prev => prev.map(p => p.id === payload.new.id ? payload.new as Pet : p));
      } else if (payload.eventType === 'DELETE') {
        setPets(prev => prev.filter(p => p.id !== payload.old.id));
      }
    });

    const sightingsSubscription = databaseService.subscribeToSightings((payload) => {
      if (payload.eventType === 'INSERT') {
        setSightings(prev => [payload.new as Sighting, ...prev]);
      }
    });

    return () => {
      petsSubscription.unsubscribe();
      sightingsSubscription.unsubscribe();
    };
  }, []);

  async function loadPets() {
    try {
      setLoading(true);
      const data = await databaseService.getPets();
      setPets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pets');
    } finally {
      setLoading(false);
    }
  }

  async function loadSightings() {
    try {
      const data = await databaseService.getSightings();
      setSightings(data);
    } catch (err) {
      console.error('Failed to load sightings:', err);
    }
  }

  async function createPet(pet: Partial<Pet>) {
    try {
      const newPet = await databaseService.createPet(pet);
      setPets(prev => [newPet, ...prev]);
      return newPet;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pet');
      throw err;
    }
  }

  async function updatePet(id: string, updates: Partial<Pet>) {
    try {
      const updatedPet = await databaseService.updatePet(id, updates);
      setPets(prev => prev.map(p => p.id === id ? updatedPet : p));
      return updatedPet;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update pet');
      throw err;
    }
  }

  async function deletePet(id: string) {
    try {
      await databaseService.deletePet(id);
      setPets(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pet');
      throw err;
    }
  }

  async function createSighting(sighting: Partial<Sighting>) {
    try {
      const newSighting = await databaseService.createSighting(sighting);
      setSightings(prev => [newSighting, ...prev]);
      return newSighting;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sighting');
      throw err;
    }
  }

  async function searchPets(params: {
    query?: string;
    species?: string;
    status?: string;
    location?: { lat: number; lng: number; radius: number };
  }) {
    try {
      setLoading(true);
      const results = await databaseService.searchPets(params);
      return results;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search pets');
      throw err;
    } finally {
      setLoading(false);
    }
  }

  return {
    pets,
    sightings,
    loading,
    error,
    createPet,
    updatePet,
    deletePet,
    createSighting,
    searchPets,
    refresh: loadPets
  };
}