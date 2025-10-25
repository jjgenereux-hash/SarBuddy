import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TileCacheDB extends DBSchema {
  tiles: {
    key: string;
    value: {
      id: string;
      data: Blob;
      url: string;
      timestamp: number;
      accessCount: number;
      lastAccessed: number;
      size: number;
      zoom: number;
      x: number;
      y: number;
    };
  };
  metadata: {
    key: string;
    value: {
      totalSize: number;
      tileCount: number;
      lastCleanup: number;
      offlineMode: boolean;
    };
  };
}

class MapTileCacheService {
  private db: IDBPDatabase<TileCacheDB> | null = null;
  private readonly DB_NAME = 'MapTileCache';
  private readonly DB_VERSION = 1;
  private readonly MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly TILE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private cleanupTimer: NodeJS.Timeout | null = null;
  private offlineMode = false;

  async init() {
    if (this.db) return;

    this.db = await openDB<TileCacheDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tiles')) {
          const tileStore = db.createObjectStore('tiles', { keyPath: 'id' });
          tileStore.createIndex('timestamp', 'timestamp');
          tileStore.createIndex('lastAccessed', 'lastAccessed');
          tileStore.createIndex('zoom', 'zoom');
        }
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      },
    });

    await this.initMetadata();
    this.startCleanupTimer();
  }

  private async initMetadata() {
    if (!this.db) return;
    
    const metadata = await this.db.get('metadata', 'cache');
    if (!metadata) {
      await this.db.put('metadata', {
        key: 'cache',
        totalSize: 0,
        tileCount: 0,
        lastCleanup: Date.now(),
        offlineMode: false
      });
    }
  }

  private startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  async getTile(url: string, zoom: number, x: number, y: number): Promise<Blob | null> {
    if (!this.db) await this.init();
    if (!this.db) return null;

    const id = this.generateTileId(zoom, x, y);
    const tile = await this.db.get('tiles', id);

    if (tile) {
      const now = Date.now();
      
      // Check if tile is expired
      if (now - tile.timestamp > this.TILE_EXPIRY_MS && !this.offlineMode) {
        await this.deleteTile(id);
        return null;
      }

      // Update access stats
      await this.db.put('tiles', {
        ...tile,
        accessCount: tile.accessCount + 1,
        lastAccessed: now
      });

      return tile.data;
    }

    return null;
  }

  async cacheTile(url: string, data: Blob, zoom: number, x: number, y: number) {
    if (!this.db) await this.init();
    if (!this.db) return;

    const id = this.generateTileId(zoom, x, y);
    const size = data.size;

    // Check cache size limit
    const metadata = await this.db.get('metadata', 'cache');
    if (metadata && metadata.totalSize + size > this.MAX_CACHE_SIZE) {
      await this.evictLRU(size);
    }

    await this.db.put('tiles', {
      id,
      data,
      url,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size,
      zoom,
      x,
      y
    });

    await this.updateMetadata(size, 1);
  }

  private async evictLRU(requiredSpace: number) {
    if (!this.db) return;

    const tiles = await this.db.getAllFromIndex('tiles', 'lastAccessed');
    let freedSpace = 0;

    for (const tile of tiles) {
      if (freedSpace >= requiredSpace) break;
      
      await this.deleteTile(tile.id);
      freedSpace += tile.size;
    }
  }

  private async deleteTile(id: string) {
    if (!this.db) return;

    const tile = await this.db.get('tiles', id);
    if (tile) {
      await this.db.delete('tiles', id);
      await this.updateMetadata(-tile.size, -1);
    }
  }

  private async updateMetadata(sizeChange: number, countChange: number) {
    if (!this.db) return;

    const metadata = await this.db.get('metadata', 'cache');
    if (metadata) {
      await this.db.put('metadata', {
        ...metadata,
        totalSize: Math.max(0, metadata.totalSize + sizeChange),
        tileCount: Math.max(0, metadata.tileCount + countChange)
      });
    }
  }

  async cleanup() {
    if (!this.db) return;

    const now = Date.now();
    const tiles = await this.db.getAll('tiles');
    
    for (const tile of tiles) {
      if (now - tile.timestamp > this.TILE_EXPIRY_MS && !this.offlineMode) {
        await this.deleteTile(tile.id);
      }
    }

    await this.db.put('metadata', {
      ...(await this.db.get('metadata', 'cache') || {
        key: 'cache',
        totalSize: 0,
        tileCount: 0,
        offlineMode: false
      }),
      lastCleanup: now
    });
  }

  async clearCache() {
    if (!this.db) return;

    await this.db.clear('tiles');
    await this.initMetadata();
  }

  async getCacheStats() {
    if (!this.db) await this.init();
    if (!this.db) return null;

    const metadata = await this.db.get('metadata', 'cache');
    const tiles = await this.db.getAll('tiles');
    
    const zoomLevels = new Map<number, number>();
    tiles.forEach(tile => {
      zoomLevels.set(tile.zoom, (zoomLevels.get(tile.zoom) || 0) + 1);
    });

    return {
      totalSize: metadata?.totalSize || 0,
      tileCount: metadata?.tileCount || 0,
      lastCleanup: metadata?.lastCleanup || 0,
      offlineMode: this.offlineMode,
      maxCacheSize: this.MAX_CACHE_SIZE,
      zoomLevels: Array.from(zoomLevels.entries()).map(([zoom, count]) => ({
        zoom,
        count
      }))
    };
  }

  async setOfflineMode(enabled: boolean) {
    this.offlineMode = enabled;
    if (!this.db) return;

    const metadata = await this.db.get('metadata', 'cache');
    if (metadata) {
      await this.db.put('metadata', {
        ...metadata,
        offlineMode: enabled
      });
    }
  }

  private generateTileId(zoom: number, x: number, y: number): string {
    return `tile_${zoom}_${x}_${y}`;
  }

  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    if (this.db) {
      this.db.close();
    }
  }
}

export const mapTileCacheService = new MapTileCacheService();