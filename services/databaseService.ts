import { supabase } from '@/lib/supabase';

// Types
export interface User {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  color?: string;
  size?: string;
  age?: string;
  description?: string;
  status: 'missing' | 'lost' | 'found' | 'reunited';
  owner_id?: string;
  latitude: number;
  longitude: number;
  last_seen_location?: string;
  last_seen_at?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
  distance?: number; // Added for distance calculations
}

export interface Sighting {
  id: string;
  pet_id: string;
  reporter_id?: string;
  latitude: number;
  longitude: number;
  description?: string;
  photo_url?: string;
  confidence_score?: number;
  verified: boolean;
  reported_at: string;
  created_at: string;
  pet?: Pet;
  reporter?: User;
  distance?: number; // Added for distance calculations
}

export interface SearchHistory {
  id: string;
  user_id?: string;
  search_query?: string;
  filters?: any;
  results_count: number;
  clicked_results?: string[];
  session_id?: string;
  created_at: string;
}

class DatabaseService {
  // User CRUD operations
  async getUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as User[];
  }

  async getUserById(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as User;
  }

  async createUser(user: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .insert([user])
      .select()
      .single();
    if (error) throw error;
    return data as User;
  }

  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as User;
  }

  // Pet CRUD operations
  async getPets(filters?: { status?: string; species?: string }) {
    let query = supabase.from('pets').select('*');
    
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.species) query = query.eq('species', filters.species);
    
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

  async createPet(pet: Partial<Pet>) {
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

  // Sighting CRUD operations
  async getSightings(petId?: string) {
    let query = supabase
      .from('sightings')
      .select(`
        *,
        pet:pets(*)
      `);
    
    if (petId) query = query.eq('pet_id', petId);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as Sighting[];
  }

  async createSighting(sighting: Partial<Sighting>) {
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

  // Search History operations
  async getSearchHistory(userId?: string) {
    let query = supabase
      .from('search_analytics')
      .select('*');
    
    if (userId) query = query.eq('user_id', userId);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data as SearchHistory[];
  }

  async createSearchHistory(search: Partial<SearchHistory>) {
    const { data, error } = await supabase
      .from('search_analytics')
      .insert([search])
      .select()
      .single();
    if (error) throw error;
    return data as SearchHistory;
  }

  // Search pets with filters
  async searchPets(params: {
    query?: string;
    species?: string;
    status?: string;
    location?: { lat: number; lng: number; radius: number };
  }) {
    let query = supabase.from('pets').select('*');
    
    if (params.query) {
      query = query.or(`name.ilike.%${params.query}%,breed.ilike.%${params.query}%,description.ilike.%${params.query}%`);
    }
    
    if (params.species) query = query.eq('species', params.species);
    if (params.status) query = query.eq('status', params.status);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    // Log search to analytics
    await this.createSearchHistory({
      search_query: params.query,
      filters: params,
      results_count: data?.length || 0,
      session_id: crypto.randomUUID()
    });
    
    return data as Pet[];
  }

  // Real-time subscriptions
  subscribeToPets(callback: (payload: any) => void) {
    return supabase
      .channel('pets-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pets' }, callback)
      .subscribe();
  }

  subscribeToSightings(callback: (payload: any) => void) {
    return supabase
      .channel('sightings-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sightings' }, callback)
      .subscribe();
  }
}

export const databaseService = new DatabaseService();