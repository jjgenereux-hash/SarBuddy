// Weather service for fetching real-time weather data
interface WeatherData {
  temperature: number;
  humidity: number;
  pressure: number;
  visibility: number;
  windSpeed: number;
  windDirection: number;
  windGust: number;
  cloudCover: number;
  precipitation: number;
  conditions: string;
  icon: string;
  timestamp: Date;
}

interface WeatherForecast {
  hourly: WeatherData[];
  daily: WeatherData[];
}

interface FlightSafetyAssessment {
  safe: boolean;
  warnings: string[];
  recommendations: string[];
  riskLevel: 'low' | 'moderate' | 'high' | 'extreme';
}

class WeatherService {
  private apiKey: string = import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo';
  private baseUrl: string = 'https://api.openweathermap.org/data/2.5';

  async getCurrentWeather(lat: number, lon: number): Promise<WeatherData> {
    // Simulated data for demo
    return {
      temperature: 22 + Math.random() * 10,
      humidity: 45 + Math.random() * 30,
      pressure: 1013 + Math.random() * 20,
      visibility: 8000 + Math.random() * 2000,
      windSpeed: 5 + Math.random() * 15,
      windDirection: Math.random() * 360,
      windGust: 8 + Math.random() * 20,
      cloudCover: Math.random() * 100,
      precipitation: Math.random() * 5,
      conditions: ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
      icon: '01d',
      timestamp: new Date()
    };
  }

  async getWeatherForecast(lat: number, lon: number): Promise<WeatherForecast> {
    const hourly: WeatherData[] = [];
    for (let i = 0; i < 24; i++) {
      hourly.push(await this.getCurrentWeather(lat, lon));
    }
    
    const daily: WeatherData[] = [];
    for (let i = 0; i < 7; i++) {
      daily.push(await this.getCurrentWeather(lat, lon));
    }
    
    return { hourly, daily };
  }

  assessFlightSafety(weather: WeatherData): FlightSafetyAssessment {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Wind assessment
    if (weather.windSpeed > 25) {
      warnings.push('High wind speeds detected (>25 km/h)');
      recommendations.push('Consider postponing flight or use wind-resistant flight mode');
      riskScore += 3;
    } else if (weather.windSpeed > 15) {
      warnings.push('Moderate wind speeds (15-25 km/h)');
      recommendations.push('Adjust flight altitude for stable conditions');
      riskScore += 1;
    }

    if (weather.windGust > 30) {
      warnings.push('Strong wind gusts detected');
      recommendations.push('Avoid hovering operations, maintain forward momentum');
      riskScore += 2;
    }

    // Visibility assessment
    if (weather.visibility < 1000) {
      warnings.push('Very poor visibility (<1km)');
      recommendations.push('Flight not recommended - use GPS navigation only');
      riskScore += 4;
    } else if (weather.visibility < 3000) {
      warnings.push('Limited visibility (1-3km)');
      recommendations.push('Reduce flight speed and altitude');
      riskScore += 2;
    }

    // Precipitation assessment
    if (weather.precipitation > 2) {
      warnings.push('Heavy precipitation detected');
      recommendations.push('Protect drone electronics, consider waterproof equipment');
      riskScore += 3;
    } else if (weather.precipitation > 0) {
      warnings.push('Light precipitation');
      recommendations.push('Monitor battery performance, may reduce flight time');
      riskScore += 1;
    }

    // Temperature assessment
    if (weather.temperature < 0) {
      warnings.push('Freezing temperatures');
      recommendations.push('Pre-warm batteries, expect reduced flight time');
      riskScore += 2;
    } else if (weather.temperature > 40) {
      warnings.push('High temperature warning');
      recommendations.push('Monitor motor temperatures, reduce flight duration');
      riskScore += 2;
    }

    // Cloud cover assessment
    if (weather.cloudCover > 90) {
      warnings.push('Heavy cloud cover');
      recommendations.push('GPS signal may be affected, maintain visual contact');
      riskScore += 1;
    }

    // Determine risk level
    let riskLevel: FlightSafetyAssessment['riskLevel'] = 'low';
    if (riskScore >= 8) riskLevel = 'extreme';
    else if (riskScore >= 5) riskLevel = 'high';
    else if (riskScore >= 3) riskLevel = 'moderate';

    // Add general recommendations
    if (riskLevel === 'low') {
      recommendations.push('Conditions favorable for all flight operations');
    }

    return {
      safe: riskLevel !== 'extreme',
      warnings,
      recommendations,
      riskLevel
    };
  }

  getWindPattern(centerLat: number, centerLon: number, gridSize: number = 5): Array<{
    lat: number;
    lon: number;
    speed: number;
    direction: number;
  }> {
    const pattern = [];
    const step = 0.01; // ~1km

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        pattern.push({
          lat: centerLat + (i * step),
          lon: centerLon + (j * step),
          speed: 5 + Math.random() * 15 + Math.abs(i + j),
          direction: (Math.atan2(i, j) * 180 / Math.PI + 360) % 360
        });
      }
    }

    return pattern;
  }
}

export const weatherService = new WeatherService();
export type { WeatherData, WeatherForecast, FlightSafetyAssessment };