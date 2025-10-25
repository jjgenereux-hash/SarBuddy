// Mission optimization utilities
export interface Waypoint {
  id: string;
  latitude: number;
  longitude: number;
  altitude: number;
  action: 'flyover' | 'hover' | 'photo' | 'scan';
  hoverDuration?: number;
  sequence: number;
}

export interface SearchArea {
  id: string;
  name: string;
  coordinates: [number, number][];
  pattern: 'grid' | 'spiral' | 'expanding-square' | 'parallel';
  lineSpacing: number;
  altitude: number;
  overlap: number;
}

export interface NoFlyZone {
  id: string;
  name: string;
  type: 'airport' | 'military' | 'restricted' | 'temporary';
  coordinates: [number, number][];
  minAltitude?: number;
  maxAltitude?: number;
  restrictionLevel: 'prohibited' | 'restricted' | 'warning';
}

export interface TerrainData {
  elevation: number;
  obstacles: Array<{
    type: string;
    height: number;
    position: [number, number];
  }>;
  vegetation: 'none' | 'low' | 'medium' | 'high';
  difficulty: number;
}

// Calculate distance between two points
export const calculateDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Optimize waypoint sequence using nearest neighbor algorithm
export const optimizeWaypointSequence = (waypoints: Waypoint[]): Waypoint[] => {
  if (waypoints.length <= 2) return waypoints;
  
  const optimized: Waypoint[] = [waypoints[0]];
  const remaining = [...waypoints.slice(1)];
  
  while (remaining.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearestIdx = 0;
    let minDistance = Infinity;
    
    remaining.forEach((wp, idx) => {
      const dist = calculateDistance(
        current.latitude, current.longitude,
        wp.latitude, wp.longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        nearestIdx = idx;
      }
    });
    
    optimized.push(remaining[nearestIdx]);
    remaining.splice(nearestIdx, 1);
  }
  
  return optimized.map((wp, idx) => ({ ...wp, sequence: idx + 1 }));
};

// Generate search pattern waypoints
export const generateSearchPattern = (
  area: SearchArea,
  droneSpeed: number = 10 // m/s
): Waypoint[] => {
  const waypoints: Waypoint[] = [];
  const bounds = getBounds(area.coordinates);
  
  switch (area.pattern) {
    case 'grid':
      return generateGridPattern(bounds, area);
    case 'spiral':
      return generateSpiralPattern(bounds, area);
    case 'expanding-square':
      return generateExpandingSquarePattern(bounds, area);
    case 'parallel':
      return generateParallelPattern(bounds, area);
    default:
      return waypoints;
  }
};

// Get bounding box of coordinates
const getBounds = (coords: [number, number][]) => {
  const lats = coords.map(c => c[0]);
  const lons = coords.map(c => c[1]);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons)
  };
};

// Generate grid search pattern
const generateGridPattern = (bounds: any, area: SearchArea): Waypoint[] => {
  const waypoints: Waypoint[] = [];
  const latSpacing = area.lineSpacing / 111000; // Convert meters to degrees
  const lonSpacing = area.lineSpacing / (111000 * Math.cos(bounds.minLat * Math.PI / 180));
  
  let sequence = 1;
  let direction = 1;
  
  for (let lat = bounds.minLat; lat <= bounds.maxLat; lat += latSpacing) {
    if (direction === 1) {
      for (let lon = bounds.minLon; lon <= bounds.maxLon; lon += lonSpacing) {
        waypoints.push({
          id: `wp-${sequence}`,
          latitude: lat,
          longitude: lon,
          altitude: area.altitude,
          action: 'scan',
          sequence: sequence++
        });
      }
    } else {
      for (let lon = bounds.maxLon; lon >= bounds.minLon; lon -= lonSpacing) {
        waypoints.push({
          id: `wp-${sequence}`,
          latitude: lat,
          longitude: lon,
          altitude: area.altitude,
          action: 'scan',
          sequence: sequence++
        });
      }
    }
    direction *= -1;
  }
  
  return waypoints;
};

// Generate spiral search pattern
const generateSpiralPattern = (bounds: any, area: SearchArea): Waypoint[] => {
  const waypoints: Waypoint[] = [];
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  const maxRadius = Math.max(
    bounds.maxLat - bounds.minLat,
    bounds.maxLon - bounds.minLon
  ) / 2;
  
  let sequence = 1;
  const spiralSpacing = area.lineSpacing / 111000;
  const angleStep = Math.PI / 8;
  
  for (let r = 0; r <= maxRadius; r += spiralSpacing) {
    for (let angle = 0; angle < 2 * Math.PI; angle += angleStep) {
      waypoints.push({
        id: `wp-${sequence}`,
        latitude: centerLat + r * Math.sin(angle),
        longitude: centerLon + r * Math.cos(angle),
        altitude: area.altitude,
        action: 'scan',
        sequence: sequence++
      });
    }
  }
  
  return waypoints;
};

// Generate expanding square pattern
const generateExpandingSquarePattern = (bounds: any, area: SearchArea): Waypoint[] => {
  const waypoints: Waypoint[] = [];
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const centerLon = (bounds.minLon + bounds.maxLon) / 2;
  
  let sequence = 1;
  const spacing = area.lineSpacing / 111000;
  const maxSize = Math.max(
    bounds.maxLat - bounds.minLat,
    bounds.maxLon - bounds.minLon
  );
  
  waypoints.push({
    id: `wp-${sequence}`,
    latitude: centerLat,
    longitude: centerLon,
    altitude: area.altitude,
    action: 'scan',
    sequence: sequence++
  });
  
  for (let size = spacing; size <= maxSize / 2; size += spacing) {
    // Top edge
    for (let lon = centerLon - size; lon <= centerLon + size; lon += spacing) {
      waypoints.push({
        id: `wp-${sequence}`,
        latitude: centerLat + size,
        longitude: lon,
        altitude: area.altitude,
        action: 'scan',
        sequence: sequence++
      });
    }
    // Right edge
    for (let lat = centerLat + size; lat >= centerLat - size; lat -= spacing) {
      waypoints.push({
        id: `wp-${sequence}`,
        latitude: lat,
        longitude: centerLon + size,
        altitude: area.altitude,
        action: 'scan',
        sequence: sequence++
      });
    }
    // Bottom edge
    for (let lon = centerLon + size; lon >= centerLon - size; lon -= spacing) {
      waypoints.push({
        id: `wp-${sequence}`,
        latitude: centerLat - size,
        longitude: lon,
        altitude: area.altitude,
        action: 'scan',
        sequence: sequence++
      });
    }
    // Left edge
    for (let lat = centerLat - size; lat <= centerLat + size; lat += spacing) {
      waypoints.push({
        id: `wp-${sequence}`,
        latitude: lat,
        longitude: centerLon - size,
        altitude: area.altitude,
        action: 'scan',
        sequence: sequence++
      });
    }
  }
  
  return waypoints;
};

// Generate parallel line pattern
const generateParallelPattern = (bounds: any, area: SearchArea): Waypoint[] => {
  const waypoints: Waypoint[] = [];
  const lonSpacing = area.lineSpacing / (111000 * Math.cos(bounds.minLat * Math.PI / 180));
  
  let sequence = 1;
  
  for (let lon = bounds.minLon; lon <= bounds.maxLon; lon += lonSpacing) {
    waypoints.push({
      id: `wp-${sequence}`,
      latitude: bounds.minLat,
      longitude: lon,
      altitude: area.altitude,
      action: 'scan',
      sequence: sequence++
    });
    waypoints.push({
      id: `wp-${sequence}`,
      latitude: bounds.maxLat,
      longitude: lon,
      altitude: area.altitude,
      action: 'scan',
      sequence: sequence++
    });
  }
  
  return waypoints;
};

// Check if path intersects no-fly zone
export const checkNoFlyZoneConflicts = (
  waypoints: Waypoint[],
  noFlyZones: NoFlyZone[]
): Array<{ waypoint: Waypoint; zone: NoFlyZone }> => {
  const conflicts: Array<{ waypoint: Waypoint; zone: NoFlyZone }> = [];
  
  waypoints.forEach(wp => {
    noFlyZones.forEach(zone => {
      if (isPointInPolygon([wp.latitude, wp.longitude], zone.coordinates)) {
        if (zone.minAltitude && wp.altitude >= zone.minAltitude) return;
        if (zone.maxAltitude && wp.altitude <= zone.maxAltitude) return;
        conflicts.push({ waypoint: wp, zone });
      }
    });
  });
  
  return conflicts;
};

// Check if point is inside polygon
const isPointInPolygon = (point: [number, number], polygon: [number, number][]): boolean => {
  let inside = false;
  const [x, y] = point;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  
  return inside;
};

// Calculate mission statistics
export const calculateMissionStats = (
  waypoints: Waypoint[],
  droneSpeed: number = 10, // m/s
  batteryCapacity: number = 100 // percentage
) => {
  let totalDistance = 0;
  let totalTime = 0;
  
  for (let i = 1; i < waypoints.length; i++) {
    const dist = calculateDistance(
      waypoints[i - 1].latitude, waypoints[i - 1].longitude,
      waypoints[i].latitude, waypoints[i].longitude
    );
    totalDistance += dist;
    totalTime += (dist * 1000) / droneSpeed; // Convert km to m
    
    if (waypoints[i].action === 'hover' && waypoints[i].hoverDuration) {
      totalTime += waypoints[i].hoverDuration;
    }
  }
  
  // Estimate battery usage (simplified model)
  const batteryPerMinute = 2; // 2% per minute
  const estimatedBattery = (totalTime / 60) * batteryPerMinute;
  
  return {
    totalDistance: totalDistance.toFixed(2),
    totalTime: Math.ceil(totalTime / 60), // minutes
    estimatedBattery: Math.min(100, Math.ceil(estimatedBattery)),
    averageSpeed: ((totalDistance * 1000) / totalTime).toFixed(1),
    waypointCount: waypoints.length,
    canComplete: estimatedBattery <= batteryCapacity
  };
};