import { supabase } from '@/lib/supabase';

export interface CDNEdge {
  region: string;
  url: string;
  distance?: number;
  healthy?: boolean;
  latency?: number;
}

export interface CDNConfig {
  primary: string;
  fallback: string;
  allEdges: CDNEdge[];
  timestamp: string;
}

export interface ReplicationResult {
  region: string;
  success: boolean;
  error?: string;
}

class CDNService {
  private currentEdge: string | null = null;
  private edgeConfig: CDNConfig | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private failoverStack: string[] = [];

  async initialize(latitude: number, longitude: number): Promise<CDNConfig> {
    try {
      const { data, error } = await supabase.functions.invoke('cdn-edge-router', {
        body: { latitude, longitude }
      });

      if (error) throw error;

      this.edgeConfig = data;
      this.currentEdge = data.primary;
      this.failoverStack = [data.primary, data.fallback];

      // Start health monitoring
      this.startHealthMonitoring();

      return data;
    } catch (error) {
      console.error('CDN initialization failed:', error);
      // Use default fallback
      return {
        primary: 'https://cdn-us-west.example.com',
        fallback: 'https://cdn-us-east.example.com',
        allEdges: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  async getTile(z: number, x: number, y: number, provider: string = 'osm'): Promise<Blob> {
    if (!this.currentEdge) {
      await this.initialize(0, 0); // Use default location if not initialized
    }

    let attempts = 0;
    const maxAttempts = this.failoverStack.length;

    while (attempts < maxAttempts) {
      try {
        const edge = this.failoverStack[attempts];
        const response = await fetch(
          `${edge}/tiles/${provider}/${z}/${x}/${y}.png`,
          { signal: AbortSignal.timeout(5000) }
        );

        if (response.ok) {
          const blob = await response.blob();
          // Update current edge if we had to failover
          if (attempts > 0) {
            this.currentEdge = edge;
            this.reorderFailoverStack(edge);
          }
          return blob;
        }
      } catch (error) {
        console.warn(`Edge ${this.failoverStack[attempts]} failed:`, error);
      }
      attempts++;
    }

    throw new Error('All CDN edges failed');
  }

  async replicateTiles(tileData: any, regions: string[]): Promise<ReplicationResult[]> {
    const { data, error } = await supabase.functions.invoke('cdn-edge-router', {
      body: { tileData, regions }
    });

    if (error) throw error;
    return data.results;
  }

  async checkEdgeHealth(): Promise<{ edges: CDNEdge[] }> {
    const { data, error } = await supabase.functions.invoke('cdn-edge-router', {
      body: {},
      headers: { 'X-Path': '/health-check' }
    });

    if (error) throw error;
    return data;
  }

  private startHealthMonitoring() {
    // Check health every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      try {
        const health = await this.checkEdgeHealth();
        this.updateFailoverStack(health.edges);
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 30000);
  }

  private updateFailoverStack(edges: CDNEdge[]) {
    const healthyEdges = edges
      .filter(e => e.healthy)
      .sort((a, b) => (a.distance || 0) - (b.distance || 0))
      .map(e => e.url);

    if (healthyEdges.length > 0) {
      this.failoverStack = healthyEdges;
      if (!healthyEdges.includes(this.currentEdge!)) {
        this.currentEdge = healthyEdges[0];
      }
    }
  }

  private reorderFailoverStack(successfulEdge: string) {
    const index = this.failoverStack.indexOf(successfulEdge);
    if (index > 0) {
      this.failoverStack.splice(index, 1);
      this.failoverStack.unshift(successfulEdge);
    }
  }

  async measureLatency(edgeUrl: string): Promise<number> {
    const start = performance.now();
    try {
      await fetch(`${edgeUrl}/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(3000)
      });
      return performance.now() - start;
    } catch {
      return Infinity;
    }
  }

  async optimizeRouting(): Promise<void> {
    if (!this.edgeConfig) return;

    const latencyTests = await Promise.all(
      this.edgeConfig.allEdges.map(async edge => ({
        ...edge,
        latency: await this.measureLatency(edge.url)
      }))
    );

    // Sort by latency and update failover stack
    const sortedByLatency = latencyTests
      .filter(e => e.latency < Infinity)
      .sort((a, b) => a.latency - b.latency);

    if (sortedByLatency.length > 0) {
      this.failoverStack = sortedByLatency.map(e => e.url);
      this.currentEdge = sortedByLatency[0].url;
    }
  }

  getCurrentEdge(): string | null {
    return this.currentEdge;
  }

  getFailoverStack(): string[] {
    return this.failoverStack;
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}

export const cdnService = new CDNService();