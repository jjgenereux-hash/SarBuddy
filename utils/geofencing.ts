// Geofencing system utilities
import { supabase } from '@/lib/supabase';
import { calculateDistance, Coordinates } from './geolocation';

export interface GeofenceAlert {
  id: string;
  zoneId: string;
  petId: number;
  alertType: string;
  distanceMeters: number;
  sentAt: Date;
  acknowledged: boolean;
}

export interface SearchPartyMobilization {
  id: string;
  petId: number;
  location: Coordinates;
  meetingPoint: string;
  scheduledTime: Date;
  maxVolunteers: number;
  currentVolunteers: number;
  status: string;
}

// Check all active geofences for a new pet report
export async function checkGeofencesForPet(petLocation: Coordinates, petId: number) {
  try {
    // Get all active geofence zones
    const { data: zones, error } = await supabase
      .from('geofence_zones')
      .select('*')
      .eq('is_active', true);

    if (error) throw error;

    const alerts = [];
    
    for (const zone of zones || []) {
      const distance = calculateDistance(
        petLocation,
        { lat: zone.center_lat, lng: zone.center_lng }
      );

      if (distance <= zone.radius_meters) {
        // Create alert for this zone
        const alert = {
          zone_id: zone.id,
          pet_id: petId,
          alert_type: 'new_lost_pet',
          distance_meters: Math.round(distance),
        };
        alerts.push(alert);
      }
    }

    // Insert all alerts
    if (alerts.length > 0) {
      const { error: insertError } = await supabase
        .from('geofence_alerts')
        .insert(alerts);

      if (insertError) throw insertError;
    }

    return alerts;
  } catch (error) {
    console.error('Error checking geofences:', error);
    return [];
  }
}

// Create a new search party mobilization
export async function createSearchParty(
  petId: number,
  location: Coordinates,
  meetingPoint: string,
  scheduledTime: Date,
  initiatorId: string
) {
  try {
    const { data, error } = await supabase
      .from('search_party_mobilization')
      .insert({
        pet_id: petId,
        initiator_id: initiatorId,
        location_lat: location.lat,
        location_lng: location.lng,
        meeting_point: meetingPoint,
        scheduled_time: scheduledTime,
        status: 'organizing',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating search party:', error);
    return null;
  }
}

// Respond to a search party mobilization
export async function respondToMobilization(
  mobilizationId: string,
  volunteerId: string,
  response: 'joining' | 'unavailable',
  etaMinutes?: number
) {
  try {
    const { error } = await supabase
      .from('mobilization_responses')
      .upsert({
        mobilization_id: mobilizationId,
        volunteer_id: volunteerId,
        response,
        eta_minutes: etaMinutes,
      });

    if (error) throw error;

    // Update volunteer count if joining
    if (response === 'joining') {
      // In a real app, this would update the volunteer count
      console.log('Volunteer joining search party');
    }

    return true;
  } catch (error) {
    console.error('Error responding to mobilization:', error);
    return false;
  }
}

// Geofence types and utilities for MapView
export interface Geofence {
  id: string;
  name: string;
  center: { lat: number; lng: number };
  radius: number;
  type: 'danger' | 'caution' | 'safe';
}

export interface GeofenceEvent {
  type: 'enter' | 'exit';
  geofence: Geofence;
  timestamp: Date;
}

export const HIGH_RISK_AREAS: Geofence[] = [
  {
    id: 'highway-95',
    name: 'I-95 Corridor',
    center: { lat: 41.8240, lng: -71.4128 },
    radius: 500,
    type: 'danger'
  },
  {
    id: 'roger-williams',
    name: 'Roger Williams Park',
    center: { lat: 41.7880, lng: -71.4140 },
    radius: 800,
    type: 'safe'
  }
];

export function isInsideGeofence(location: { lat: number; lng: number }, geofence: Geofence): boolean {
  const distance = calculateDistance(location, geofence.center);
  return distance <= geofence.radius;
}

export function checkMultipleGeofences(location: { lat: number; lng: number }, geofences: Geofence[]): Geofence[] {
  return geofences.filter(fence => isInsideGeofence(location, fence));
}

export function getGeofenceColor(type: Geofence['type']): string {
  switch (type) {
    case 'danger': return '#ef4444';
    case 'caution': return '#f59e0b';
    case 'safe': return '#10b981';
    default: return '#6b7280';
  }
}

// Get active alerts for a volunteer
export async function getVolunteerAlerts(volunteerId: string) {
  try {
    const { data, error } = await supabase
      .from('geofence_alerts')
      .select(`
        *,
        geofence_zones!inner(
          volunteer_id,
          name
        )
      `)
      .eq('geofence_zones.volunteer_id', volunteerId)
      .is('acknowledged_at', null)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting volunteer alerts:', error);
    return [];
  }
}

// Acknowledge an alert
export async function acknowledgeAlert(alertId: string, responseStatus: string) {
  try {
    const { error } = await supabase
      .from('geofence_alerts')
      .update({
        acknowledged_at: new Date().toISOString(),
        response_status: responseStatus,
      })
      .eq('id', alertId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    return false;
  }
}