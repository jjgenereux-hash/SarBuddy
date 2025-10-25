// Google Maps API Key Validator
export interface GoogleMapsValidation {
  isValid: boolean;
  hasKey: boolean;
  keyFormat: boolean;
  message: string;
  warnings: string[];
  suggestions: string[];
}

export function validateGoogleMapsApiKey(): GoogleMapsValidation {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Check if key exists
  if (!apiKey) {
    return {
      isValid: false,
      hasKey: false,
      keyFormat: false,
      message: 'No Google Maps API key found',
      warnings: ['Google Maps API key is missing'],
      suggestions: [
        'Create a .env file in the project root',
        'Add VITE_GOOGLE_MAPS_API_KEY=your_api_key to the .env file',
        'Get an API key from https://console.cloud.google.com'
      ]
    };
  }
  
  // Check for placeholder values
  const placeholders = [
    'your_google_maps_api_key_here',
    'your_api_key',
    'your_dev_maps_key',
    'your_staging_maps_key',
    'YOUR_API_KEY_HERE',
    'xxx',
    'test'
  ];
  
  if (placeholders.includes(apiKey)) {
    return {
      isValid: false,
      hasKey: true,
      keyFormat: false,
      message: 'Google Maps API key is a placeholder',
      warnings: ['API key appears to be a placeholder value'],
      suggestions: [
        'Replace the placeholder with your actual API key',
        'Get an API key from Google Cloud Console',
        'Enable Maps JavaScript API, Places API, and Geocoding API'
      ]
    };
  }
  
  // Check key format (basic validation)
  const keyPattern = /^[A-Za-z0-9_-]{30,50}$/;
  if (!keyPattern.test(apiKey)) {
    warnings.push('API key format may be incorrect');
    suggestions.push('Verify your API key in Google Cloud Console');
  }
  
  // Check for common issues
  if (apiKey.includes(' ')) {
    return {
      isValid: false,
      hasKey: true,
      keyFormat: false,
      message: 'API key contains spaces',
      warnings: ['API key should not contain spaces'],
      suggestions: ['Remove any spaces from your API key']
    };
  }
  
  if (apiKey.startsWith('AIza')) {
    // This is the correct Google Maps API key format
    return {
      isValid: true,
      hasKey: true,
      keyFormat: true,
      message: 'Google Maps API key appears valid',
      warnings: warnings.length > 0 ? warnings : [],
      suggestions: [
        'Ensure Maps JavaScript API is enabled',
        'Ensure Places API is enabled',
        'Check API key restrictions match your domain'
      ]
    };
  }
  
  return {
    isValid: true,
    hasKey: true,
    keyFormat: true,
    message: 'Google Maps API key is configured',
    warnings: warnings,
    suggestions: suggestions.length > 0 ? suggestions : [
      'Test the map components to ensure they load properly',
      'Check browser console for any API errors'
    ]
  };
}

export function getGoogleMapsApiStatus(): string {
  const validation = validateGoogleMapsApiKey();
  
  if (!validation.hasKey) {
    return 'missing';
  }
  
  if (!validation.isValid) {
    return 'invalid';
  }
  
  if (validation.warnings.length > 0) {
    return 'warning';
  }
  
  return 'valid';
}

export function shouldUseFallbackMap(): boolean {
  const validation = validateGoogleMapsApiKey();
  return !validation.isValid || !validation.hasKey;
}