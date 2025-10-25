import { supabase } from '@/lib/supabase';

export interface DataConflict {
  id: string;
  field: string;
  supabaseValue: any;
  mapboxValue: any;
  lastModified: {
    supabase: string;
    mapbox: string;
  };
  severity: 'low' | 'medium' | 'high';
}

export interface SyncConflict {
  datasetId: string;
  recordId: string;
  recordType: 'pet' | 'sighting' | 'location';
  conflicts: DataConflict[];
  detectedAt: string;
  status: 'pending' | 'resolved' | 'ignored';
}

export interface ResolutionStrategy {
  type: 'keep_supabase' | 'keep_mapbox' | 'merge' | 'custom';
  mergeRules?: Record<string, 'supabase' | 'mapbox'>;
  customData?: any;
}

class SyncConflictService {
  async detectConflicts(datasetId: string): Promise<SyncConflict[]> {
    try {
      // Fetch data from both sources
      const [supabaseData, mapboxData] = await Promise.all([
        this.fetchSupabaseData(datasetId),
        this.fetchMapboxData(datasetId)
      ]);

      const conflicts: SyncConflict[] = [];

      // Compare each record
      for (const supabaseRecord of supabaseData) {
        const mapboxRecord = mapboxData.find(m => m.id === supabaseRecord.id);
        
        if (mapboxRecord) {
          const recordConflicts = this.compareRecords(supabaseRecord, mapboxRecord);
          
          if (recordConflicts.length > 0) {
            conflicts.push({
              datasetId,
              recordId: supabaseRecord.id,
              recordType: this.getRecordType(supabaseRecord),
              conflicts: recordConflicts,
              detectedAt: new Date().toISOString(),
              status: 'pending'
            });
          }
        }
      }

      // Store conflicts in database
      if (conflicts.length > 0) {
        await this.storeConflicts(conflicts);
      }

      return conflicts;
    } catch (error) {
      console.error('Error detecting conflicts:', error);
      throw error;
    }
  }

  private async fetchSupabaseData(datasetId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  private async fetchMapboxData(datasetId: string): Promise<any[]> {
    // Simulate fetching from Mapbox API
    // In production, this would call the actual Mapbox Dataset API
    return [];
  }

  private compareRecords(supabaseRecord: any, mapboxRecord: any): DataConflict[] {
    const conflicts: DataConflict[] = [];
    const fieldsToCompare = ['name', 'species', 'location', 'status', 'description'];

    for (const field of fieldsToCompare) {
      if (supabaseRecord[field] !== mapboxRecord[field]) {
        conflicts.push({
          id: `${supabaseRecord.id}-${field}`,
          field,
          supabaseValue: supabaseRecord[field],
          mapboxValue: mapboxRecord[field],
          lastModified: {
            supabase: supabaseRecord.updated_at || supabaseRecord.created_at,
            mapbox: mapboxRecord.updated_at || mapboxRecord.created_at
          },
          severity: this.calculateSeverity(field)
        });
      }
    }

    return conflicts;
  }

  private calculateSeverity(field: string): 'low' | 'medium' | 'high' {
    const highSeverityFields = ['location', 'status'];
    const mediumSeverityFields = ['name', 'species'];
    
    if (highSeverityFields.includes(field)) return 'high';
    if (mediumSeverityFields.includes(field)) return 'medium';
    return 'low';
  }

  private getRecordType(record: any): 'pet' | 'sighting' | 'location' {
    if (record.species) return 'pet';
    if (record.sighting_date) return 'sighting';
    return 'location';
  }

  private async storeConflicts(conflicts: SyncConflict[]): Promise<void> {
    const { error } = await supabase
      .from('sync_conflicts')
      .insert(conflicts);

    if (error) throw error;
  }

  async resolveConflict(
    conflictId: string,
    strategy: ResolutionStrategy
  ): Promise<void> {
    try {
      // Apply resolution strategy
      switch (strategy.type) {
        case 'keep_supabase':
          await this.applySupabaseData(conflictId);
          break;
        case 'keep_mapbox':
          await this.applyMapboxData(conflictId);
          break;
        case 'merge':
          await this.mergeData(conflictId, strategy.mergeRules);
          break;
        case 'custom':
          await this.applyCustomData(conflictId, strategy.customData);
          break;
      }

      // Mark conflict as resolved
      await this.markResolved(conflictId);
    } catch (error) {
      console.error('Error resolving conflict:', error);
      throw error;
    }
  }

  private async applySupabaseData(conflictId: string): Promise<void> {
    // Push Supabase data to Mapbox
    console.log('Applying Supabase data for conflict:', conflictId);
  }

  private async applyMapboxData(conflictId: string): Promise<void> {
    // Pull Mapbox data to Supabase
    console.log('Applying Mapbox data for conflict:', conflictId);
  }

  private async mergeData(
    conflictId: string,
    mergeRules?: Record<string, 'supabase' | 'mapbox'>
  ): Promise<void> {
    // Merge data based on rules
    console.log('Merging data for conflict:', conflictId, mergeRules);
  }

  private async applyCustomData(conflictId: string, customData: any): Promise<void> {
    // Apply custom resolution
    console.log('Applying custom data for conflict:', conflictId, customData);
  }

  private async markResolved(conflictId: string): Promise<void> {
    const { error } = await supabase
      .from('sync_conflicts')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', conflictId);

    if (error) throw error;
  }

  async rollbackSync(syncHistoryId: string): Promise<void> {
    try {
      // Fetch sync history
      const { data: history, error } = await supabase
        .from('mapbox_sync_history')
        .select('*')
        .eq('id', syncHistoryId)
        .single();

      if (error) throw error;

      // Restore previous state
      if (history?.details?.backup) {
        await this.restoreBackup(history.details.backup);
      }

      // Log rollback
      await supabase
        .from('mapbox_sync_history')
        .insert({
          dataset_id: history.dataset_id,
          synced_at: new Date().toISOString(),
          records_synced: 0,
          status: 'rolled_back',
          details: { rolled_back_from: syncHistoryId }
        });
    } catch (error) {
      console.error('Error rolling back sync:', error);
      throw error;
    }
  }

  private async restoreBackup(backup: any): Promise<void> {
    // Restore data from backup
    console.log('Restoring backup:', backup);
  }
}

export const syncConflictService = new SyncConflictService();