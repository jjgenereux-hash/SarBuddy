// Geolocation utilities for geofencing and distance calculations

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface GeofenceZone {
  id: string;
  name: string;
  center: Coordinates;
  radiusMeters: number;
  isActive: boolean;
}

// Calculate distance between two points using Haversine formula
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Check if a point is within a geofence zone
export function isPointInZone(point: Coordinates, zone: GeofenceZone): boolean {
  const distance = calculateDistance(point, zone.center);
  return distance <= zone.radiusMeters;
}

// Get current user location
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  });
}

// Get recommended search radius based on location density
export function getRecommendedRadius(coords: Coordinates): number {
  // Mock implementation - in production would use actual data
  return 5000; // 5km default
}

// Get city name from coordinates
export function getCityFromCoordinates(coords: Coordinates): string {
  return getAddressFromCoords(coords);
}

// Check if coordinates are in Rhode Island
export function isInRhodeIsland(coords: Coordinates): boolean {
  // Rhode Island approximate boundaries
  const minLat = 41.146;
  const maxLat = 42.019;
  const minLng = -71.907;
  const maxLng = -71.120;
  
  return coords.lat >= minLat && coords.lat <= maxLat && 
         coords.lng >= minLng && coords.lng <= maxLng;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

// Get direction between two points
export function getDirection(from: Coordinates, to: Coordinates): string {
  const bearing = calculateBearing(from, to);
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

// Calculate bearing between two points
function calculateBearing(from: Coordinates, to: Coordinates): number {
  const φ1 = (from.lat * Math.PI) / 180;
  const φ2 = (to.lat * Math.PI) / 180;
  const Δλ = ((to.lng - from.lng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  return ((θ * 180) / Math.PI + 360) % 360;
}

// Get readable address from coordinates (mock implementation)
export function getAddressFromCoords(coords: Coordinates): string {
  // In a real app, this would use a geocoding API
  const areas = [
    'Providence', 'Warwick', 'Cranston', 'Pawtucket', 'East Providence',
    'Woonsocket', 'Newport', 'Central Falls', 'Westerly', 'Bristol'
  ];
  const index = Math.floor(Math.random() * areas.length);
  return `${areas[index]}, RI`;
}