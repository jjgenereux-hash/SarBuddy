import { loadGoogleMaps } from '@/utils/googleMapsLoader';

export interface VetClinic {
  id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  rating?: number;
  totalRatings?: number;
  isEmergency: boolean;
  isOpen?: boolean;
  hours?: string[];
  lat: number;
  lng: number;
  distance?: number;
  photo?: string;
  priceLevel?: number;
}

class GooglePlacesService {
  private service: google.maps.places.PlacesService | null = null;
  private map: google.maps.Map | null = null;

  async initialize(): Promise<void> {
    try {
      const google = await loadGoogleMaps();
      
      // Create a hidden map div for the Places Service
      const mapDiv = document.createElement('div');
      mapDiv.style.display = 'none';
      document.body.appendChild(mapDiv);
      
      this.map = new google.maps.Map(mapDiv, {
        center: { lat: 0, lng: 0 },
        zoom: 1
      });
      
      this.service = new google.maps.places.PlacesService(this.map);
    } catch (error) {
      console.error('Failed to initialize Google Places Service:', error);
      throw error;
    }
  }

  async searchVetClinics(lat: number, lng: number, radius: number = 5000): Promise<VetClinic[]> {
    if (!this.service) {
      await this.initialize();
    }

    if (!this.service) {
      throw new Error('Google Places Service not initialized');
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceSearchRequest = {
        location: new google.maps.LatLng(lat, lng),
        radius: radius,
        type: 'veterinary_care',
        keyword: 'veterinary OR vet OR animal hospital OR pet clinic'
      };

      this.service!.nearbySearch(request, async (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          const clinics = await this.processResults(results, lat, lng);
          resolve(clinics);
        } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([]);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }

  private async processResults(
    results: google.maps.places.PlaceResult[],
    userLat: number,
    userLng: number
  ): Promise<VetClinic[]> {
    const clinics: VetClinic[] = [];

    for (const place of results) {
      if (!place.place_id || !place.geometry?.location) continue;

      const clinic: VetClinic = {
        id: place.place_id,
        name: place.name || 'Unknown Clinic',
        address: place.vicinity || 'Address not available',
        rating: place.rating,
        totalRatings: place.user_ratings_total,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        isEmergency: this.checkIfEmergency(place),
        isOpen: place.opening_hours?.isOpen(),
        priceLevel: place.price_level
      };

      // Calculate distance
      clinic.distance = this.calculateDistance(
        userLat, userLng,
        clinic.lat, clinic.lng
      );

      // Get photo URL if available
      if (place.photos && place.photos.length > 0) {
        clinic.photo = place.photos[0].getUrl({ maxWidth: 400 });
      }

      // Get detailed information
      const details = await this.getPlaceDetails(place.place_id);
      if (details) {
        clinic.phone = details.formatted_phone_number;
        clinic.website = details.website;
        clinic.hours = details.opening_hours?.weekday_text;
      }

      clinics.push(clinic);
    }

    // Sort by distance
    return clinics.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  private async getPlaceDetails(placeId: string): Promise<google.maps.places.PlaceResult | null> {
    if (!this.service) return null;

    return new Promise((resolve) => {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: placeId,
        fields: ['formatted_phone_number', 'website', 'opening_hours']
      };

      this.service!.getDetails(request, (result, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && result) {
          resolve(result);
        } else {
          resolve(null);
        }
      });
    });
  }

  private checkIfEmergency(place: google.maps.places.PlaceResult): boolean {
    const name = place.name?.toLowerCase() || '';
    const types = place.types || [];
    
    const emergencyKeywords = [
      'emergency', '24 hour', '24hr', '24/7', 
      'urgent', 'after hours', 'critical care'
    ];
    
    return emergencyKeywords.some(keyword => name.includes(keyword)) ||
           types.includes('emergency');
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export const googlePlacesService = new GooglePlacesService();