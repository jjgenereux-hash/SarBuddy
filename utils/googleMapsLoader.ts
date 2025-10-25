// Google Maps JavaScript API Loader
let googleMapsPromise: Promise<typeof google> | null = null;

export const loadGoogleMaps = (): Promise<typeof google> => {
  // Return existing promise if already loading/loaded
  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    // Handle load success
    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google);
      } else {
        reject(new Error('Google Maps failed to load'));
      }
    };

    // Handle load error
    script.onerror = () => {
      googleMapsPromise = null; // Reset to allow retry
      reject(new Error('Failed to load Google Maps script'));
    };

    // Add script to document
    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

// Check if Google Maps is loaded
export const isGoogleMapsLoaded = (): boolean => {
  return !!(window.google && window.google.maps && window.google.maps.places);
};

// Type augmentation for window object
declare global {
  interface Window {
    google: typeof google;
  }
}