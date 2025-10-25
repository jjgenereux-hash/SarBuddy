/**
 * Geocoding Service for converting addresses to coordinates
 * Uses Mapbox Geocoding API (can be switched to Google Maps if needed)
 */

// Mapbox access token - should be stored in environment variable
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoicGV0ZmluZGVyIiwiYSI6ImNsYTEyM2FiYzBjZDQzb3A0ZHJtNGZ5YWwifQ.demo_token';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  confidence: 'high' | 'medium' | 'low';
  displayName: string;
  isEstimated: true;
}

export interface GeocodingError {
  error: string;
  originalQuery: string;
}

/**
 * Build geocoding query from pet location data
 */
function buildGeocodingQuery(pet: any): string | null {
  const parts = [];
  
  // Add address if available
  if (pet.address) {
    parts.push(pet.address);
  }
  
  // Add city if available
  if (pet.city) {
    parts.push(pet.city);
  }
  
  // Add state if available
  if (pet.state) {
    parts.push(pet.state);
  }
  
  // Add ZIP code if available
  if (pet.zip || pet.zipCode || pet.postal_code) {
    parts.push(pet.zip || pet.zipCode || pet.postal_code);
  }
  
  // If we have at least city or ZIP, we can try geocoding
  if (parts.length > 0) {
    return parts.join(', ');
  }
  
  return null;
}

/**
 * Geocode a single pet's location using available address data
 */
export async function geocodePetLocation(pet: any): Promise<GeocodingResult | GeocodingError> {
  const query = buildGeocodingQuery(pet);
  
  if (!query) {
    return {
      error: 'No location data available for geocoding',
      originalQuery: ''
    };
  }
  
  try {
    // Using Mapbox Geocoding API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [longitude, latitude] = feature.center;
      
      // Determine confidence based on place type
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (feature.place_type.includes('address')) {
        confidence = 'high';
      } else if (feature.place_type.includes('postcode') || feature.place_type.includes('neighborhood')) {
        confidence = 'medium';
      }
      
      return {
        latitude,
        longitude,
        confidence,
        displayName: feature.place_name,
        isEstimated: true
      };
    }
    
    return {
      error: 'No results found for location',
      originalQuery: query
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      error: error instanceof Error ? error.message : 'Geocoding failed',
      originalQuery: query
    };
  }
}

/**
 * Batch geocode multiple pets
 * Includes rate limiting to avoid API limits
 */
export async function batchGeocodePets(pets: any[]): Promise<Map<string, GeocodingResult | GeocodingError>> {
  const results = new Map<string, GeocodingResult | GeocodingError>();
  
  // Process in batches with delay to respect rate limits
  const BATCH_SIZE = 5;
  const DELAY_MS = 200; // 200ms between batches
  
  for (let i = 0; i < pets.length; i += BATCH_SIZE) {
    const batch = pets.slice(i, i + BATCH_SIZE);
    
    // Process batch in parallel
    const batchPromises = batch.map(async (pet) => {
      const result = await geocodePetLocation(pet);
      return { id: pet.id, result };
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    // Store results
    batchResults.forEach(({ id, result }) => {
      results.set(id, result);
    });
    
    // Add delay between batches (except for last batch)
    if (i + BATCH_SIZE < pets.length) {
      await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    }
  }
  
  return results;
}

/**
 * Alternative: Use Google Maps Geocoding API
 * Uncomment and use if preferred over Mapbox
 */
/*
export async function geocodePetLocationGoogle(pet: any): Promise<GeocodingResult | GeocodingError> {
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const query = buildGeocodingQuery(pet);
  
  if (!query) {
    return {
      error: 'No location data available for geocoding',
      originalQuery: ''
    };
  }
  
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0];
      const { lat, lng } = result.geometry.location;
      
      // Determine confidence based on location type
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (result.geometry.location_type === 'ROOFTOP') {
        confidence = 'high';
      } else if (result.geometry.location_type === 'RANGE_INTERPOLATED') {
        confidence = 'medium';
      }
      
      return {
        latitude: lat,
        longitude: lng,
        confidence,
        displayName: result.formatted_address,
        isEstimated: true
      };
    }
    
    return {
      error: `Geocoding failed: ${data.status}`,
      originalQuery: query
    };
  } catch (error) {
    console.error('Google geocoding error:', error);
    return {
      error: error instanceof Error ? error.message : 'Geocoding failed',
      originalQuery: query
    };
  }
}
*/

/**
 * Simple geocode location function for address strings
 */
export async function geocodeLocation(address: string): Promise<GeocodingResult | GeocodingError> {
  if (!address || address.trim().length === 0) {
    return {
      error: 'No address provided for geocoding',
      originalQuery: address
    };
  }

  try {
    // Using Mapbox Geocoding API
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const [longitude, latitude] = feature.center;
      
      // Determine confidence based on place type
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (feature.place_type.includes('address')) {
        confidence = 'high';
      } else if (feature.place_type.includes('postcode') || feature.place_type.includes('neighborhood')) {
        confidence = 'medium';
      }
      
      return {
        latitude,
        longitude,
        confidence,
        displayName: feature.place_name,
        isEstimated: true
      };
    }
    
    return {
      error: 'No results found for location',
      originalQuery: address
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      error: error instanceof Error ? error.message : 'Geocoding failed',
      originalQuery: address
    };
  }
}