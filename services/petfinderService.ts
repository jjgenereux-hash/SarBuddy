import { supabase } from '@/lib/supabase';

export interface PetfinderOrganization {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: {
    address1: string;
    address2: string | null;
    city: string;
    state: string;
    postcode: string;
    country: string;
  };
  hours: {
    [key: string]: string;
  };
  url: string;
  website: string | null;
  mission_statement: string | null;
  adoption: {
    policy: string | null;
    url: string | null;
  };
  social_media: {
    facebook: string | null;
    twitter: string | null;
    youtube: string | null;
    instagram: string | null;
    pinterest: string | null;
  };
  photos: Array<{
    small: string;
    medium: string;
    large: string;
    full: string;
  }>;
  distance: number | null;
  capacity: {
    total: number;
    current: number;
    available: number;
  };
  intakeStatus: 'open' | 'limited' | 'closed';
  emergencyIntake: boolean;
  services: string[];
}

export interface PetfinderAnimal {
  id: number;
  organization_id: string;
  url: string;
  type: string;
  species: string;
  breeds: {
    primary: string | null;
    secondary: string | null;
    mixed: boolean;
    unknown: boolean;
  };
  colors: {
    primary: string | null;
    secondary: string | null;
    tertiary: string | null;
  };
  age: string;
  gender: string;
  size: string;
  name: string;
  description: string | null;
  photos: Array<{
    small: string;
    medium: string;
    large: string;
    full: string;
  }>;
  status: string;
  distance: number | null;
}

export interface FoundPetReport {
  shelterEmail: string;
  petDetails: {
    species: string;
    breed?: string;
    color?: string;
    size?: string;
    description: string;
    photos?: string[];
  };
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

class PetfinderService {
  async getOrganizations(latitude: number, longitude: number, distance: number = 25): Promise<PetfinderOrganization[]> {
    try {
      const { data, error } = await supabase.functions.invoke('petfinder-api/organizations', {
        body: { latitude, longitude, distance }
      });

      if (error) throw error;
      
      return data.organizations || [];
    } catch (error) {
      console.error('Error fetching Petfinder organizations:', error);
      // Return mock data as fallback
      return this.getMockOrganizations(latitude, longitude);
    }
  }

  async getAnimals(organizationId?: string, type?: string, limit: number = 20): Promise<PetfinderAnimal[]> {
    try {
      const { data, error } = await supabase.functions.invoke('petfinder-api/animals', {
        body: { organizationId, type, limit }
      });

      if (error) throw error;
      
      return data.animals || [];
    } catch (error) {
      console.error('Error fetching Petfinder animals:', error);
      return [];
    }
  }

  async reportFoundPet(report: FoundPetReport): Promise<{ success: boolean; message: string; reportId?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('petfinder-api/report-found', {
        body: report
      });

      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error reporting found pet:', error);
      return {
        success: false,
        message: 'Failed to report found pet. Please try again later.'
      };
    }
  }

  private getMockOrganizations(lat: number, lng: number): PetfinderOrganization[] {
    return [
      {
        id: 'CA2532',
        name: 'Happy Tails Animal Rescue',
        email: 'info@happytailsrescue.org',
        phone: '(555) 123-4567',
        address: {
          address1: '123 Rescue Way',
          address2: null,
          city: 'San Francisco',
          state: 'CA',
          postcode: '94102',
          country: 'US'
        },
        hours: {
          monday: '10:00 AM - 6:00 PM',
          tuesday: '10:00 AM - 6:00 PM',
          wednesday: '10:00 AM - 6:00 PM',
          thursday: '10:00 AM - 7:00 PM',
          friday: '10:00 AM - 7:00 PM',
          saturday: '9:00 AM - 5:00 PM',
          sunday: '11:00 AM - 4:00 PM'
        },
        url: 'https://www.petfinder.com/member/us/ca/san-francisco/happy-tails-rescue',
        website: 'https://happytailsrescue.org',
        mission_statement: 'Dedicated to rescuing and rehoming animals in need',
        adoption: {
          policy: 'Application required, home visit, adoption fee',
          url: 'https://happytailsrescue.org/adopt'
        },
        social_media: {
          facebook: 'happytailsrescue',
          twitter: '@happytails',
          youtube: null,
          instagram: 'happytailsrescue',
          pinterest: null
        },
        photos: [],
        distance: 2.5,
        capacity: {
          total: 50,
          current: 35,
          available: 15
        },
        intakeStatus: 'open',
        emergencyIntake: true,
        services: ['adoption', 'lost-found', 'medical-care', 'behavioral-training']
      },
      {
        id: 'CA2533',
        name: 'Bay Area Pet Haven',
        email: 'contact@bayareapethaven.org',
        phone: '(555) 234-5678',
        address: {
          address1: '456 Shelter Blvd',
          address2: 'Suite 200',
          city: 'Oakland',
          state: 'CA',
          postcode: '94612',
          country: 'US'
        },
        hours: {
          monday: '11:00 AM - 5:00 PM',
          tuesday: '11:00 AM - 5:00 PM',
          wednesday: 'Closed',
          thursday: '11:00 AM - 5:00 PM',
          friday: '11:00 AM - 6:00 PM',
          saturday: '10:00 AM - 6:00 PM',
          sunday: '12:00 PM - 4:00 PM'
        },
        url: 'https://www.petfinder.com/member/us/ca/oakland/bay-area-pet-haven',
        website: 'https://bayareapethaven.org',
        mission_statement: 'Providing safe haven for homeless pets',
        adoption: {
          policy: 'Application, interview, adoption contract',
          url: 'https://bayareapethaven.org/adopt'
        },
        social_media: {
          facebook: 'bayareapethaven',
          twitter: null,
          youtube: null,
          instagram: 'bayareapethaven',
          pinterest: null
        },
        photos: [],
        distance: 8.3,
        capacity: {
          total: 30,
          current: 28,
          available: 2
        },
        intakeStatus: 'limited',
        emergencyIntake: false,
        services: ['adoption', 'lost-found']
      }
    ];
  }
}

export const petfinderService = new PetfinderService();