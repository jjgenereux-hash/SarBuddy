import { GOOGLE_MAPS_CONFIG, isProduction } from '@/config/maps';

// Fallback handlers for map-related functionality when API key is missing
export const mapFallback = {
  // Check if we should use fallback mode
  shouldUseFallback: () => {
    return !GOOGLE_MAPS_CONFIG.hasValidKey() && isProduction;
  },

  // Get static map URL for fallback
  getStaticMapUrl: (lat: number, lng: number, zoom: number = 12, width: number = 600, height: number = 400) => {
    // Use OpenStreetMap static image service as fallback
    return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.05},${lat-0.05},${lng+0.05},${lat+0.05}&layer=mapnik`;
  },

  // Handle geocoding without Google Maps
  geocodeAddress: async (address: string) => {
    // Use Nominatim (OpenStreetMap) as fallback geocoding service
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          formatted_address: data[0].display_name
        };
      }
    } catch (error) {
      console.error('Geocoding fallback failed:', error);
    }
    return null;
  },

  // Calculate distance between two points without Google Maps
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in kilometers
  }
};

// Export a hook for React components
export const useMapFallback = () => {
  return {
    isUsingFallback: mapFallback.shouldUseFallback(),
    ...mapFallback
  };
};