import { supabase } from '@/lib/supabase';

interface GoogleMapsProxyResponse {
  results?: any[];
  status: string;
  error?: string;
  error_message?: string;
}

class GoogleMapsProxyService {
  private baseUrl = '/google-maps-secure-proxy';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 3600000; // 1 hour in milliseconds

  /**
   * Geocode an address using the secure proxy
   */
  async geocode(address: string): Promise<GoogleMapsProxyResponse> {
    const cacheKey = `geocode:${address}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.functions.invoke('google-maps-secure-proxy', {
        body: {
          endpoint: '/maps/api/geocode/json',
          address: encodeURIComponent(address)
        }
      });

      if (error) throw error;
      
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Failed to geocode address');
    }
  }

  /**
   * Search for nearby places
   */
  async nearbySearch(params: {
    location: string;
    radius: number;
    type?: string;
    keyword?: string;
  }): Promise<GoogleMapsProxyResponse> {
    const cacheKey = `nearby:${JSON.stringify(params)}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.functions.invoke('google-maps-secure-proxy', {
        body: {
          endpoint: '/maps/api/place/nearbysearch/json',
          ...params
        }
      });

      if (error) throw error;
      
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Nearby search error:', error);
      throw new Error('Failed to search nearby places');
    }
  }

  /**
   * Get place details
   */
  async placeDetails(placeId: string): Promise<GoogleMapsProxyResponse> {
    const cacheKey = `place:${placeId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.functions.invoke('google-maps-secure-proxy', {
        body: {
          endpoint: '/maps/api/place/details/json',
          place_id: placeId
        }
      });

      if (error) throw error;
      
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Place details error:', error);
      throw new Error('Failed to get place details');
    }
  }

  /**
   * Get directions between two points
   */
  async directions(params: {
    origin: string;
    destination: string;
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
    waypoints?: string[];
  }): Promise<GoogleMapsProxyResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-secure-proxy', {
        body: {
          endpoint: '/maps/api/directions/json',
          origin: params.origin,
          destination: params.destination,
          mode: params.mode || 'driving',
          waypoints: params.waypoints?.join('|')
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Directions error:', error);
      throw new Error('Failed to get directions');
    }
  }

  /**
   * Autocomplete place predictions
   */
  async autocomplete(input: string, types?: string): Promise<GoogleMapsProxyResponse> {
    const cacheKey = `autocomplete:${input}:${types}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase.functions.invoke('google-maps-secure-proxy', {
        body: {
          endpoint: '/maps/api/place/autocomplete/json',
          input: input,
          types: types
        }
      });

      if (error) throw error;
      
      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Autocomplete error:', error);
      throw new Error('Failed to get autocomplete predictions');
    }
  }

  /**
   * Calculate distance matrix
   */
  async distanceMatrix(params: {
    origins: string[];
    destinations: string[];
    mode?: 'driving' | 'walking' | 'bicycling' | 'transit';
  }): Promise<GoogleMapsProxyResponse> {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-secure-proxy', {
        body: {
          endpoint: '/maps/api/distancematrix/json',
          origins: params.origins.join('|'),
          destinations: params.destinations.join('|'),
          mode: params.mode || 'driving'
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Distance matrix error:', error);
      throw new Error('Failed to calculate distance matrix');
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get data from cache if available and not expired
   */
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set data in cache
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

export const googleMapsProxy = new GoogleMapsProxyService();