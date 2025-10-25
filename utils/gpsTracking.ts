export interface GPSLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: string;
  heading?: number;
  speed?: number;
}

export interface SearchZone {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number; // in meters
  priority: 'high' | 'normal' | 'low';
  assignedTo?: string;
}

export interface TrackingData {
  id: string;
  volunteerId: string;
  volunteerName: string;
  currentLocation: GPSLocation;
  status: 'active' | 'paused' | 'completed';
  assignedZone?: SearchZone;
  startedAt: string;
  lastUpdate: string;
}

export class GPSTracker {
  private watchId: number | null = null;
  private onLocationUpdate: (location: GPSLocation) => void;
  private onError: (error: string) => void;

  constructor(
    onUpdate: (location: GPSLocation) => void,
    onError: (error: string) => void
  ) {
    this.onLocationUpdate = onUpdate;
    this.onError = onError;
  }

  startTracking(highAccuracy = true): void {
    if (!navigator.geolocation) {
      this.onError('Geolocation is not supported by your browser');
      return;
    }

    const options = {
      enableHighAccuracy: highAccuracy,
      timeout: 5000,
      maximumAge: 0
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: GPSLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined
        };
        this.onLocationUpdate(location);
      },
      (error) => {
        this.onError(error.message);
      },
      options
    );
  }

  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  getCurrentPosition(): Promise<GPSLocation> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined
          });
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    });
  }
}

export function calculateCoverage(breadcrumbs: GPSLocation[]): number {
  if (breadcrumbs.length < 3) return 0;
  
  // Simplified coverage calculation using bounding box
  const lats = breadcrumbs.map(b => b.lat);
  const lngs = breadcrumbs.map(b => b.lng);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  // Approximate area in square meters
  const latDistance = (maxLat - minLat) * 111320;
  const lngDistance = (maxLng - minLng) * 111320 * Math.cos(minLat * Math.PI / 180);
  
  return Math.abs(latDistance * lngDistance);
}

export function isInZone(location: GPSLocation, zone: SearchZone): boolean {
  const distance = calculateDistance(
    location.lat,
    location.lng,
    zone.center.lat,
    zone.center.lng
  );
  return distance <= zone.radius;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}