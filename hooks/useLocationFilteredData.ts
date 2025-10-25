import { useState, useEffect, useMemo } from 'react';
import { useUserLocation } from './useUserLocation';
import { useDatabasePets } from './useDatabasePets';
import { calculateDistance, filterByDistance } from '@/utils/distanceCalculator';
import { Pet, Sighting } from '@/services/databaseService';

interface UseLocationFilteredDataOptions {
  radiusMiles?: number;
  enableHighAccuracy?: boolean;
  watchPosition?: boolean;
}

export interface Geofence {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  type: string;
  active: boolean;
}

export function useLocationFilteredData(options: UseLocationFilteredDataOptions = {}) {
  const radiusMiles = options.radiusMiles ?? 25;
  
  const { 
    location, 
    loading: locationLoading, 
    error: locationError,
    permissionDenied,
    retry: retryLocation
  } = useUserLocation({
    enableHighAccuracy: options.enableHighAccuracy,
    watchPosition: options.watchPosition
  });

  const {
    pets: allPets,
    sightings: allSightings,
    loading: dataLoading,
    error: dataError,
    createPet,
    updatePet,
    deletePet,
    createSighting,
    searchPets,
    refresh
  } = useDatabasePets();

  const [geofences, setGeofences] = useState<Geofence[]>([]);

  // Filter pets and sightings based on user location
  const filteredPets = useMemo(() => {
    if (!location || permissionDenied) return allPets;
    
    return filterByDistance(
      allPets,
      location.latitude,
      location.longitude,
      radiusMiles
    );
  }, [allPets, location, radiusMiles, permissionDenied]);

  const filteredSightings = useMemo(() => {
    if (!location || permissionDenied) return allSightings;
    
    return filterByDistance(
      allSightings,
      location.latitude,
      location.longitude,
      radiusMiles
    );
  }, [allSightings, location, radiusMiles, permissionDenied]);

  const filteredGeofences = useMemo(() => {
    if (!location || permissionDenied) return geofences;
    
    return filterByDistance(
      geofences,
      location.latitude,
      location.longitude,
      radiusMiles
    );
  }, [geofences, location, radiusMiles, permissionDenied]);

  // Calculate distances for sorting
  const petsWithDistance = useMemo(() => {
    if (!location) return filteredPets;
    
    return filteredPets.map(pet => ({
      ...pet,
      distance: calculateDistance(
        location.latitude,
        location.longitude,
        pet.latitude,
        pet.longitude
      )
    })).sort((a, b) => a.distance - b.distance);
  }, [filteredPets, location]);

  const sightingsWithDistance = useMemo(() => {
    if (!location) return filteredSightings;
    
    return filteredSightings.map(sighting => ({
      ...sighting,
      distance: calculateDistance(
        location.latitude,
        location.longitude,
        sighting.latitude,
        sighting.longitude
      )
    })).sort((a, b) => a.distance - b.distance);
  }, [filteredSightings, location]);

  // Load geofences from database
  useEffect(() => {
    async function loadGeofences() {
      try {
        // In production, this would come from your database
        // For now, we'll set empty array to remove mock data
        setGeofences([]);
      } catch (error) {
        console.error('Failed to load geofences:', error);
      }
    }
    loadGeofences();
  }, []);

  const stats = {
    totalPets: allPets.length,
    nearbyPets: filteredPets.length,
    totalSightings: allSightings.length,
    nearbySightings: filteredSightings.length,
    nearbyGeofences: filteredGeofences.length,
    radiusMiles
  };

  return {
    // Location data
    userLocation: location,
    locationLoading,
    locationError,
    permissionDenied,
    retryLocation,
    
    // Filtered data
    pets: petsWithDistance,
    sightings: sightingsWithDistance,
    geofences: filteredGeofences,
    
    // Stats
    stats,
    
    // Original functions
    loading: locationLoading || dataLoading,
    error: locationError || dataError,
    createPet,
    updatePet,
    deletePet,
    createSighting,
    searchPets,
    refresh
  };
}