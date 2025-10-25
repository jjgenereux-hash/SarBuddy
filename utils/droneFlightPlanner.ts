// Drone flight planning utilities
export interface Waypoint {
  sequence: number;
  lat: number;
  lng: number;
  altitude: number;
  hover: number;
  action?: string;
}

export interface FlightPlan {
  id: string;
  droneId: string;
  waypoints: Waypoint[];
  estimatedDuration: number;
  totalDistance: number;
  coverageArea: number;
}

export class DroneFlightPlanner {
  // Generate grid search pattern
  static generateGridPattern(
    center: { lat: number; lng: number },
    width: number,
    height: number,
    spacing: number = 50
  ): Waypoint[] {
    const waypoints: Waypoint[] = [];
    const rows = Math.ceil(height / spacing);
    const cols = Math.ceil(width / spacing);
    let sequence = 1;

    for (let i = 0; i < rows; i++) {
      const rowWaypoints: Waypoint[] = [];
      
      for (let j = 0; j < cols; j++) {
        const lat = center.lat + ((i - rows / 2) * spacing) / 111111;
        const lng = center.lng + ((j - cols / 2) * spacing) / (111111 * Math.cos(center.lat * Math.PI / 180));
        
        rowWaypoints.push({
          sequence: sequence++,
          lat,
          lng,
          altitude: 100,
          hover: 2,
          action: 'photo'
        });
      }
      
      // Alternate row direction for efficiency
      if (i % 2 === 1) rowWaypoints.reverse();
      waypoints.push(...rowWaypoints);
    }

    return waypoints;
  }

  // Generate spiral search pattern
  static generateSpiralPattern(
    center: { lat: number; lng: number },
    maxRadius: number,
    spacing: number = 30
  ): Waypoint[] {
    const waypoints: Waypoint[] = [];
    const spirals = Math.ceil(maxRadius / spacing);
    let sequence = 1;
    
    for (let i = 0; i <= spirals; i++) {
      const pointsInSpiral = Math.max(8, i * 8);
      
      for (let j = 0; j < pointsInSpiral; j++) {
        const angle = (j / pointsInSpiral) * 2 * Math.PI;
        const radius = (i * spacing) / 111111;
        
        waypoints.push({
          sequence: sequence++,
          lat: center.lat + Math.cos(angle) * radius,
          lng: center.lng + Math.sin(angle) * radius / Math.cos(center.lat * Math.PI / 180),
          altitude: 100 + i * 5,
          hover: i === 0 && j === 0 ? 5 : 1,
          action: 'scan'
        });
      }
    }

    return waypoints;
  }

  // Calculate flight statistics
  static calculateFlightStats(waypoints: Waypoint[]): {
    distance: number;
    duration: number;
    coverage: number;
  } {
    let distance = 0;
    let duration = 0;
    
    for (let i = 1; i < waypoints.length; i++) {
      const d = this.calculateDistance(
        waypoints[i - 1].lat,
        waypoints[i - 1].lng,
        waypoints[i].lat,
        waypoints[i].lng
      );
      distance += d;
      duration += d / 10 + waypoints[i].hover; // 10 m/s average speed
    }

    // Estimate coverage area (simplified)
    const coverage = distance * 100; // 100m swath width

    return {
      distance: Math.round(distance),
      duration: Math.round(duration / 60), // Convert to minutes
      coverage: Math.round(coverage / 10000) // Convert to hectares
    };
  }

  // Calculate distance between two points
  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Optimize waypoints for battery efficiency
  static optimizeForBattery(
    waypoints: Waypoint[],
    batteryLevel: number
  ): Waypoint[] {
    const maxWaypoints = Math.floor((batteryLevel / 100) * waypoints.length);
    return waypoints.slice(0, maxWaypoints);
  }
}