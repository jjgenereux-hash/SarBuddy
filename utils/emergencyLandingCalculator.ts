// Emergency Landing Zone Calculator for Drone RTB Operations
export interface LandingZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  zone_type: 'primary' | 'secondary' | 'emergency';
  capacity: number;
  current_occupancy: number;
  weather_protected: boolean;
  facilities: string[];
}

export interface DronePosition {
  latitude: number;
  longitude: number;
  altitude: number;
  battery_level: number;
  heading: number;
}

export interface WeatherConditions {
  wind_speed: number;
  wind_direction: number;
  visibility: number;
  precipitation: number;
}

export class EmergencyLandingCalculator {
  // Calculate distance between two points using Haversine formula
  static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Find nearest safe landing zone
  static findNearestSafeZone(
    dronePosition: DronePosition,
    zones: LandingZone[],
    weather: WeatherConditions
  ): LandingZone | null {
    const availableZones = zones.filter(zone => 
      zone.current_occupancy < zone.capacity
    );

    if (availableZones.length === 0) return null;

    // Sort by distance and safety score
    const scoredZones = availableZones.map(zone => {
      const distance = this.calculateDistance(
        dronePosition.latitude,
        dronePosition.longitude,
        zone.latitude,
        zone.longitude
      );

      // Calculate safety score
      let safetyScore = 100;
      
      // Prefer weather-protected zones in bad weather
      if (weather.wind_speed > 20 || weather.precipitation > 3) {
        safetyScore += zone.weather_protected ? 50 : 0;
      }

      // Prefer primary zones
      if (zone.zone_type === 'primary') safetyScore += 30;
      else if (zone.zone_type === 'secondary') safetyScore += 15;

      // Consider facilities
      if (zone.facilities.includes('charging')) safetyScore += 20;
      if (zone.facilities.includes('maintenance')) safetyScore += 10;

      // Factor in distance (closer is better)
      safetyScore -= distance * 2;

      return { zone, distance, safetyScore };
    });

    // Sort by safety score (higher is better)
    scoredZones.sort((a, b) => b.safetyScore - a.safetyScore);

    return scoredZones[0]?.zone || null;
  }

  // Calculate optimal return path considering wind
  static calculateReturnPath(
    start: DronePosition,
    target: LandingZone,
    weather: WeatherConditions,
    batteryLevel: number
  ): {
    waypoints: Array<{lat: number, lon: number, alt: number}>;
    estimatedTime: number;
    estimatedBatteryUsage: number;
    feasible: boolean;
  } {
    const distance = this.calculateDistance(
      start.latitude,
      start.longitude,
      target.latitude,
      target.longitude
    );

    // Calculate wind effect on travel
    const windEffect = weather.wind_speed > 15 ? 1.3 : 1.1;
    const effectiveDistance = distance * windEffect;

    // Estimate time (assuming 40 km/h average speed)
    const estimatedTime = (effectiveDistance / 40) * 60; // minutes

    // Estimate battery usage (2% per km in normal conditions)
    const batteryPerKm = weather.wind_speed > 20 ? 3 : 2;
    const estimatedBatteryUsage = effectiveDistance * batteryPerKm;

    // Check if return is feasible
    const feasible = batteryLevel > estimatedBatteryUsage + 10; // 10% safety margin

    // Generate waypoints for return path
    const waypoints = this.generateWaypoints(start, target, weather);

    return {
      waypoints,
      estimatedTime,
      estimatedBatteryUsage,
      feasible
    };
  }

  // Generate waypoints for safe return path
  private static generateWaypoints(
    start: DronePosition,
    target: LandingZone,
    weather: WeatherConditions
  ): Array<{lat: number, lon: number, alt: number}> {
    const waypoints = [];
    const segments = 5;

    // Lower altitude in bad weather
    const cruiseAltitude = weather.wind_speed > 20 ? 50 : 100;

    for (let i = 0; i <= segments; i++) {
      const ratio = i / segments;
      const lat = start.latitude + (target.latitude - start.latitude) * ratio;
      const lon = start.longitude + (target.longitude - start.longitude) * ratio;
      
      let alt = cruiseAltitude;
      if (i === 0) alt = start.altitude; // Current altitude
      if (i === segments) alt = 10; // Landing altitude

      waypoints.push({ lat, lon, alt });
    }

    return waypoints;
  }

  // Check if RTB should be triggered
  static shouldTriggerRTB(
    drone: DronePosition,
    weather: WeatherConditions,
    criticalBatteryThreshold: number = 20,
    maxWindSpeed: number = 25
  ): {
    trigger: boolean;
    reason: string | null;
    urgency: 'critical' | 'warning' | 'normal';
  } {
    // Critical battery check
    if (drone.battery_level <= criticalBatteryThreshold) {
      return {
        trigger: true,
        reason: 'low_battery',
        urgency: 'critical'
      };
    }

    // Weather checks
    if (weather.wind_speed > maxWindSpeed) {
      return {
        trigger: true,
        reason: 'weather',
        urgency: weather.wind_speed > maxWindSpeed + 10 ? 'critical' : 'warning'
      };
    }

    if (weather.visibility < 1000) {
      return {
        trigger: true,
        reason: 'weather',
        urgency: 'warning'
      };
    }

    if (weather.precipitation > 5) {
      return {
        trigger: true,
        reason: 'weather',
        urgency: 'warning'
      };
    }

    return {
      trigger: false,
      reason: null,
      urgency: 'normal'
    };
  }
}