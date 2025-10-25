import { supabase } from '@/lib/supabase';

interface Dataset {
  id: string;
  name: string;
  description?: string;
  owner: string;
  created: string;
  modified: string;
}

interface Tileset {
  id: string;
  name: string;
  status: 'processing' | 'available' | 'failed';
  created: string;
  modified: string;
  recipe?: any;
}

interface PetSighting {
  id: string;
  pet_id: string;
  location: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  description?: string;
  reporter_name?: string;
  confidence_level?: number;
}

interface UploadResult {
  success: boolean;
  featuresUploaded: number;
  errors?: string[];
}

interface TilesetStatus {
  id: string;
  status: 'processing' | 'available' | 'failed';
  progress?: number;
  error?: string;
  created: string;
  modified: string;
}

class MapboxDatasetService {
  private baseUrl = 'https://api.mapbox.com/datasets/v1';
  
  async createDataset(name: string, description?: string): Promise<Dataset> {
    try {
      const { data, error } = await supabase.functions.invoke('mapbox-dataset-manager', {
        body: {
          action: 'createDataset',
          params: {
            name,
            description
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create dataset');
      }

      return data.dataset as Dataset;
    } catch (error) {
      console.error('Failed to create dataset:', error);
      throw error;
    }
  }

  async uploadSightings(datasetId: string, sightings: PetSighting[]): Promise<UploadResult> {
    try {
      // Convert sightings to GeoJSON features
      const features = sightings.map(sighting => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [sighting.location.lng, sighting.location.lat]
        },
        properties: {
          id: sighting.id,
          pet_id: sighting.pet_id,
          timestamp: sighting.timestamp,
          description: sighting.description || '',
          reporter_name: sighting.reporter_name || 'Anonymous',
          confidence_level: sighting.confidence_level || 0
        }
      }));

      // Batch upload in chunks of 100
      const chunkSize = 100;
      const chunks = [];
      for (let i = 0; i < features.length; i += chunkSize) {
        chunks.push(features.slice(i, i + chunkSize));
      }

      let totalUploaded = 0;
      const errors: string[] = [];

      for (const chunk of chunks) {
        const { data, error } = await supabase.functions.invoke('mapbox-dataset-manager', {
          body: {
            action: 'uploadFeatures',
            params: {
              datasetId,
              features: chunk
            }
          }
        });

        if (error) {
          errors.push(`Chunk upload failed: ${error.message}`);
          continue;
        }

        if (data.success) {
          totalUploaded += chunk.length;
        } else {
          errors.push(data.error || 'Unknown error during chunk upload');
        }
      }

      return {
        success: errors.length === 0,
        featuresUploaded: totalUploaded,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error('Failed to upload sightings:', error);
      throw error;
    }
  }

  async fetchSightingsFromDatabase(
    limit = 1000,
    offset = 0,
    filters?: {
      startDate?: string;
      endDate?: string;
      petId?: string;
      status?: string;
    }
  ): Promise<PetSighting[]> {
    try {
      let query = supabase
        .from('pet_sightings')
        .select(`
          id,
          pet_id,
          location,
          sighted_at,
          description,
          reporter_name,
          confidence_level,
          verified
        `)
        .order('sighted_at', { ascending: false })
        .range(offset, offset + limit - 1);

      // Apply filters
      if (filters?.startDate) {
        query = query.gte('sighted_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('sighted_at', filters.endDate);
      }
      if (filters?.petId) {
        query = query.eq('pet_id', filters.petId);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Transform to PetSighting format
      return (data || []).map(sighting => ({
        id: sighting.id,
        pet_id: sighting.pet_id,
        location: {
          lat: sighting.location.coordinates[1],
          lng: sighting.location.coordinates[0]
        },
        timestamp: sighting.sighted_at,
        description: sighting.description,
        reporter_name: sighting.reporter_name,
        confidence_level: sighting.confidence_level
      }));
    } catch (error) {
      console.error('Failed to fetch sightings from database:', error);
      throw error;
    }
  }

  async createTileset(
    datasetId: string,
    name: string,
    recipe?: any
  ): Promise<Tileset> {
    try {
      const defaultRecipe = recipe || {
        version: 1,
        layers: {
          sightings: {
            source: `mapbox://dataset/${datasetId}`,
            minzoom: 0,
            maxzoom: 16
          }
        }
      };

      const { data, error } = await supabase.functions.invoke('mapbox-dataset-manager', {
        body: {
          action: 'createTileset',
          params: {
            name,
            recipe: defaultRecipe,
            datasetId
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create tileset');
      }

      return data.tileset as Tileset;
    } catch (error) {
      console.error('Failed to create tileset:', error);
      throw error;
    }
  }

  async publishTileset(tilesetId: string): Promise<void> {
    try {
      const { data, error } = await supabase.functions.invoke('mapbox-dataset-manager', {
        body: {
          action: 'publishTileset',
          params: {
            tilesetId
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to publish tileset');
      }

      // Log the publish action
      await supabase
        .from('mapbox_sync_history')
        .insert({
          action: 'tileset_published',
          records_affected: 1,
          status: 'success',
          error_details: null
        });
    } catch (error) {
      console.error('Failed to publish tileset:', error);
      
      // Log the failure
      await supabase
        .from('mapbox_sync_history')
        .insert({
          action: 'tileset_publish_failed',
          records_affected: 0,
          status: 'failure',
          error_details: error instanceof Error ? error.message : 'Unknown error'
        });
      
      throw error;
    }
  }

  async getTilesetStatus(tilesetId: string): Promise<TilesetStatus> {
    try {
      const { data, error } = await supabase.functions.invoke('mapbox-dataset-manager', {
        body: {
          action: 'getTilesetStatus',
          params: {
            tilesetId
          }
        }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get tileset status');
      }

      return data.status as TilesetStatus;
    } catch (error) {
      console.error('Failed to get tileset status:', error);
      throw error;
    }
  }

  async syncDatabaseToMapbox(datasetId: string): Promise<UploadResult> {
    try {
      // Fetch all sightings from database
      const sightings = await this.fetchSightingsFromDatabase(5000); // Limit to 5000 for safety
      
      if (sightings.length === 0) {
        return {
          success: true,
          featuresUploaded: 0
        };
      }

      // Upload to Mapbox dataset
      const result = await this.uploadSightings(datasetId, sightings);

      // Update sync status
      await supabase
        .from('mapbox_sync_status')
        .update({
          last_sync: new Date().toISOString(),
          records_synced: result.featuresUploaded,
          status: result.success ? 'completed' : 'failed',
          error_message: result.errors ? result.errors.join(', ') : null,
          updated_at: new Date().toISOString()
        })
        .order('created_at', { ascending: false })
        .limit(1);

      return result;
    } catch (error) {
      console.error('Failed to sync database to Mapbox:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const mapboxDatasetService = new MapboxDatasetService();