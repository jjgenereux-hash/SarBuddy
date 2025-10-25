// Weather analysis utilities for mission planning

export interface WeatherConditions {
  temp: number;
  humidity: number;
  pressure: number;
  visibility: number;
  wind: {
    speed: number;
    direction: number;
    gust: number;
  };
  clouds: number;
  weather: {
    main: string;
    description: string;
  };
}

export interface WeatherHazard {
  type: string;
  severity: 'low' | 'moderate' | 'severe';
  message: string;
  impact: string;
}

export interface MissionWeatherAdjustment {
  parameter: string;
  originalValue: number;
  adjustedValue: number;
  reason: string;
}

// Calculate wind effect on drone battery
export function calculateWindBatteryImpact(
  windSpeed: number,
  windDirection: number,
  flightDirection: number,
  baseConsumption: number
): number {
  // Calculate relative wind angle (0 = headwind, 180 = tailwind)
  const relativeAngle = Math.abs(windDirection - flightDirection);
  const normalizedAngle = relativeAngle > 180 ? 360 - relativeAngle : relativeAngle;
  
  // Headwind increases consumption, tailwind decreases it
  const windFactor = Math.cos((normalizedAngle * Math.PI) / 180);
  const windImpact = windSpeed * windFactor * 0.15; // 15% impact per m/s
  
  return baseConsumption * (1 + windImpact / 10);
}

// Adjust mission parameters based on weather
export function adjustMissionForWeather(
  mission: any,
  weather: WeatherConditions
): MissionWeatherAdjustment[] {
  const adjustments: MissionWeatherAdjustment[] = [];
  
  // Adjust altitude for wind
  if (weather.wind.speed > 10) {
    const altitudeReduction = Math.min(30, weather.wind.speed * 2);
    adjustments.push({
      parameter: 'altitude',
      originalValue: mission.altitude,
      adjustedValue: Math.max(30, mission.altitude - altitudeReduction),
      reason: `Reduced altitude due to wind speed ${weather.wind.speed.toFixed(1)} m/s`
    });
  }
  
  // Adjust speed for visibility
  if (weather.visibility < 3000) {
    const speedReduction = (3000 - weather.visibility) / 100;
    adjustments.push({
      parameter: 'speed',
      originalValue: mission.speed,
      adjustedValue: Math.max(5, mission.speed - speedReduction),
      reason: `Reduced speed due to visibility ${weather.visibility}m`
    });
  }
  
  // Adjust search pattern for wind
  if (weather.wind.speed > 8 && mission.searchPattern) {
    adjustments.push({
      parameter: 'searchSpacing',
      originalValue: mission.searchSpacing,
      adjustedValue: mission.searchSpacing * 0.8,
      reason: 'Tighter search pattern due to wind drift'
    });
  }
  
  return adjustments;
}

// Check if weather is safe for flight
export function isWeatherSafe(weather: WeatherConditions): {
  safe: boolean;
  hazards: WeatherHazard[];
} {
  const hazards: WeatherHazard[] = [];
  
  // Wind speed limits
  if (weather.wind.speed > 20) {
    hazards.push({
      type: 'EXTREME_WIND',
      severity: 'severe',
      message: `Wind speed ${weather.wind.speed.toFixed(1)} m/s exceeds safe limits`,
      impact: 'Flight not recommended - risk of loss of control'
    });
  } else if (weather.wind.speed > 15) {
    hazards.push({
      type: 'HIGH_WIND',
      severity: 'moderate',
      message: `High wind speed ${weather.wind.speed.toFixed(1)} m/s`,
      impact: 'Reduced battery life and stability'
    });
  }
  
  // Gust limits
  if (weather.wind.gust > 25) {
    hazards.push({
      type: 'SEVERE_GUSTS',
      severity: 'severe',
      message: `Wind gusts ${weather.wind.gust.toFixed(1)} m/s`,
      impact: 'Risk of sudden altitude/position changes'
    });
  }
  
  // Visibility limits
  if (weather.visibility < 500) {
    hazards.push({
      type: 'ZERO_VISIBILITY',
      severity: 'severe',
      message: `Visibility ${weather.visibility}m below minimums`,
      impact: 'Unable to maintain visual line of sight'
    });
  } else if (weather.visibility < 1500) {
    hazards.push({
      type: 'LOW_VISIBILITY',
      severity: 'moderate',
      message: `Reduced visibility ${weather.visibility}m`,
      impact: 'Limited visual range for navigation'
    });
  }
  
  // Precipitation
  if (['Thunderstorm', 'Tornado'].includes(weather.weather.main)) {
    hazards.push({
      type: 'SEVERE_WEATHER',
      severity: 'severe',
      message: weather.weather.description,
      impact: 'Flight prohibited - extreme weather'
    });
  } else if (weather.weather.main === 'Rain' && weather.clouds > 80) {
    hazards.push({
      type: 'HEAVY_RAIN',
      severity: 'moderate',
      message: 'Heavy rain conditions',
      impact: 'Reduced visibility and potential water damage'
    });
  }
  
  // Temperature extremes
  if (weather.temp < -10) {
    hazards.push({
      type: 'EXTREME_COLD',
      severity: 'moderate',
      message: `Temperature ${weather.temp.toFixed(1)}°C`,
      impact: 'Reduced battery performance'
    });
  } else if (weather.temp > 40) {
    hazards.push({
      type: 'EXTREME_HEAT',
      severity: 'moderate',
      message: `Temperature ${weather.temp.toFixed(1)}°C`,
      impact: 'Risk of overheating'
    });
  }
  
  const safe = !hazards.some(h => h.severity === 'severe');
  
  return { safe, hazards };
}

// Calculate optimal flight time based on weather
export function calculateOptimalFlightTime(
  forecast: any[],
  missionDuration: number
): {
  optimalTime: Date;
  reason: string;
  conditions: WeatherConditions;
} {
  if (!forecast || forecast.length === 0) {
    return {
      optimalTime: new Date(),
      reason: 'No forecast data available',
      conditions: {} as WeatherConditions
    };
  }
  
  // Score each forecast period
  const scoredPeriods = forecast.map(period => {
    let score = 100;
    
    // Penalize high wind
    score -= Math.min(50, period.wind.speed * 3);
    score -= Math.min(30, (period.wind.gust || 0) * 2);
    
    // Penalize precipitation
    score -= (period.pop || 0) * 50;
    
    // Penalize poor weather
    if (['Rain', 'Snow', 'Thunderstorm'].includes(period.weather.main)) {
      score -= 30;
    }
    
    // Penalize high cloud cover
    score -= period.clouds * 0.2;
    
    return {
      time: new Date(period.dt * 1000),
      score,
      conditions: {
        temp: period.temp,
        wind: period.wind,
        weather: period.weather,
        clouds: period.clouds
      }
    };
  });
  
  // Find the best period
  const optimal = scoredPeriods.reduce((best, current) => 
    current.score > best.score ? current : best
  );
  
  const reasons = [];
  if (optimal.conditions.wind.speed < 5) reasons.push('calm winds');
  if (optimal.conditions.clouds < 50) reasons.push('clear skies');
  if (!['Rain', 'Snow'].includes(optimal.conditions.weather.main)) reasons.push('no precipitation');
  
  return {
    optimalTime: optimal.time,
    reason: reasons.join(', ') || 'Best available conditions',
    conditions: optimal.conditions as WeatherConditions
  };
}