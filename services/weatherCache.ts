interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

export class WeatherCache {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly maxSize = 100;
  private readonly defaultTTL = 600000; // 10 minutes
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };
  private warmupLocations: Set<string> = new Set();

  constructor() {
    this.loadFromLocalStorage();
    this.startCacheWarming();
    this.startCleanupInterval();
  }

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0
    };

    // Evict LRU if cache is full
    if (this.memoryCache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.memoryCache.set(key, entry);
    this.stats.size = this.memoryCache.size;
    this.saveToLocalStorage();
  }

  get<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data as T;
  }

  has(key: string): boolean {
    const entry = this.memoryCache.get(key);
    if (!entry) return false;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.memoryCache.delete(key);
      return false;
    }
    
    return true;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.memoryCache.clear();
      this.stats.evictions += this.stats.size;
      this.stats.size = 0;
    } else {
      const regex = new RegExp(pattern);
      const keysToDelete: string[] = [];
      
      this.memoryCache.forEach((_, key) => {
        if (regex.test(key)) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.memoryCache.delete(key);
        this.stats.evictions++;
      });
      
      this.stats.size = this.memoryCache.size;
    }
    
    this.saveToLocalStorage();
  }

  private evictLRU(): void {
    let lruKey: string | null = null;
    let minHits = Infinity;
    let oldestTime = Date.now();

    this.memoryCache.forEach((entry, key) => {
      const score = entry.hits * 1000 + (Date.now() - entry.timestamp);
      if (score < minHits * 1000 + (Date.now() - oldestTime)) {
        lruKey = key;
        minHits = entry.hits;
        oldestTime = entry.timestamp;
      }
    });

    if (lruKey) {
      this.memoryCache.delete(lruKey);
      this.stats.evictions++;
    }
  }

  addWarmupLocation(lat: number, lon: number): void {
    const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
    this.warmupLocations.add(key);
  }

  private startCacheWarming(): void {
    // Warm cache every 5 minutes for frequently accessed locations
    setInterval(() => {
      this.warmupLocations.forEach(location => {
        const [lat, lon] = location.split(',').map(Number);
        this.warmCache(lat, lon);
      });
    }, 300000);
  }

  private async warmCache(lat: number, lon: number): Promise<void> {
    const key = `weather:${lat.toFixed(2)},${lon.toFixed(2)}`;
    if (!this.has(key)) {
      // Trigger weather fetch in background
      window.dispatchEvent(new CustomEvent('warmCache', { detail: { lat, lon } }));
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];
      
      this.memoryCache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          keysToDelete.push(key);
        }
      });
      
      keysToDelete.forEach(key => {
        this.memoryCache.delete(key);
      });
      
      this.stats.size = this.memoryCache.size;
      if (keysToDelete.length > 0) {
        this.saveToLocalStorage();
      }
    }, 60000); // Clean up every minute
  }

  private loadFromLocalStorage(): void {
    try {
      const cached = localStorage.getItem('weatherCache');
      if (cached) {
        const data = JSON.parse(cached);
        const now = Date.now();
        
        Object.entries(data).forEach(([key, entry]: [string, any]) => {
          if (now - entry.timestamp <= entry.ttl) {
            this.memoryCache.set(key, entry);
          }
        });
        
        this.stats.size = this.memoryCache.size;
      }
    } catch (error) {
      console.error('Failed to load cache from localStorage:', error);
    }
  }

  private saveToLocalStorage(): void {
    try {
      const data: Record<string, CacheEntry<any>> = {};
      this.memoryCache.forEach((entry, key) => {
        data[key] = entry;
      });
      localStorage.setItem('weatherCache', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save cache to localStorage:', error);
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  getCacheInfo(): { entries: Array<{ key: string; age: number; hits: number }> } {
    const now = Date.now();
    const entries = Array.from(this.memoryCache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      hits: entry.hits
    }));
    
    return { entries };
  }
}

export const weatherCache = new WeatherCache();