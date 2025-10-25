// Configuration validator utility
import { config } from '../config/environment';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingRequired: string[];
  missingOptional: string[];
}

export interface ServiceStatus {
  name: string;
  configured: boolean;
  required: boolean;
  status: 'configured' | 'missing' | 'partial';
  message: string;
}

const REQUIRED_SERVICES = [
  'supabase.url',
  'supabase.anonKey',
];

const OPTIONAL_SERVICES = [
  'googleMaps.apiKey',
  'openai.apiKey',
  'twilio.accountSid',
  'sendgrid.apiKey',
  'stripe.publishableKey',
  'weatherApi.apiKey',
  'sentry.dsn',
];

export const validateConfiguration = (): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];

  // Check required services
  REQUIRED_SERVICES.forEach(path => {
    const value = getNestedValue(config.services, path);
    if (!value) {
      errors.push(`Missing required configuration: ${path}`);
      missingRequired.push(path);
    }
  });

  // Check optional services
  OPTIONAL_SERVICES.forEach(path => {
    const value = getNestedValue(config.services, path);
    if (!value) {
      warnings.push(`Missing optional configuration: ${path}`);
      missingOptional.push(path);
    }
  });

  // Validate API URLs
  if (config.apiUrl && !isValidUrl(config.apiUrl)) {
    errors.push('Invalid API URL format');
  }

  if (config.websocketUrl && !isValidWebSocketUrl(config.websocketUrl)) {
    errors.push('Invalid WebSocket URL format');
  }

  // Security checks for production
  if (config.isProduction) {
    if (!config.security.requireHttps) {
      warnings.push('HTTPS is not enforced in production');
    }
    if (!config.security.enableRateLimit) {
      warnings.push('Rate limiting is disabled in production');
    }
    if (!config.services.sentry.dsn) {
      warnings.push('Sentry error tracking not configured for production');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingRequired,
    missingOptional,
  };
};

export const getServiceStatus = (): ServiceStatus[] => {
  const services: ServiceStatus[] = [
    {
      name: 'Supabase Database',
      configured: !!config.services.supabase.url && !!config.services.supabase.anonKey,
      required: true,
      status: getStatus(!!config.services.supabase.url && !!config.services.supabase.anonKey, true),
      message: getStatusMessage('Supabase', !!config.services.supabase.url && !!config.services.supabase.anonKey),
    },
    {
      name: 'Google Maps',
      configured: !!config.services.googleMaps.apiKey,
      required: false,
      status: getStatus(!!config.services.googleMaps.apiKey, false),
      message: getStatusMessage('Google Maps', !!config.services.googleMaps.apiKey),
    },
    {
      name: 'OpenAI (AI Features)',
      configured: !!config.services.openai.apiKey,
      required: false,
      status: getStatus(!!config.services.openai.apiKey, false),
      message: getStatusMessage('OpenAI', !!config.services.openai.apiKey),
    },
    {
      name: 'Twilio (SMS)',
      configured: !!config.services.twilio.accountSid,
      required: false,
      status: getStatus(!!config.services.twilio.accountSid, false),
      message: getStatusMessage('Twilio', !!config.services.twilio.accountSid),
    },
    {
      name: 'SendGrid (Email)',
      configured: !!config.services.sendgrid.apiKey,
      required: false,
      status: getStatus(!!config.services.sendgrid.apiKey, false),
      message: getStatusMessage('SendGrid', !!config.services.sendgrid.apiKey),
    },
    {
      name: 'Stripe (Payments)',
      configured: !!config.services.stripe.publishableKey,
      required: false,
      status: getStatus(!!config.services.stripe.publishableKey, false),
      message: getStatusMessage('Stripe', !!config.services.stripe.publishableKey),
    },
    {
      name: 'Weather API',
      configured: !!config.services.weatherApi.apiKey,
      required: false,
      status: getStatus(!!config.services.weatherApi.apiKey, false),
      message: getStatusMessage('Weather API', !!config.services.weatherApi.apiKey),
    },
  ];

  return services;
};

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const isValidWebSocketUrl = (url: string): boolean => {
  return url.startsWith('ws://') || url.startsWith('wss://');
};

const getStatus = (configured: boolean, required: boolean): 'configured' | 'missing' | 'partial' => {
  if (configured) return 'configured';
  return required ? 'missing' : 'partial';
};

const getStatusMessage = (service: string, configured: boolean): string => {
  return configured 
    ? `${service} is properly configured`
    : `${service} API key not configured`;
};