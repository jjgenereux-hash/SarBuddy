import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

interface SyncStatus {
  id: string;
  status: 'idle' | 'syncing' | 'completed' | 'failed';
  last_sync: string | null;
  records_synced: number;
  error_message: string | null;
  auto_sync_enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface SyncHistory {
  id: string;
  sync_id: string;
  action: string;
  records_affected: number;
  status: 'success' | 'failure';
  error_details: string | null;
  created_at: string;
}

type StatusChangeCallback = (status: SyncStatus) => void;

class MapboxRealtimeSync {
  private channel: RealtimeChannel | null = null;
  private statusListeners: Set<StatusChangeCallback> = new Set();
  private autoSyncInterval: NodeJS.Timeout | null = null;
  private currentStatus: SyncStatus | null = null;

  async initialize(): Promise<void> {
    try {
      // Subscribe to realtime changes
      this.channel = supabase
        .channel('mapbox-sync-status')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'mapbox_sync_status'
          },
          (payload) => {
            this.handleStatusChange(payload.new as SyncStatus);
          }
        )
        .subscribe();

      // Get initial status
      const { data, error } = await supabase
        .from('mapbox_sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        this.currentStatus = data;
        if (data.auto_sync_enabled) {
          this.startAutoSync();
        }
      } else {
        // Create initial status record
        const { data: newStatus } = await supabase
          .from('mapbox_sync_status')
          .insert({
            status: 'idle',
            auto_sync_enabled: false,
            records_synced: 0
          })
          .select()
          .single();
        
        if (newStatus) {
          this.currentStatus = newStatus;
        }
      }
    } catch (error) {
      console.error('Failed to initialize Mapbox realtime sync:', error);
      throw error;
    }
  }

  async getSyncStatus(): Promise<SyncStatus | null> {
    try {
      const { data, error } = await supabase
        .from('mapbox_sync_status')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data || null;
    } catch (error) {
      console.error('Failed to get sync status:', error);
      return null;
    }
  }

  async getSyncHistory(limit = 50): Promise<SyncHistory[]> {
    try {
      const { data, error } = await supabase
        .from('mapbox_sync_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get sync history:', error);
      return [];
    }
  }

  async toggleAutoSync(): Promise<boolean> {
    try {
      const currentStatus = await this.getSyncStatus();
      if (!currentStatus) {
        throw new Error('No sync status found');
      }

      const newAutoSyncState = !currentStatus.auto_sync_enabled;

      const { error } = await supabase
        .from('mapbox_sync_status')
        .update({
          auto_sync_enabled: newAutoSyncState,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentStatus.id);

      if (error) {
        throw error;
      }

      if (newAutoSyncState) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }

      return newAutoSyncState;
    } catch (error) {
      console.error('Failed to toggle auto sync:', error);
      throw error;
    }
  }

  async performManualSync(): Promise<void> {
    try {
      // Update status to syncing
      const status = await this.getSyncStatus();
      if (status) {
        await supabase
          .from('mapbox_sync_status')
          .update({
            status: 'syncing',
            updated_at: new Date().toISOString()
          })
          .eq('id', status.id);
      }

      // Call the edge function to perform sync
      const { data, error } = await supabase.functions.invoke('mapbox-dataset-sync', {
        body: { action: 'sync' }
      });

      if (error) {
        throw error;
      }

      // Update status based on result
      if (status) {
        await supabase
          .from('mapbox_sync_status')
          .update({
            status: data.success ? 'completed' : 'failed',
            last_sync: new Date().toISOString(),
            records_synced: data.recordsSynced || 0,
            error_message: data.error || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', status.id);

        // Log to history
        await supabase
          .from('mapbox_sync_history')
          .insert({
            sync_id: status.id,
            action: 'manual_sync',
            records_affected: data.recordsSynced || 0,
            status: data.success ? 'success' : 'failure',
            error_details: data.error || null
          });
      }
    } catch (error) {
      console.error('Failed to perform manual sync:', error);
      
      // Update status to failed
      const status = await this.getSyncStatus();
      if (status) {
        await supabase
          .from('mapbox_sync_status')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString()
          })
          .eq('id', status.id);
      }
      
      throw error;
    }
  }

  onStatusChange(callback: StatusChangeCallback): () => void {
    this.statusListeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  cleanup(): void {
    // Unsubscribe from realtime channel
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    // Stop auto sync
    this.stopAutoSync();

    // Clear listeners
    this.statusListeners.clear();
  }

  private handleStatusChange(status: SyncStatus): void {
    this.currentStatus = status;
    
    // Notify all listeners
    this.statusListeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in status change callback:', error);
      }
    });

    // Handle auto sync state changes
    if (status.auto_sync_enabled && !this.autoSyncInterval) {
      this.startAutoSync();
    } else if (!status.auto_sync_enabled && this.autoSyncInterval) {
      this.stopAutoSync();
    }
  }

  private startAutoSync(): void {
    if (this.autoSyncInterval) {
      return;
    }

    // Sync every 5 minutes
    this.autoSyncInterval = setInterval(() => {
      this.performManualSync().catch(error => {
        console.error('Auto sync failed:', error);
      });
    }, 5 * 60 * 1000);

    // Perform initial sync
    this.performManualSync().catch(error => {
      console.error('Initial auto sync failed:', error);
    });
  }

  private stopAutoSync(): void {
    if (this.autoSyncInterval) {
      clearInterval(this.autoSyncInterval);
      this.autoSyncInterval = null;
    }
  }
}

// Export singleton instance
export const mapboxRealtimeSync = new MapboxRealtimeSync();