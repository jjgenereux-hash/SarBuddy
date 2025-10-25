// Terrain generation utilities for 3D visualization
export interface TerrainPoint {
  x: number;
  y: number;
  elevation: number;
}

export interface TerrainData {
  width: number;
  height: number;
  points: TerrainPoint[];
  minElevation: number;
  maxElevation: number;
}

// Generate realistic terrain data using Perlin noise approximation
export function generateTerrain(
  width: number,
  height: number,
  resolution: number = 50
): TerrainData {
  const points: TerrainPoint[] = [];
  let minElevation = Infinity;
  let maxElevation = -Infinity;

  // Simple noise function for terrain generation
  const noise = (x: number, y: number): number => {
    const scale1 = 0.05;
    const scale2 = 0.1;
    const scale3 = 0.2;
    
    // Multi-octave noise for realistic terrain
    const noise1 = Math.sin(x * scale1) * Math.cos(y * scale1) * 100;
    const noise2 = Math.sin(x * scale2) * Math.cos(y * scale2) * 50;
    const noise3 = Math.sin(x * scale3) * Math.cos(y * scale3) * 25;
    
    // Add some randomness
    const random = (Math.sin(x * 12.9898 + y * 78.233) * 43758.5453) % 1;
    
    return noise1 + noise2 + noise3 + random * 20;
  };

  // Generate terrain points
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = (i / resolution) * width;
      const y = (j / resolution) * height;
      const elevation = noise(x, y) + 200; // Base elevation of 200m
      
      points.push({ x, y, elevation });
      
      minElevation = Math.min(minElevation, elevation);
      maxElevation = Math.max(maxElevation, elevation);
    }
  }

  return {
    width,
    height,
    points,
    minElevation,
    maxElevation
  };
}

// Get elevation at a specific point using bilinear interpolation
export function getElevationAt(
  terrain: TerrainData,
  x: number,
  y: number,
  resolution: number = 50
): number {
  // Normalize coordinates
  const nx = (x / terrain.width) * resolution;
  const ny = (y / terrain.height) * resolution;
  
  // Get grid indices
  const x0 = Math.floor(nx);
  const x1 = Math.min(x0 + 1, resolution);
  const y0 = Math.floor(ny);
  const y1 = Math.min(y0 + 1, resolution);
  
  // Get fractional parts
  const fx = nx - x0;
  const fy = ny - y0;
  
  // Get corner elevations
  const getPoint = (xi: number, yi: number) => {
    const index = yi * (resolution + 1) + xi;
    return terrain.points[index]?.elevation || 200;
  };
  
  const e00 = getPoint(x0, y0);
  const e10 = getPoint(x1, y0);
  const e01 = getPoint(x0, y1);
  const e11 = getPoint(x1, y1);
  
  // Bilinear interpolation
  const e0 = e00 * (1 - fx) + e10 * fx;
  const e1 = e01 * (1 - fx) + e11 * fx;
  
  return e0 * (1 - fy) + e1 * fy;
}

// Generate elevation profile along a path
export function getElevationProfile(
  terrain: TerrainData,
  path: Array<{ x: number; y: number }>,
  samples: number = 100
): Array<{ distance: number; elevation: number }> {
  const profile: Array<{ distance: number; elevation: number }> = [];
  let totalDistance = 0;
  
  // Calculate total path distance
  const distances: number[] = [0];
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const segmentDistance = Math.sqrt(dx * dx + dy * dy);
    totalDistance += segmentDistance;
    distances.push(totalDistance);
  }
  
  // Sample elevation along the path
  for (let i = 0; i <= samples; i++) {
    const targetDistance = (i / samples) * totalDistance;
    
    // Find the segment containing this distance
    let segmentIndex = 0;
    for (let j = 1; j < distances.length; j++) {
      if (targetDistance <= distances[j]) {
        segmentIndex = j - 1;
        break;
      }
    }
    
    // Interpolate position within segment
    const segmentStart = distances[segmentIndex];
    const segmentEnd = distances[segmentIndex + 1] || totalDistance;
    const segmentProgress = (targetDistance - segmentStart) / (segmentEnd - segmentStart);
    
    const x = path[segmentIndex].x + 
      (path[segmentIndex + 1]?.x - path[segmentIndex].x || 0) * segmentProgress;
    const y = path[segmentIndex].y + 
      (path[segmentIndex + 1]?.y - path[segmentIndex].y || 0) * segmentProgress;
    
    const elevation = getElevationAt(terrain, x, y);
    profile.push({ distance: targetDistance, elevation });
  }
  
  return profile;
}