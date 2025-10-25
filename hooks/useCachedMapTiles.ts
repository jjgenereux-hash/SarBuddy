import { useEffect, useCallback, useState } from 'react';
import { mapTileCacheService } from '@/services/mapTileCacheService';

interface CachedTileLoader {
  loadTile: (url: string, zoom: number, x: number, y: number) => Promise<string | null>;
  cacheStats: {
    totalSize: number;
    tileCount: number;
    offlineMode: boolean;
  } | null;
  isOffline: boolean;
  setOfflineMode: (enabled: boolean) => Promise<void>;
}

export function useCachedMapTiles(): CachedTileLoader {
  const [cacheStats, setCacheStats] = useState<CachedTileLoader['cacheStats']>(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Initialize cache service
    mapTileCacheService.init();
    
    // Load initial stats
    loadStats();

    // Update stats periodically
    const interval = setInterval(loadStats, 10000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadStats = async () => {
    const stats = await mapTileCacheService.getCacheStats();
    if (stats) {
      setCacheStats({
        totalSize: stats.totalSize,
        tileCount: stats.tileCount,
        offlineMode: stats.offlineMode
      });
      setIsOffline(stats.offlineMode);
    }
  };

  const loadTile = useCallback(async (
    url: string, 
    zoom: number, 
    x: number, 
    y: number
  ): Promise<string | null> => {
    try {
      // First, try to get from cache
      const cachedTile = await mapTileCacheService.getTile(url, zoom, x, y);
      
      if (cachedTile) {
        // Convert blob to URL for display
        return URL.createObjectURL(cachedTile);
      }

      // If offline mode, don't fetch new tiles
      if (isOffline) {
        return null;
      }

      // Fetch tile from network
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch tile: ${response.status}`);
      }

      const blob = await response.blob();
      
      // Cache the tile for future use
      await mapTileCacheService.cacheTile(url, blob, zoom, x, y);
      
      // Return URL for display
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error loading tile:', error);
      return null;
    }
  }, [isOffline]);

  const setOfflineMode = useCallback(async (enabled: boolean) => {
    await mapTileCacheService.setOfflineMode(enabled);
    setIsOffline(enabled);
    await loadStats();
  }, []);

  return {
    loadTile,
    cacheStats,
    isOffline,
    setOfflineMode
  };
}