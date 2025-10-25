import mapboxgl from 'mapbox-gl';

/**
 * Calculate slope angle in degrees from elevation data
 */
export function calculateSlope(
  lat: number,
  lng: number,
  elevation: number,
  bounds: mapboxgl.LngLatBounds,
  resolution: number = 10
): number {
  // Simple slope calculation based on nearby points
  const deltaLat = 0.0001; // ~11 meters
  const deltaLng = 0.0001; // ~11 meters at equator
  
  // Calculate rise over run
  const run = deltaLat * 111320; // Convert to meters
  const rise = elevation * 0.1; // Simplified elevation difference
  
  // Calculate slope angle in degrees
  const slopeRadians = Math.atan(rise / run);
  const slopeDegrees = slopeRadians * (180 / Math.PI);
  
  return Math.abs(slopeDegrees);
}

/**
 * Calculate aspect (direction of slope) in degrees
 */
export function calculateAspect(
  lat: number,
  lng: number,
  elevationGrid: number[][]
): number {
  // Simplified aspect calculation
  // In a real implementation, this would use surrounding elevation points
  const dx = 1; // Placeholder for elevation difference in x direction
  const dy = 1; // Placeholder for elevation difference in y direction
  
  const aspect = Math.atan2(dy, dx) * (180 / Math.PI);
  return aspect < 0 ? aspect + 360 : aspect;
}

/**
 * Perform viewshed analysis to determine visible areas from a point
 */
export function calculateViewshed(
  viewerPoint: [number, number, number], // [lng, lat, elevation]
  targetArea: Array<[number, number]>,
  terrainData: any,
  maxDistance: number = 5000 // meters
): {
  visible: Array<[number, number]>;
  hidden: Array<[number, number]>;
} {
  const visible: Array<[number, number]> = [];
  const hidden: Array<[number, number]> = [];
  
  // Simplified viewshed calculation
  // In production, this would use ray casting with terrain intersection
  targetArea.forEach(point => {
    const distance = calculateDistance(
      viewerPoint[0], viewerPoint[1],
      point[0], point[1]
    );
    
    if (distance <= maxDistance) {
      // Simplified visibility check
      const isVisible = Math.random() > 0.3; // Placeholder
      if (isVisible) {
        visible.push(point);
      } else {
        hidden.push(point);
      }
    } else {
      hidden.push(point);
    }
  });
  
  return { visible, hidden };
}

/**
 * Calculate distance between two points in meters
 */
export function calculateDistance(
  lng1: number,
  lat1: number,
  lng2: number,
  lat2: number
): number {
  const R = 6371000; // Earth's radius in meters
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

/**
 * Analyze terrain for drone landing suitability
 */
export function analyzeLandingSuitability(
  location: [number, number],
  slope: number,
  elevation: number,
  terrainType?: string
): {
  suitable: boolean;
  score: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let score = 100;
  
  // Check slope
  if (slope > 15) {
    score -= 50;
    reasons.push(`Slope too steep: ${slope.toFixed(1)}°`);
  } else if (slope > 10) {
    score -= 20;
    reasons.push(`Moderate slope: ${slope.toFixed(1)}°`);
  }
  
  // Check elevation
  if (elevation > 3000) {
    score -= 30;
    reasons.push(`High altitude: ${elevation}m`);
  } else if (elevation > 2000) {
    score -= 10;
    reasons.push(`Moderate altitude: ${elevation}m`);
  }
  
  // Check terrain type if available
  if (terrainType === 'water') {
    score = 0;
    reasons.push('Water body - unsuitable for landing');
  } else if (terrainType === 'forest') {
    score -= 40;
    reasons.push('Dense vegetation may obstruct landing');
  }
  
  return {
    suitable: score >= 50,
    score: Math.max(0, score),
    reasons
  };
}

/**
 * Generate elevation profile along a path
 */
export function generateElevationProfile(
  path: Array<[number, number]>,
  queryElevation: (lngLat: [number, number]) => number | null
): {
  distances: number[];
  elevations: number[];
  totalDistance: number;
  maxElevation: number;
  minElevation: number;
  totalAscent: number;
  totalDescent: number;
} {
  const distances: number[] = [0];
  const elevations: number[] = [];
  let totalDistance = 0;
  let totalAscent = 0;
  let totalDescent = 0;
  
  // Get elevations along path
  path.forEach((point, index) => {
    const elevation = queryElevation(point);
    if (elevation !== null) {
      elevations.push(elevation);
      
      if (index > 0) {
        // Calculate distance from previous point
        const dist = calculateDistance(
          path[index - 1][0],
          path[index - 1][1],
          point[0],
          point[1]
        );
        totalDistance += dist;
        distances.push(totalDistance);
        
        // Calculate ascent/descent
        const elevDiff = elevation - elevations[index - 1];
        if (elevDiff > 0) {
          totalAscent += elevDiff;
        } else {
          totalDescent += Math.abs(elevDiff);
        }
      }
    }
  });
  
  return {
    distances,
    elevations,
    totalDistance,
    maxElevation: Math.max(...elevations),
    minElevation: Math.min(...elevations),
    totalAscent,
    totalDescent
  };
}

/**
 * Calculate optimal flight altitude based on terrain
 */
export function calculateOptimalFlightAltitude(
  terrainProfile: number[],
  minClearance: number = 100, // meters
  maxAltitude: number = 400 // meters (FAA limit)
): number {
  const maxTerrainHeight = Math.max(...terrainProfile);
  const optimalAltitude = maxTerrainHeight + minClearance;
  
  return Math.min(optimalAltitude, maxAltitude);
}

/**
 * Identify terrain hazards for drone operations
 */
export function identifyTerrainHazards(
  area: Array<[number, number]>,
  elevationData: number[][],
  weatherConditions?: any
): {
  hazards: Array<{
    type: string;
    location: [number, number];
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
} {
  const hazards: any[] = [];
  
  // Placeholder for hazard detection
  // In production, this would analyze:
  // - Steep slopes
  // - Cliffs
  // - Power lines (from map data)
  // - No-fly zones
  // - Weather-related hazards
  
  return { hazards };
}