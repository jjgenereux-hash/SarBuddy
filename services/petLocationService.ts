import { supabase } from '@/lib/supabase';

export interface PetLocation {
  id: string;
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string;
  color: string;
  status: 'lost' | 'found' | 'reunited';
  coordinates: {
    lat: number;
    lng: number;
  };
  lastSeen: Date;
  location: {
    address?: string;
    city: string;
    state: string;
    zip: string;
  };
  source: 'local' | 'petco' | 'partner' | 'user';
  imageUrl?: string;
  contactInfo?: {
    name: string;
    phone: string;
    email?: string;
  };
  matchScore?: number;
  description?: string;
}

// State coordinates for all US states
const STATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'RI': { lat: 41.5801, lng: -71.4774 },
  'MA': { lat: 42.4072, lng: -71.3824 },
  'CT': { lat: 41.6032, lng: -73.0877 },
  'NY': { lat: 40.7128, lng: -74.0060 },
  'CA': { lat: 36.7783, lng: -119.4179 },
  'TX': { lat: 31.9686, lng: -99.9018 },
  'FL': { lat: 27.6648, lng: -81.5158 },
  // Add more states as needed
};

// Geocode address to coordinates
async function geocodeAddress(address: string, city: string, state: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(`${address} ${city} ${state}`)}`
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  
  // Fallback to state coordinates with random offset
  const stateCoords = STATE_COORDINATES[state] || STATE_COORDINATES['RI'];
  return {
    lat: stateCoords.lat + (Math.random() - 0.5) * 0.5,
    lng: stateCoords.lng + (Math.random() - 0.5) * 0.5
  };
}

// Validate and format pet data
function validatePetData(pet: any, source: string): PetLocation | null {
  try {
    // Ensure required fields exist
    if (!pet.id || !pet.location) return null;
    
    // Extract coordinates or geocode
    let coordinates = { lat: 0, lng: 0 };
    
    if (pet.coordinates) {
      coordinates = {
        lat: parseFloat(pet.coordinates.lat || pet.coordinates.latitude || 0),
        lng: parseFloat(pet.coordinates.lng || pet.coordinates.longitude || 0)
      };
    } else if (pet.latitude && pet.longitude) {
      coordinates = {
        lat: parseFloat(pet.latitude),
        lng: parseFloat(pet.longitude)
      };
    } else {
      // Use state coordinates with offset
      const state = pet.location.state || 'RI';
      const stateCoords = STATE_COORDINATES[state] || STATE_COORDINATES['RI'];
      coordinates = {
        lat: stateCoords.lat + (Math.random() - 0.5) * 0.3,
        lng: stateCoords.lng + (Math.random() - 0.5) * 0.3
      };
    }
    
    return {
      id: pet.id,
      name: pet.name || 'Unknown',
      species: pet.species || 'dog',
      breed: pet.breed || 'Unknown',
      color: pet.color || 'Unknown',
      status: pet.status || 'lost',
      coordinates,
      lastSeen: pet.last_seen ? new Date(pet.last_seen) : new Date(),
      location: {
        address: pet.location.address,
        city: pet.location.city || 'Unknown',
        state: pet.location.state || 'RI',
        zip: pet.location.zip || ''
      },
      source: source as any,
      imageUrl: pet.image_url || pet.imageUrl,
      contactInfo: pet.contact || pet.contactInfo,
      matchScore: pet.match_score,
      description: pet.description
    };
  } catch (error) {
    console.error('Error validating pet data:', error, pet);
    return null;
  }
}

// Fetch pets from local database
export async function fetchLocalPets(): Promise<PetLocation[]> {
  try {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .in('status', ['lost', 'found']);
    
    if (error) throw error;
    
    const validPets = (data || [])
      .map(pet => validatePetData(pet, 'local'))
      .filter(Boolean) as PetLocation[];
    
    return validPets;
  } catch (error) {
    console.error('Error fetching local pets:', error);
    return [];
  }
}

// Fetch pets from Petco Love Lost
export async function fetchPetcoPets(filters?: any): Promise<PetLocation[]> {
  try {
    const { data, error } = await supabase.functions.invoke('petco-love-lost-search', {
      body: {
        status: 'lost',
        radius: 100,
        ...filters
      }
    });
    
    if (error) throw error;
    
    const pets = data?.pets || [];
    const validPets = pets
      .map((pet: any) => validatePetData(pet, 'petco'))
      .filter(Boolean) as PetLocation[];
    
    return validPets;
  } catch (error) {
    console.error('Error fetching Petco pets:', error);
    return [];
  }
}

// Fetch pets from partner APIs
export async function fetchPartnerPets(): Promise<PetLocation[]> {
  try {
    // Check if the function exists before calling
    const { data: functionsList } = await supabase.functions.list?.() || { data: [] };
    const hasPartnerSync = functionsList?.some?.((f: any) => f.name === 'partner-api-sync');
    
    if (!hasPartnerSync) {
      console.log('Partner API sync function not available');
      return [];
    }
    
    const { data, error } = await supabase.functions.invoke('partner-api-sync', {
      body: { action: 'fetch_all' }
    });
    
    if (error) {
      console.log('Partner API sync error:', error.message);
      return [];
    }
    
    const allPartnerPets: PetLocation[] = [];
    
    // Process each partner's data
    for (const partner of data?.partners || []) {
      const pets = partner.pets || [];
      const validPets = pets
        .map((pet: any) => validatePetData(pet, 'partner'))
        .filter(Boolean) as PetLocation[];
      allPartnerPets.push(...validPets);
    }
    
    return allPartnerPets;
  } catch (error) {
    console.log('Partner pets fetch skipped:', error);
    return [];
  }
}

// Fetch all pets from all sources
// Fetch all pets from all sources
export async function fetchAllPets(): Promise<PetLocation[]> {
  try {
    const [localPets, petcoPets, partnerPets] = await Promise.allSettled([
      fetchLocalPets(),
      fetchPetcoPets(),
      fetchPartnerPets()
    ]);
    
    const allPets: PetLocation[] = [];
    
    // Process results safely
    if (localPets.status === 'fulfilled' && Array.isArray(localPets.value)) {
      allPets.push(...localPets.value);
    }
    if (petcoPets.status === 'fulfilled' && Array.isArray(petcoPets.value)) {
      allPets.push(...petcoPets.value);
    }
    if (partnerPets.status === 'fulfilled' && Array.isArray(partnerPets.value)) {
      allPets.push(...partnerPets.value);
    }
    
    // Combine and deduplicate
    const uniquePets = new Map<string, PetLocation>();
    
    for (const pet of allPets) {
      const key = `${pet.name}-${pet.species}-${pet.breed}-${pet.color}`.toLowerCase();
      if (!uniquePets.has(key) || (pet.matchScore && pet.matchScore > (uniquePets.get(key)?.matchScore || 0))) {
        uniquePets.set(key, pet);
      }
    }
    
    return Array.from(uniquePets.values());
  } catch (error) {
    console.error('Error in fetchAllPets:', error);
    return [];
  }
}

// Subscribe to real-time updates
// Subscribe to real-time updates
export function subscribeToRealTimeUpdates(callback: (pets: PetLocation[]) => void) {
  // Ensure callback always receives an array
  const safeCallback = (pets: PetLocation[]) => {
    callback(Array.isArray(pets) ? pets : []);
  };
  
  // Subscribe to database changes
  const subscription = supabase
    .channel('pet-updates')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'pets'
    }, async () => {
      const pets = await fetchAllPets();
      safeCallback(pets);
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'pet_sightings'
    }, async () => {
      const pets = await fetchAllPets();
      safeCallback(pets);
    })
    .subscribe();
  
  // Poll for external API updates every 30 seconds
  const interval = setInterval(async () => {
    const pets = await fetchAllPets();
    safeCallback(pets);
  }, 30000);
  
  // Return cleanup function
  return () => {
    subscription.unsubscribe();
    clearInterval(interval);
  };
}

// Get pets within radius
export function getPetsWithinRadius(
  center: { lat: number; lng: number },
  radiusMiles: number,
  pets: PetLocation[]
): PetLocation[] {
  const radiusKm = radiusMiles * 1.60934;
  
  return pets.filter(pet => {
    const distance = calculateDistance(
      center.lat,
      center.lng,
      pet.coordinates.lat,
      pet.coordinates.lng
    );
    return distance <= radiusKm;
  });
}

// Calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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