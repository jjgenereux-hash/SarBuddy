// Mission Analytics Utilities
export interface MissionMetrics {
  successRate: number;
  avgSearchTime: number;
  avgBatteryConsumption: number;
  totalMissions: number;
  petFoundRate: number;
}

export interface WeatherImpact {
  condition: string;
  successRate: number;
  avgTime: number;
  batteryImpact: number;
}

export interface MLPredictions {
  optimalAltitude: number;
  bestTimeOfDay: string;
  expectedBatteryUsage: number;
  successProbability: number;
  recommendedSpeed: number;
  weatherSuitability: number;
}

export function calculateMissionMetrics(missions: any[]): MissionMetrics {
  if (!missions || missions.length === 0) {
    return {
      successRate: 0,
      avgSearchTime: 0,
      avgBatteryConsumption: 0,
      totalMissions: 0,
      petFoundRate: 0
    };
  }
  
  const successful = missions.filter(m => m.success).length;
  const petFound = missions.filter(m => m.pet_found).length;
  
  return {
    successRate: (successful / missions.length) * 100,
    avgSearchTime: missions.reduce((acc, m) => acc + (m.duration_minutes || 0), 0) / missions.length,
    avgBatteryConsumption: missions.reduce((acc, m) => acc + (m.battery_consumed_percent || 0), 0) / missions.length,
    totalMissions: missions.length,
    petFoundRate: (petFound / missions.length) * 100
  };
}

export function analyzeWeatherImpact(missions: any[]): WeatherImpact[] {
  if (!missions || missions.length === 0) {
    return [];
  }
  
  const weatherGroups: { [key: string]: any[] } = {};
  
  missions.forEach(m => {
    const condition = m.weather_conditions?.condition || 'unknown';
    if (!weatherGroups[condition]) weatherGroups[condition] = [];
    weatherGroups[condition].push(m);
  });

  return Object.entries(weatherGroups).map(([condition, group]) => ({
    condition,
    successRate: group.length > 0 ? (group.filter(m => m.success).length / group.length) * 100 : 0,
    avgTime: group.length > 0 ? group.reduce((acc, m) => acc + (m.duration_minutes || 0), 0) / group.length : 0,
    batteryImpact: group.length > 0 ? group.reduce((acc, m) => acc + (m.battery_consumed_percent || 0), 0) / group.length : 0
  }));
}

export function generateMLPredictions(
  historicalData: any[],
  weatherData: any,
  missionType: string
): MLPredictions {
  // Default predictions if no data
  if (!historicalData || historicalData.length === 0) {
    return {
      optimalAltitude: 50,
      bestTimeOfDay: '10:00-12:00',
      expectedBatteryUsage: 45,
      successProbability: 75,
      recommendedSpeed: 10,
      weatherSuitability: 80
    };
  }
  
  // Simple ML-like predictions based on historical patterns
  const avgAltitude = historicalData.reduce((acc, m) => acc + (m.avg_altitude_m || 50), 0) / historicalData.length;
  const successfulMissions = historicalData.filter(m => m.success && m.pet_found);
  
  // Find patterns in successful missions
  const bestHours = successfulMissions.length > 0 
    ? successfulMissions.map(m => new Date(m.start_time).getHours())
    : [10];
  const mostCommonHour = mode(bestHours);
  
  // Weather-based adjustments
  const windAdjustment = weatherData?.wind_speed > 5 ? -10 : 5;
  const visibilityBonus = weatherData?.visibility > 8 ? 10 : 0;
  
  return {
    optimalAltitude: Math.round(avgAltitude + (Math.random() * 20 - 10)),
    bestTimeOfDay: `${mostCommonHour}:00-${mostCommonHour + 2}:00`,
    expectedBatteryUsage: Math.round(45 + (missionType === 'patrol' ? -10 : 0)),
    successProbability: Math.min(95, 75 + windAdjustment + visibilityBonus),
    recommendedSpeed: weatherData?.wind_speed > 7 ? 8 : 12,
    weatherSuitability: calculateWeatherSuitability(weatherData)
  };
}

function mode(arr: number[]): number {
  const frequency: { [key: number]: number } = {};
  let maxFreq = 0;
  let mode = arr[0];
  
  arr.forEach(num => {
    frequency[num] = (frequency[num] || 0) + 1;
    if (frequency[num] > maxFreq) {
      maxFreq = frequency[num];
      mode = num;
    }
  });
  
  return mode;
}

function calculateWeatherSuitability(weather: any): number {
  let score = 100;
  
  if (weather?.wind_speed > 10) score -= 30;
  else if (weather?.wind_speed > 7) score -= 15;
  else if (weather?.wind_speed > 5) score -= 5;
  
  if (weather?.visibility < 5) score -= 20;
  else if (weather?.visibility < 8) score -= 10;
  
  if (weather?.precipitation > 2) score -= 40;
  else if (weather?.precipitation > 0) score -= 20;
  
  return Math.max(0, score);
}