/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

/**
 * Filter items by distance from a center point
 */
export function filterByDistance<T extends { latitude: number; longitude: number }>(
  items: T[],
  centerLat: number,
  centerLng: number,
  radiusMiles: number
): T[] {
  return items.filter(item => {
    const distance = calculateDistance(
      centerLat,
      centerLng,
      item.latitude,
      item.longitude
    );
    return distance <= radiusMiles;
  });
}

/**
 * Get bounding box coordinates for a radius around a point
 * Useful for database queries to pre-filter by rough area
 */
export function getBoundingBox(
  lat: number,
  lng: number,
  radiusMiles: number
): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} {
  // Rough approximation: 1 degree latitude = 69 miles
  const latDelta = radiusMiles / 69;
  
  // Longitude varies by latitude
  const lngDelta = radiusMiles / (69 * Math.cos(lat * Math.PI / 180));
  
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}