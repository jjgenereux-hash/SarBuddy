import { supabase } from '@/lib/supabase';

export interface TerrainPoint {
  lat: number;
  lng: number;
  elevation: number;
}

export interface ViewshedResult {
  visible: TerrainPoint[];
  hidden: TerrainPoint[];
  viewRadius: number;
  observerHeight: number;
}

export interface WatershedResult {
  flowPaths: TerrainPoint[][];
  catchmentAreas: { id: string; points: TerrainPoint[]; area: number }[];
  drainagePoints: TerrainPoint[];
}

export interface PathResult {
  path: TerrainPoint[];
  distance: number;
  elevationGain: number;
  difficulty: 'easy' | 'moderate' | 'difficult' | 'extreme';
  hazards: HazardPoint[];
}

export interface HazardPoint {
  location: TerrainPoint;
  type: 'steep_slope' | 'cliff' | 'water' | 'vegetation' | 'power_line' | 'building';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export class TerrainAnalyzer {
  private elevationCache: Map<string, number> = new Map();

  async getElevation(lat: number, lng: number): Promise<number> {
    const key = `${lat},${lng}`;
    if (this.elevationCache.has(key)) {
      return this.elevationCache.get(key)!;
    }
    
    // Simulate elevation based on coordinates
    const elevation = 100 + Math.sin(lat * 10) * 50 + Math.cos(lng * 10) * 30;
    this.elevationCache.set(key, elevation);
    return elevation;
  }

  async calculateViewshed(
    observer: TerrainPoint,
    radius: number = 5000,
    observerHeight: number = 2
  ): Promise<ViewshedResult> {
    const visible: TerrainPoint[] = [];
    const hidden: TerrainPoint[] = [];
    const samples = 36; // Sample points in each direction
    
    for (let angle = 0; angle < 360; angle += 10) {
      for (let dist = 100; dist <= radius; dist += 100) {
        const lat = observer.lat + (dist / 111000) * Math.cos(angle * Math.PI / 180);
        const lng = observer.lng + (dist / 111000) * Math.sin(angle * Math.PI / 180);
        const elevation = await this.getElevation(lat, lng);
        
        const point: TerrainPoint = { lat, lng, elevation };
        
        if (this.isVisible(observer, point, observerHeight)) {
          visible.push(point);
        } else {
          hidden.push(point);
        }
      }
    }
    
    return { visible, hidden, viewRadius: radius, observerHeight };
  }

  private isVisible(observer: TerrainPoint, target: TerrainPoint, observerHeight: number): boolean {
    const distance = this.calculateDistance(observer, target);
    const elevDiff = target.elevation - (observer.elevation + observerHeight);
    const angle = Math.atan2(elevDiff, distance);
    return angle < Math.PI / 6; // 30 degree threshold
  }

  async calculateWatershed(bounds: { north: number; south: number; east: number; west: number }): Promise<WatershedResult> {
    const flowPaths: TerrainPoint[][] = [];
    const catchmentAreas: { id: string; points: TerrainPoint[]; area: number }[] = [];
    const drainagePoints: TerrainPoint[] = [];
    
    // Grid sampling for watershed analysis
    const latStep = (bounds.north - bounds.south) / 20;
    const lngStep = (bounds.east - bounds.west) / 20;
    
    for (let lat = bounds.south; lat < bounds.north; lat += latStep) {
      for (let lng = bounds.west; lng < bounds.east; lng += lngStep) {
        const elevation = await this.getElevation(lat, lng);
        const point: TerrainPoint = { lat, lng, elevation };
        
        // Find flow direction
        const flowPath = await this.traceFlowPath(point);
        if (flowPath.length > 1) {
          flowPaths.push(flowPath);
        }
        
        // Identify drainage points
        if (elevation < 50) {
          drainagePoints.push(point);
        }
      }
    }
    
    // Group into catchment areas
    const catchment = {
      id: 'main',
      points: drainagePoints,
      area: this.calculateArea(drainagePoints)
    };
    catchmentAreas.push(catchment);
    
    return { flowPaths, catchmentAreas, drainagePoints };
  }

  private async traceFlowPath(start: TerrainPoint): Promise<TerrainPoint[]> {
    const path: TerrainPoint[] = [start];
    let current = start;
    
    for (let i = 0; i < 10; i++) {
      const next = await this.findLowestNeighbor(current);
      if (!next || next.elevation >= current.elevation) break;
      path.push(next);
      current = next;
    }
    
    return path;
  }

  private async findLowestNeighbor(point: TerrainPoint): Promise<TerrainPoint | null> {
    let lowest: TerrainPoint | null = null;
    const step = 0.0001;
    
    for (const [dlat, dlng] of [[step, 0], [-step, 0], [0, step], [0, -step]]) {
      const lat = point.lat + dlat;
      const lng = point.lng + dlng;
      const elevation = await this.getElevation(lat, lng);
      
      if (!lowest || elevation < lowest.elevation) {
        lowest = { lat, lng, elevation };
      }
    }
    
    return lowest;
  }

  async findOptimalPath(start: TerrainPoint, end: TerrainPoint, maxSlope: number = 15): Promise<PathResult> {
    const path = await this.aStar(start, end, maxSlope);
    const distance = this.calculatePathDistance(path);
    const elevationGain = this.calculateElevationGain(path);
    const difficulty = this.assessDifficulty(elevationGain, distance);
    const hazards = await this.identifyPathHazards(path);
    
    return { path, distance, elevationGain, difficulty, hazards };
  }

  private async aStar(start: TerrainPoint, end: TerrainPoint, maxSlope: number): Promise<TerrainPoint[]> {
    // Simplified A* pathfinding
    const path: TerrainPoint[] = [start];
    const steps = 20;
    
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const lat = start.lat + (end.lat - start.lat) * t;
      const lng = start.lng + (end.lng - start.lng) * t;
      const elevation = await this.getElevation(lat, lng);
      path.push({ lat, lng, elevation });
    }
    
    path.push(end);
    return path;
  }

  async identifyHazards(bounds: { north: number; south: number; east: number; west: number }): Promise<HazardPoint[]> {
    const hazards: HazardPoint[] = [];
    const gridSize = 20;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = bounds.south + (bounds.north - bounds.south) * i / gridSize;
        const lng = bounds.west + (bounds.east - bounds.west) * j / gridSize;
        const elevation = await this.getElevation(lat, lng);
        
        const slope = await this.calculateSlope(lat, lng);
        
        if (slope > 30) {
          hazards.push({
            location: { lat, lng, elevation },
            type: slope > 45 ? 'cliff' : 'steep_slope',
            severity: slope > 45 ? 'critical' : 'high',
            description: `Slope: ${slope.toFixed(1)}°`
          });
        }
      }
    }
    
    return hazards;
  }

  private async calculateSlope(lat: number, lng: number): Promise<number> {
    const step = 0.0001;
    const center = await this.getElevation(lat, lng);
    const north = await this.getElevation(lat + step, lng);
    const east = await this.getElevation(lat, lng + step);
    
    const dz_dx = (east - center) / (step * 111000);
    const dz_dy = (north - center) / (step * 111000);
    
    const slope = Math.atan(Math.sqrt(dz_dx * dz_dx + dz_dy * dz_dy)) * 180 / Math.PI;
    return slope;
  }

  private calculateDistance(p1: TerrainPoint, p2: TerrainPoint): number {
    const R = 6371000;
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculatePathDistance(path: TerrainPoint[]): number {
    let distance = 0;
    for (let i = 1; i < path.length; i++) {
      distance += this.calculateDistance(path[i-1], path[i]);
    }
    return distance;
  }

  private calculateElevationGain(path: TerrainPoint[]): number {
    let gain = 0;
    for (let i = 1; i < path.length; i++) {
      const diff = path[i].elevation - path[i-1].elevation;
      if (diff > 0) gain += diff;
    }
    return gain;
  }

  private assessDifficulty(elevationGain: number, distance: number): 'easy' | 'moderate' | 'difficult' | 'extreme' {
    const grade = (elevationGain / distance) * 100;
    if (grade < 5) return 'easy';
    if (grade < 10) return 'moderate';
    if (grade < 15) return 'difficult';
    return 'extreme';
  }

  private async identifyPathHazards(path: TerrainPoint[]): Promise<HazardPoint[]> {
    const hazards: HazardPoint[] = [];
    
    for (let i = 1; i < path.length; i++) {
      const slope = await this.calculateSlope(path[i].lat, path[i].lng);
      
      if (slope > 20) {
        hazards.push({
          location: path[i],
          type: 'steep_slope',
          severity: slope > 30 ? 'high' : 'medium',
          description: `Steep section: ${slope.toFixed(1)}°`
        });
      }
    }
    
    return hazards;
  }

  private calculateArea(points: TerrainPoint[]): number {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].lng * points[j].lat;
      area -= points[j].lng * points[i].lat;
    }
    
    return Math.abs(area / 2) * 111000 * 111000;
  }
}

export const terrainAnalyzer = new TerrainAnalyzer();