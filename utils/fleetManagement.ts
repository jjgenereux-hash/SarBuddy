// Fleet Management Utilities
export interface MaintenancePrediction {
  droneId: string;
  predictedIssue: string;
  confidence: number;
  recommendedAction: string;
  estimatedDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface BatteryHealth {
  serial: string;
  healthScore: number;
  estimatedLifeRemaining: number;
  recommendReplacement: boolean;
  degradationRate: number;
}

// Calculate battery health based on cycles and performance
export function calculateBatteryHealth(
  cycleCount: number,
  currentCapacity: number,
  manufactureDate: Date,
  voltageReadings: number[]
): BatteryHealth {
  const ageInMonths = (Date.now() - manufactureDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  const maxCycles = 500; // Typical LiPo battery lifecycle
  
  // Calculate health score (0-100)
  const cycleScore = Math.max(0, 100 - (cycleCount / maxCycles) * 100);
  const capacityScore = currentCapacity;
  const ageScore = Math.max(0, 100 - (ageInMonths / 24) * 50); // 2 years expected life
  
  // Check voltage stability
  const avgVoltage = voltageReadings.reduce((a, b) => a + b, 0) / voltageReadings.length;
  const voltageVariance = voltageReadings.reduce((sum, v) => sum + Math.pow(v - avgVoltage, 2), 0) / voltageReadings.length;
  const voltageScore = voltageVariance < 0.5 ? 100 : Math.max(0, 100 - voltageVariance * 20);
  
  const healthScore = (cycleScore * 0.3 + capacityScore * 0.4 + ageScore * 0.2 + voltageScore * 0.1);
  const estimatedCyclesRemaining = Math.max(0, maxCycles - cycleCount);
  const degradationRate = (100 - currentCapacity) / cycleCount || 0;
  
  return {
    serial: '',
    healthScore: Math.round(healthScore),
    estimatedLifeRemaining: estimatedCyclesRemaining,
    recommendReplacement: healthScore < 30 || cycleCount > maxCycles * 0.8,
    degradationRate: Math.round(degradationRate * 100) / 100
  };
}

// Predict maintenance needs using ML-like algorithm
export function predictMaintenance(
  flightHours: number,
  errorCodes: string[],
  performanceMetrics: any,
  lastMaintenanceDate: Date
): MaintenancePrediction[] {
  const predictions: MaintenancePrediction[] = [];
  const hoursSinceLastMaintenance = (Date.now() - lastMaintenanceDate.getTime()) / (1000 * 60 * 60);
  
  // Motor maintenance prediction
  if (flightHours > 100 || hoursSinceLastMaintenance > 720) {
    predictions.push({
      droneId: '',
      predictedIssue: 'Motor bearing wear',
      confidence: Math.min(95, 60 + (flightHours / 100) * 20),
      recommendedAction: 'Schedule motor inspection and lubrication',
      estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      priority: flightHours > 150 ? 'high' : 'medium'
    });
  }
  
  // Gimbal calibration
  if (performanceMetrics?.gimbalDrift > 2) {
    predictions.push({
      droneId: '',
      predictedIssue: 'Gimbal calibration drift',
      confidence: 85,
      recommendedAction: 'Recalibrate gimbal and check mounting',
      estimatedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      priority: 'medium'
    });
  }
  
  // Propeller replacement
  if (flightHours > 50) {
    predictions.push({
      droneId: '',
      predictedIssue: 'Propeller fatigue',
      confidence: 70 + Math.min(25, (flightHours - 50) / 2),
      recommendedAction: 'Inspect propellers for micro-fractures',
      estimatedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      priority: 'low'
    });
  }
  
  // GPS module issues
  if (errorCodes.includes('GPS_DRIFT') || errorCodes.includes('GPS_LOSS')) {
    predictions.push({
      droneId: '',
      predictedIssue: 'GPS module degradation',
      confidence: 90,
      recommendedAction: 'Replace GPS antenna or module',
      estimatedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      priority: 'high'
    });
  }
  
  return predictions;
}

// Generate maintenance schedule
export function generateMaintenanceSchedule(
  droneId: string,
  flightHours: number,
  lastMaintenance: Date
): any[] {
  const schedule = [];
  const baseDate = new Date();
  
  // Routine inspection every 25 flight hours
  const nextRoutine = new Date(baseDate);
  nextRoutine.setDate(nextRoutine.getDate() + Math.max(7, 30 - (flightHours % 25)));
  schedule.push({
    type: 'routine',
    date: nextRoutine,
    description: 'Routine inspection and cleaning',
    estimatedDuration: '30 minutes'
  });
  
  // Battery check every 50 cycles
  const nextBattery = new Date(baseDate);
  nextBattery.setDate(nextBattery.getDate() + 14);
  schedule.push({
    type: 'battery',
    date: nextBattery,
    description: 'Battery health check and calibration',
    estimatedDuration: '45 minutes'
  });
  
  // Major service every 100 flight hours
  if (flightHours % 100 > 80) {
    const nextMajor = new Date(baseDate);
    nextMajor.setDate(nextMajor.getDate() + 21);
    schedule.push({
      type: 'major',
      date: nextMajor,
      description: 'Major service - all components',
      estimatedDuration: '2 hours'
    });
  }
  
  return schedule.sort((a, b) => a.date.getTime() - b.date.getTime());
}

// Automated pre-flight check validation
export function validatePreFlightCheck(checks: any): {
  passed: boolean;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const warnings: string[] = [];
  
  if (!checks.gps_status) issues.push('GPS not locked');
  if (!checks.compass_calibrated) issues.push('Compass needs calibration');
  if (!checks.battery_voltage_ok) issues.push('Battery voltage out of range');
  if (!checks.propellers_secure) issues.push('Propellers not properly secured');
  if (!checks.firmware_current) warnings.push('Firmware update available');
  if (!checks.sensors_operational) issues.push('Sensor malfunction detected');
  if (!checks.communication_link) issues.push('Communication link unstable');
  if (!checks.weather_suitable) warnings.push('Weather conditions marginal');
  if (!checks.airspace_clear) issues.push('Airspace restrictions in effect');
  
  return {
    passed: issues.length === 0,
    issues,
    warnings
  };
}