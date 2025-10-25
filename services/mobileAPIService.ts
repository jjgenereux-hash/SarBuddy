import { supabase } from '@/lib/supabase';

export interface MobileDevice {
  id: string;
  userId: string;
  deviceToken: string;
  platform: 'ios' | 'android';
  appVersion?: string;
  osVersion?: string;
  deviceModel?: string;
  pushEnabled: boolean;
  locationEnabled: boolean;
  lastSyncAt?: string;
}

export interface PushNotification {
  userId?: string;
  deviceIds?: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low';
}

export interface LocationAlert {
  lat: number;
  lng: number;
  radius: number;
  alertType: 'pet_sighted' | 'volunteer_nearby' | 'search_area' | 'found_pet';
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

export interface OfflineSyncItem {
  deviceId: string;
  operation: 'create' | 'update' | 'delete';
  entityType: string;
  entityId?: string;
  data: Record<string, any>;
}

class MobileAPIService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mobile-api-bridge`;
  }

  // Device Management
  async registerDevice(device: Partial<MobileDevice>): Promise<MobileDevice> {
    const { data, error } = await supabase.functions.invoke('mobile-api-bridge', {
      body: {
        path: 'register-device',
        ...device
      },
      headers: {
        'x-platform': device.platform || 'ios',
        'x-device-token': device.deviceToken || ''
      }
    });

    if (error) throw error;
    return data.device;
  }

  async updateDeviceSettings(deviceId: string, settings: Partial<MobileDevice>): Promise<void> {
    const { error } = await supabase
      .from('mobile_devices')
      .update(settings)
      .eq('id', deviceId);

    if (error) throw error;
  }

  // Data Synchronization
  async syncData(deviceId: string, lastSyncAt?: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('mobile-api-bridge', {
      body: {
        path: 'sync-data',
        deviceId,
        lastSyncAt
      }
    });

    if (error) throw error;
    return data;
  }

  async queueOfflineAction(item: OfflineSyncItem): Promise<void> {
    const { error } = await supabase.functions.invoke('mobile-api-bridge', {
      body: {
        path: 'queue-offline-action',
        ...item
      }
    });

    if (error) throw error;
  }

  async processSyncQueue(deviceId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('mobile-api-bridge', {
      body: {
        path: 'process-sync-queue',
        deviceId
      }
    });

    if (error) throw error;
    return data.processed;
  }

  // Push Notifications
  async sendPushNotification(notification: PushNotification): Promise<any> {
    const { data, error } = await supabase.functions.invoke('push-notification-service', {
      body: {
        action: 'send',
        ...notification
      }
    });

    if (error) throw error;
    return data;
  }

  async broadcastNotification(notification: PushNotification & { userIds?: string[] }): Promise<any> {
    const { data, error } = await supabase.functions.invoke('push-notification-service', {
      body: {
        action: 'broadcast',
        ...notification
      }
    });

    if (error) throw error;
    return data;
  }

  async sendLocationAlert(alert: LocationAlert): Promise<any> {
    const { data, error } = await supabase.functions.invoke('push-notification-service', {
      body: {
        action: 'location-alert',
        ...alert
      }
    });

    if (error) throw error;
    return data;
  }

  // Location Services
  async reportLocation(deviceId: string, lat: number, lng: number, accuracy?: number): Promise<any> {
    const { data, error } = await supabase.functions.invoke('mobile-api-bridge', {
      body: {
        path: 'report-location',
        deviceId,
        lat,
        lng,
        accuracy,
        timestamp: new Date().toISOString()
      }
    });

    if (error) throw error;
    return data;
  }

  async getNearbyPets(lat: number, lng: number, radius: number = 5000): Promise<any[]> {
    const { data, error } = await supabase.functions.invoke('mobile-api-bridge', {
      body: {
        path: 'get-nearby-pets',
        lat,
        lng,
        radius
      }
    });

    if (error) throw error;
    return data.pets;
  }

  async createLocationAlert(alert: {
    userId: string;
    petId?: string;
    lat: number;
    lng: number;
    radius: number;
    alertType: string;
  }): Promise<void> {
    const { error } = await supabase
      .from('location_alerts')
      .insert({
        user_id: alert.userId,
        pet_id: alert.petId,
        center_lat: alert.lat,
        center_lng: alert.lng,
        radius_meters: alert.radius,
        alert_type: alert.alertType,
        is_active: true
      });

    if (error) throw error;
  }

  // Pet Reporting (Mobile Optimized)
  async reportPetMobile(petData: any, photo?: File): Promise<any> {
    const formData = new FormData();
    formData.append('data', JSON.stringify(petData));
    if (photo) {
      formData.append('photo', photo);
    }

    const { data, error } = await supabase.functions.invoke('mobile-api-bridge', {
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    if (error) throw error;
    return data.pet;
  }

  // Analytics
  async getDeviceStats(): Promise<any> {
    const { data: devices } = await supabase
      .from('mobile_devices')
      .select('*');

    const { data: notifications } = await supabase
      .from('push_notifications')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const activeDevices = devices?.filter(d => 
      d.last_sync_at && new Date(d.last_sync_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    ).length || 0;

    return {
      totalDevices: devices?.length || 0,
      activeDevices,
      iosDevices: devices?.filter(d => d.platform === 'ios').length || 0,
      androidDevices: devices?.filter(d => d.platform === 'android').length || 0,
      pushEnabled: devices?.filter(d => d.push_enabled).length || 0,
      locationEnabled: devices?.filter(d => d.location_enabled).length || 0,
      notificationsSent: notifications?.filter(n => n.status === 'sent').length || 0,
      notificationsDelivered: notifications?.filter(n => n.status === 'delivered').length || 0
    };
  }

  async getAPILogs(deviceId?: string, limit: number = 100): Promise<any[]> {
    let query = supabase
      .from('mobile_api_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (deviceId) {
      query = query.eq('device_id', deviceId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
}

export const mobileAPIService = new MobileAPIService();