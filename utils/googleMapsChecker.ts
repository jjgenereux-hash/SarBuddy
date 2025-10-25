// Utility to check if Google Maps is already loaded
export const isGoogleMapsLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.google !== 'undefined' && 
         typeof window.google.maps !== 'undefined';
};

// Prevent multiple loads of Google Maps
let loadPromise: Promise<void> | null = null;

export const loadGoogleMapsOnce = async (apiKey: string): Promise<void> => {
  if (isGoogleMapsLoaded()) {
    return Promise.resolve();
  }
  
  if (loadPromise) {
    return loadPromise;
  }
  
  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,visualization`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      resolve();
    };
    
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load Google Maps'));
    };
    
    document.head.appendChild(script);
  });
  
  return loadPromise;
};