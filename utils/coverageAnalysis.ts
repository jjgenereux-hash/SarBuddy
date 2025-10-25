import { supabase } from '@/lib/supabase';

export interface CoverageZone {
  lat: number;
  lng: number;
  intensity: number; // 0-1 representing search intensity
  timeSpent: number; // seconds
  teamCount: number;
  lastVisited: Date;
}

export interface SearchGap {
  center: { lat: number; lng: number };
  radius: number; // meters
  priority: 'high' | 'medium' | 'low';
  estimatedArea: number; // square meters
}

export interface TeamOverlap {
  zone: { lat: number; lng: number };
  teams: string[];
  overlapDuration: number; // seconds
  efficiency: number; // 0-1 score
}

export class CoverageAnalyzer {
  private gridSize = 0.001; // ~111 meters per grid cell

  async analyzeCoverage(missionId: string, timeRange?: { start: Date; end: Date }) {
    // Fetch all GPS breadcrumbs for the mission
    const query = supabase
      .from('gps_breadcrumbs')
      .select(`
        *,
        gps_locations!inner(
          team_id,
          timestamp,
          teams!inner(name, color)
        )
      `)
      .eq('gps_locations.teams.mission_id', missionId);

    if (timeRange) {
      query
        .gte('timestamp', timeRange.start.toISOString())
        .lte('timestamp', timeRange.end.toISOString());
    }

    const { data: breadcrumbs } = await query;
    
    return this.processBreakcrumbs(breadcrumbs || []);
  }

  private processBreakcrumbs(breadcrumbs: any[]): {
    heatmap: CoverageZone[];
    gaps: SearchGap[];
    overlaps: TeamOverlap[];
    statistics: any;
  } {
    const grid = new Map<string, CoverageZone>();
    const teamPresence = new Map<string, Set<string>>();

    // Process breadcrumbs into grid
    breadcrumbs.forEach(crumb => {
      const key = this.getGridKey(crumb.latitude, crumb.longitude);
      const existing = grid.get(key) || {
        lat: this.snapToGrid(crumb.latitude),
        lng: this.snapToGrid(crumb.longitude),
        intensity: 0,
        timeSpent: 0,
        teamCount: 0,
        lastVisited: new Date(crumb.timestamp)
      };

      existing.intensity = Math.min(1, existing.intensity + 0.1);
      existing.timeSpent += 30; // Assume 30s between breadcrumbs
      
      // Track unique teams
      if (!teamPresence.has(key)) {
        teamPresence.set(key, new Set());
      }
      teamPresence.get(key)!.add(crumb.gps_locations.team_id);
      existing.teamCount = teamPresence.get(key)!.size;

      grid.set(key, existing);
    });

    const heatmap = Array.from(grid.values());
    const gaps = this.findSearchGaps(heatmap);
    const overlaps = this.findTeamOverlaps(teamPresence, grid);
    const statistics = this.calculateStatistics(heatmap, gaps, overlaps);

    return { heatmap, gaps, overlaps, statistics };
  }

  private getGridKey(lat: number, lng: number): string {
    const gridLat = this.snapToGrid(lat);
    const gridLng = this.snapToGrid(lng);
    return `${gridLat},${gridLng}`;
  }

  private snapToGrid(coord: number): number {
    return Math.round(coord / this.gridSize) * this.gridSize;
  }

  private findSearchGaps(heatmap: CoverageZone[]): SearchGap[] {
    const gaps: SearchGap[] = [];
    const searchedPoints = new Set(
      heatmap.map(zone => `${zone.lat},${zone.lng}`)
    );

    // Find bounding box
    const lats = heatmap.map(z => z.lat);
    const lngs = heatmap.map(z => z.lng);
    const minLat = Math.min(...lats) - this.gridSize * 5;
    const maxLat = Math.max(...lats) + this.gridSize * 5;
    const minLng = Math.min(...lngs) - this.gridSize * 5;
    const maxLng = Math.max(...lngs) + this.gridSize * 5;

    // Check for gaps in the search area
    for (let lat = minLat; lat <= maxLat; lat += this.gridSize) {
      for (let lng = minLng; lng <= maxLng; lng += this.gridSize) {
        const key = `${this.snapToGrid(lat)},${this.snapToGrid(lng)}`;
        if (!searchedPoints.has(key)) {
          // Check if this gap is near searched areas
          const nearbySearched = this.countNearbySearched(
            lat, lng, heatmap, this.gridSize * 3
          );
          
          if (nearbySearched > 2) {
            gaps.push({
              center: { lat, lng },
              radius: 111, // ~111 meters
              priority: nearbySearched > 4 ? 'high' : 'medium',
              estimatedArea: Math.PI * 111 * 111
            });
          }
        }
      }
    }

    return this.mergeNearbyGaps(gaps);
  }

  private countNearbySearched(
    lat: number, 
    lng: number, 
    heatmap: CoverageZone[], 
    radius: number
  ): number {
    return heatmap.filter(zone => {
      const dist = this.haversineDistance(lat, lng, zone.lat, zone.lng);
      return dist <= radius;
    }).length;
  }

  private haversineDistance(
    lat1: number, lng1: number, 
    lat2: number, lng2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }

  private mergeNearbyGaps(gaps: SearchGap[]): SearchGap[] {
    const merged: SearchGap[] = [];
    const used = new Set<number>();

    gaps.forEach((gap, i) => {
      if (used.has(i)) return;

      const cluster = [gap];
      used.add(i);

      gaps.forEach((other, j) => {
        if (i !== j && !used.has(j)) {
          const dist = this.haversineDistance(
            gap.center.lat, gap.center.lng,
            other.center.lat, other.center.lng
          );
          if (dist < 200) { // Merge gaps within 200m
            cluster.push(other);
            used.add(j);
          }
        }
      });

      // Calculate merged gap
      const avgLat = cluster.reduce((sum, g) => sum + g.center.lat, 0) / cluster.length;
      const avgLng = cluster.reduce((sum, g) => sum + g.center.lng, 0) / cluster.length;
      const totalArea = cluster.reduce((sum, g) => sum + g.estimatedArea, 0);

      merged.push({
        center: { lat: avgLat, lng: avgLng },
        radius: Math.sqrt(totalArea / Math.PI),
        priority: cluster.some(g => g.priority === 'high') ? 'high' : 
                 cluster.some(g => g.priority === 'medium') ? 'medium' : 'low',
        estimatedArea: totalArea
      });
    });

    return merged;
  }

  private findTeamOverlaps(
    teamPresence: Map<string, Set<string>>, 
    grid: Map<string, CoverageZone>
  ): TeamOverlap[] {
    const overlaps: TeamOverlap[] = [];

    teamPresence.forEach((teams, key) => {
      if (teams.size > 1) {
        const zone = grid.get(key)!;
        overlaps.push({
          zone: { lat: zone.lat, lng: zone.lng },
          teams: Array.from(teams),
          overlapDuration: zone.timeSpent / teams.size,
          efficiency: 1 / teams.size // Lower efficiency with more overlap
        });
      }
    });

    return overlaps;
  }

  private calculateStatistics(
    heatmap: CoverageZone[], 
    gaps: SearchGap[], 
    overlaps: TeamOverlap[]
  ) {
    const totalArea = heatmap.length * Math.PI * 111 * 111; // Approximate
    const gapArea = gaps.reduce((sum, gap) => sum + gap.estimatedArea, 0);
    const coveragePercent = ((totalArea - gapArea) / totalArea) * 100;
    
    const avgIntensity = heatmap.reduce((sum, z) => sum + z.intensity, 0) / heatmap.length;
    const totalTimeSpent = heatmap.reduce((sum, z) => sum + z.timeSpent, 0);
    const overlapPercent = (overlaps.length / heatmap.length) * 100;

    return {
      totalAreaSearched: totalArea,
      gapArea,
      coveragePercent,
      avgIntensity,
      totalTimeSpent,
      overlapPercent,
      highPriorityGaps: gaps.filter(g => g.priority === 'high').length,
      mediumPriorityGaps: gaps.filter(g => g.priority === 'medium').length,
      lowPriorityGaps: gaps.filter(g => g.priority === 'low').length
    };
  }

  async getHistoricalPatterns(area: { lat: number; lng: number; radius: number }) {
    // Analyze historical search patterns in the area
    const { data: historicalSearches } = await supabase
      .from('missions')
      .select('*')
      .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

    // Process and return pattern insights
    return {
      commonStartPoints: [],
      averageSearchDuration: 0,
      successRate: 0,
      optimalTeamSize: 0,
      bestTimeOfDay: '',
      weatherPatterns: []
    };
  }
}