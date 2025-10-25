import { useState, useEffect, useCallback } from 'react';
import { googleMapsProxy } from '@/services/googleMapsProxy';

interface UseSecureGoogleMapsOptions {
  enableProxy?: boolean;
  cacheResults?: boolean;
}

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
  place_id: string;
}

export const useSecureGoogleMaps = (options: UseSecureGoogleMapsOptions = {}) => {
  const { enableProxy = true, cacheResults = true } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Geocode address using secure proxy
  const geocodeAddress = useCallback(async (address: string): Promise<GeocodeResult | null> => {
    if (!address) return null;

    setIsLoading(true);
    setError(null);

    try {
      if (enableProxy) {
        // Use secure proxy
        const response = await googleMapsProxy.geocode(address);
        
        if (response.status === 'OK' && response.results?.[0]) {
          const result = response.results[0];
          return {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            formatted_address: result.formatted_address,
            place_id: result.place_id
          };
        } else {
          throw new Error(`Geocoding failed: ${response.status}`);
        }
      } else {
        // Direct API call (only for development with restricted keys)
        if (!window.google?.maps) {
          throw new Error('Google Maps not loaded');
        }

        const geocoder = new google.maps.Geocoder();
        return new Promise((resolve, reject) => {
          geocoder.geocode({ address }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              resolve({
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng(),
                formatted_address: results[0].formatted_address,
                place_id: results[0].place_id
              });
            } else {
              reject(new Error(`Geocoding failed: ${status}`));
            }
          });
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Geocoding failed';
      setError(errorMsg);
      console.error('Geocoding error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [enableProxy]);

  // Search nearby places using secure proxy
  const searchNearby = useCallback(async (params: {
    location: { lat: number; lng: number };
    radius: number;
    type?: string;
    keyword?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const locationStr = `${params.location.lat},${params.location.lng}`;
      const response = await googleMapsProxy.nearbySearch({
        location: locationStr,
        radius: params.radius,
        type: params.type,
        keyword: params.keyword
      });

      if (response.status === 'OK') {
        return response.results || [];
      } else {
        throw new Error(`Search failed: ${response.status}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Search failed';
      setError(errorMsg);
      console.error('Nearby search error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get directions using secure proxy
  const getDirections = useCallback(async (params: {
    origin: string | { lat: number; lng: number };
    destination: string | { lat: number; lng: number };
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      const originStr = typeof params.origin === 'string' 
        ? params.origin 
        : `${params.origin.lat},${params.origin.lng}`;
      
      const destStr = typeof params.destination === 'string'
        ? params.destination
        : `${params.destination.lat},${params.destination.lng}`;

      const response = await googleMapsProxy.directions({
        origin: originStr,
        destination: destStr,
        mode: params.mode
      });

      if (response.status === 'OK') {
        return response.routes?.[0] || null;
      } else {
        throw new Error(`Directions failed: ${response.status}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Directions failed';
      setError(errorMsg);
      console.error('Directions error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Autocomplete suggestions using secure proxy
  const getAutocompleteSuggestions = useCallback(async (
    input: string,
    types?: string
  ): Promise<any[]> => {
    if (!input || input.length < 3) return [];

    setIsLoading(true);
    setError(null);

    try {
      const response = await googleMapsProxy.autocomplete(input, types);
      
      if (response.status === 'OK') {
        return response.predictions || [];
      } else {
        return [];
      }
    } catch (err) {
      console.error('Autocomplete error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Clear proxy cache
  const clearCache = useCallback(() => {
    if (cacheResults) {
      googleMapsProxy.clearCache();
    }
  }, [cacheResults]);

  return {
    geocodeAddress,
    searchNearby,
    getDirections,
    getAutocompleteSuggestions,
    clearCache,
    isLoading,
    error
  };
};