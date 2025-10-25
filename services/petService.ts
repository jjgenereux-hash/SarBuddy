import { supabase } from '@/lib/supabase';

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  color?: string;
  age?: number;
  weight?: number;
  microchip_id?: string;
  description?: string;
  last_seen_location?: string;
  last_seen_date?: string;
  reward_amount?: number;
  image_url?: string;
  status: 'missing' | 'found' | 'reunited';
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Owner {
  id: string;
  email: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Sighting {
  id: string;
  pet_id: string;
  reporter_name?: string;
  reporter_email?: string;
  reporter_phone?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  image_url?: string;
  sighting_date: string;
  status: 'unverified' | 'verified' | 'invalid';
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  lost_pet_id: string;
  found_pet_id?: string;
  sighting_id?: string;
  confidence_score: number;
  match_type?: string;
  status: 'pending' | 'confirmed' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
}

class PetService {
  // Pet CRUD operations
  async getPets(status?: string) {
    const query = supabase.from('pets').select('*');
    if (status) query.eq('status', status);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as Pet[];
  }

  async getPetById(id: string) {
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Pet;
  }

  async createPet(pet: Omit<Pet, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('pets')
      .insert([pet])
      .select()
      .single();
    
    if (error) throw error;
    return data as Pet;
  }

  async updatePet(id: string, updates: Partial<Pet>) {
    const { data, error } = await supabase
      .from('pets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Pet;
  }

  async deletePet(id: string) {
    const { error } = await supabase
      .from('pets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Sighting operations
  async getSightings(petId?: string) {
    const query = supabase.from('sightings').select('*');
    if (petId) query.eq('pet_id', petId);
    
    const { data, error } = await query.order('sighting_date', { ascending: false });
    if (error) throw error;
    return data as Sighting[];
  }

  async createSighting(sighting: Omit<Sighting, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('sightings')
      .insert([sighting])
      .select()
      .single();
    
    if (error) throw error;
    return data as Sighting;
  }

  async updateSighting(id: string, updates: Partial<Sighting>) {
    const { data, error } = await supabase
      .from('sightings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Sighting;
  }

  // Match operations
  async getMatches(petId?: string) {
    const query = supabase.from('matches').select('*');
    if (petId) query.or(`lost_pet_id.eq.${petId},found_pet_id.eq.${petId}`);
    
    const { data, error } = await query.order('confidence_score', { ascending: false });
    if (error) throw error;
    return data as Match[];
  }

  async createMatch(match: Omit<Match, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('matches')
      .insert([match])
      .select()
      .single();
    
    if (error) throw error;
    return data as Match;
  }

  async updateMatch(id: string, updates: Partial<Match>) {
    const { data, error } = await supabase
      .from('matches')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Match;
  }

  // Owner operations
  async getOwnerByEmail(email: string) {
    const { data, error } = await supabase
      .from('owners')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Owner | null;
  }

  async createOwner(owner: Omit<Owner, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('owners')
      .insert([owner])
      .select()
      .single();
    
    if (error) throw error;
    return data as Owner;
  }

  async updateOwner(id: string, updates: Partial<Owner>) {
    const { data, error } = await supabase
      .from('owners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Owner;
  }
}

export const petService = new PetService();