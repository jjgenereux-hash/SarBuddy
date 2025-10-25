import { useState, useEffect } from 'react';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

interface UseUserLocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchPosition?: boolean;
}

export function useUserLocation(options: UseUserLocationOptions = {}) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }

    const geoOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 30000
    };

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      });
      setLoading(false);
      setError(null);
      setPermissionDenied(false);
    };

    const handleError = (error: GeolocationPositionError) => {
      setLoading(false);
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setError('Location access denied. Please enable location permissions to see nearby pets.');
          setPermissionDenied(true);
          break;
        case error.POSITION_UNAVAILABLE:
          setError('Location information is unavailable.');
          break;
        case error.TIMEOUT:
          setError('Location request timed out.');
          break;
        default:
          setError('An unknown error occurred while getting your location.');
      }
    };

    if (options.watchPosition) {
      const watchId = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geoOptions
      );

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        geoOptions
      );
    }
  }, [options.enableHighAccuracy, options.timeout, options.maximumAge, options.watchPosition]);

  const retry = () => {
    setLoading(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        setLoading(false);
        setPermissionDenied(false);
      },
      (error) => {
        setLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionDenied(true);
          setError('Location access denied. Please enable location permissions to see nearby pets.');
        } else {
          setError('Failed to get location. Please try again.');
        }
      },
      {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 30000
      }
    );
  };

  return {
    location,
    loading,
    error,
    permissionDenied,
    retry
  };
}