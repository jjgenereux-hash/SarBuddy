import { config } from '@/config/environment';

export interface MapError {
  type: 'api_key' | 'network' | 'permission' | 'quota' | 'configuration' | 'unknown';
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
  suggestions: string[];
}

export class MapErrorHandler {
  private static instance: MapErrorHandler;
  private errorLog: MapError[] = [];
  private maxLogSize = 50;

  private constructor() {}

  static getInstance(): MapErrorHandler {
    if (!MapErrorHandler.instance) {
      MapErrorHandler.instance = new MapErrorHandler();
    }
    return MapErrorHandler.instance;
  }

  analyzeError(error: Error | any): MapError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const lowerMessage = errorMessage.toLowerCase();

    // Analyze error type
    let type: MapError['type'] = 'unknown';
    let suggestions: string[] = [];
    let recoverable = false;

    if (this.isApiKeyError(lowerMessage)) {
      type = 'api_key';
      suggestions = [
        'Check if VITE_GOOGLE_MAPS_API_KEY is set in .env file',
        'Verify API key is valid and not expired',
        'Ensure Maps JavaScript API is enabled in Google Cloud Console',
        'Check API key restrictions match your domain'
      ];
      recoverable = false;
    } else if (this.isNetworkError(lowerMessage)) {
      type = 'network';
      suggestions = [
        'Check your internet connection',
        'Verify firewall settings',
        'Try disabling VPN if active',
        'Check if Google Maps services are accessible'
      ];
      recoverable = true;
    } else if (this.isPermissionError(lowerMessage)) {
      type = 'permission';
      suggestions = [
        'Allow location access in browser settings',
        'Check if third-party cookies are enabled',
        'Review browser privacy settings',
        'Try in incognito/private mode'
      ];
      recoverable = true;
    } else if (this.isQuotaError(lowerMessage)) {
      type = 'quota';
      suggestions = [
        'Check Google Cloud Console for quota limits',
        'Review billing status',
        'Consider implementing request throttling',
        'Contact support if quota seems incorrect'
      ];
      recoverable = false;
    } else if (this.isConfigurationError(lowerMessage)) {
      type = 'configuration';
      suggestions = [
        'Review environment configuration',
        'Check if all required libraries are loaded',
        'Verify map initialization parameters',
        'Ensure component mounting correctly'
      ];
      recoverable = false;
    }

    const mapError: MapError = {
      type,
      message: errorMessage,
      details: error,
      timestamp: new Date(),
      recoverable,
      suggestions
    };

    this.logError(mapError);
    return mapError;
  }

  private isApiKeyError(message: string): boolean {
    const apiKeyPatterns = [
      'api key',
      'apikey',
      'invalid key',
      'authentication',
      'unauthorized',
      'invalidkeymaperror',
      'referernotallowedmaperror',
      'apinotactivatedmaperror'
    ];
    return apiKeyPatterns.some(pattern => message.includes(pattern));
  }

  private isNetworkError(message: string): boolean {
    const networkPatterns = [
      'network',
      'fetch',
      'load',
      'timeout',
      'connection',
      'offline',
      'err_internet_disconnected',
      'err_network'
    ];
    return networkPatterns.some(pattern => message.includes(pattern));
  }

  private isPermissionError(message: string): boolean {
    const permissionPatterns = [
      'permission',
      'denied',
      'blocked',
      'geolocation',
      'location access',
      'user denied'
    ];
    return permissionPatterns.some(pattern => message.includes(pattern));
  }

  private isQuotaError(message: string): boolean {
    const quotaPatterns = [
      'quota',
      'limit',
      'exceeded',
      'rate limit',
      'too many requests',
      'overlimitmaperror'
    ];
    return quotaPatterns.some(pattern => message.includes(pattern));
  }

  private isConfigurationError(message: string): boolean {
    const configPatterns = [
      'configuration',
      'initialize',
      'undefined',
      'null',
      'cannot read',
      'not a function',
      'not defined'
    ];
    return configPatterns.some(pattern => message.includes(pattern));
  }

  private logError(error: MapError): void {
    this.errorLog.push(error);
    
    // Trim log if too large
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Store in localStorage for persistence
    try {
      localStorage.setItem('mapErrorLog', JSON.stringify(this.errorLog));
    } catch (e) {
      console.error('Failed to store error log:', e);
    }

    // Log to console in development
    if (config.isDevelopment) {
      console.group('🗺️ Map Error Detected');
      console.error('Type:', error.type);
      console.error('Message:', error.message);
      console.error('Recoverable:', error.recoverable);
      console.error('Suggestions:', error.suggestions);
      console.groupEnd();
    }
  }

  getRecentErrors(count: number = 10): MapError[] {
    return this.errorLog.slice(-count);
  }

  clearErrors(): void {
    this.errorLog = [];
    localStorage.removeItem('mapErrorLog');
  }

  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    recoverable: number;
    nonRecoverable: number;
  } {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<string, number>,
      recoverable: 0,
      nonRecoverable: 0
    };

    this.errorLog.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      if (error.recoverable) {
        stats.recoverable++;
      } else {
        stats.nonRecoverable++;
      }
    });

    return stats;
  }

  // Check if API key is properly configured
  static checkApiKeyConfiguration(): {
    isConfigured: boolean;
    hasValue: boolean;
    isValid: boolean;
    suggestions: string[];
  } {
    const apiKey = config.services.googleMaps.apiKey;
    
    const result = {
      isConfigured: !!apiKey,
      hasValue: apiKey && apiKey.length > 0,
      isValid: apiKey && apiKey.startsWith('AIza') && apiKey.length === 39,
      suggestions: [] as string[]
    };

    if (!result.isConfigured) {
      result.suggestions.push('Add VITE_GOOGLE_MAPS_API_KEY to your .env file');
    } else if (!result.hasValue) {
      result.suggestions.push('API key is empty, please provide a valid key');
    } else if (!result.isValid) {
      result.suggestions.push('API key format appears incorrect');
      result.suggestions.push('Ensure you copied the complete key from Google Cloud Console');
    }

    return result;
  }
}

export default MapErrorHandler.getInstance();