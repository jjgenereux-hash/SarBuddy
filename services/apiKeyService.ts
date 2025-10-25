import { supabase } from '@/lib/supabase';

export interface ApiKey {
  id: string;
  service: string;
  environment: string;
  is_active: boolean;
  last_rotated: string;
  version: number;
  created_at: string;
  expires_at?: string;
}

export interface ApiUsage {
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  timestamp: string;
  request_count: number;
}

class ApiKeyService {
  private cache = new Map<string, { key: string; expires: number }>();

  async getGoogleMapsConfig() {
    // Use proxy instead of exposing key
    return {
      useProxy: true,
      proxyEndpoint: '/api/google-maps-proxy'
    };
  }

  async callGoogleMapsApi(endpoint: string, params: Record<string, any>) {
    try {
      const { data, error } = await supabase.functions.invoke('google-maps-proxy', {
        body: { endpoint, params }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Google Maps API call failed:', error);
      throw error;
    }
  }

  async rotateApiKey(keyId: string, newKey: string) {
    const { data, error } = await supabase.functions.invoke('api-key-manager', {
      body: { action: 'rotate', keyId, newKey }
    });

    if (error) throw error;
    
    // Clear cache
    this.cache.clear();
    
    return data;
  }

  async listApiKeys(): Promise<ApiKey[]> {
    const { data, error } = await supabase.functions.invoke('api-key-manager', {
      body: { action: 'list' }
    });

    if (error) throw error;
    return data.data || [];
  }

  async getUsageStats(keyId: string): Promise<ApiUsage[]> {
    const { data, error } = await supabase.functions.invoke('api-key-manager', {
      body: { action: 'usage', keyId }
    });

    if (error) throw error;
    return data.data || [];
  }

  async createApiKey(service: string, key: string) {
    const { data, error } = await supabase.functions.invoke('api-key-manager', {
      body: { action: 'create', service, newKey: key }
    });

    if (error) throw error;
    return data;
  }

  async checkRateLimit(service: string): Promise<boolean> {
    const { data, error } = await supabase.functions.invoke('rate-limiter', {
      body: { service, action: 'check' }
    });

    if (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }

    return data.allowed;
  }

  getEnvironment(): string {
    return import.meta.env.MODE || 'development';
  }
}

export const apiKeyService = new ApiKeyService();