import { supabase } from '@/lib/supabase';
import { geocodeLocation } from './geocodingService';

export interface ImportRecord {
  name: string;
  species: string;
  breed?: string;
  color?: string;
  age?: string;
  size?: string;
  status: 'lost' | 'found' | 'reunited';
  last_seen_date?: string;
  last_seen_location?: string;
  description?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  microchip_id?: string;
  reward?: number;
  image_url?: string;
  latitude?: number;
  longitude?: number;
}

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  duplicates: number;
  errors: ValidationError[];
  records: ImportRecord[];
}

export class CSVImportService {
  async parseCSV(file: File): Promise<ImportRecord[]> {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) throw new Error('CSV file is empty or has no data');
    
    const headers = this.parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const records: ImportRecord[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const record: any = {};
      
      headers.forEach((header, index) => {
        const value = values[index]?.trim();
        if (value) {
          const mappedField = this.mapFieldName(header);
          if (mappedField) {
            record[mappedField] = this.parseFieldValue(mappedField, value);
          }
        }
      });
      
      if (record.name) records.push(record);
    }
    
    return records;
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  private mapFieldName(header: string): keyof ImportRecord | null {
    const fieldMap: Record<string, keyof ImportRecord> = {
      'name': 'name',
      'pet name': 'name',
      'species': 'species',
      'type': 'species',
      'breed': 'breed',
      'color': 'color',
      'age': 'age',
      'size': 'size',
      'status': 'status',
      'last seen date': 'last_seen_date',
      'date': 'last_seen_date',
      'last seen location': 'last_seen_location',
      'location': 'last_seen_location',
      'address': 'last_seen_location',
      'description': 'description',
      'notes': 'description',
      'contact name': 'contact_name',
      'owner': 'contact_name',
      'contact phone': 'contact_phone',
      'phone': 'contact_phone',
      'contact email': 'contact_email',
      'email': 'contact_email',
      'microchip': 'microchip_id',
      'chip id': 'microchip_id',
      'reward': 'reward',
      'image': 'image_url',
      'photo': 'image_url',
      'latitude': 'latitude',
      'lat': 'latitude',
      'longitude': 'longitude',
      'lng': 'longitude',
      'lon': 'longitude'
    };
    
    return fieldMap[header] || null;
  }

  private parseFieldValue(field: keyof ImportRecord, value: string): any {
    switch (field) {
      case 'reward':
        return parseFloat(value.replace(/[^0-9.]/g, ''));
      case 'latitude':
      case 'longitude':
        return parseFloat(value);
      case 'status':
        const status = value.toLowerCase();
        return ['lost', 'found', 'reunited'].includes(status) ? status : 'lost';
      default:
        return value;
    }
  }

  async validateRecords(records: ImportRecord[]): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];
    
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const row = i + 2; // Account for header row and 0-index
      
      // Required fields
      if (!record.name) {
        errors.push({ row, field: 'name', message: 'Pet name is required' });
      }
      
      if (!record.species) {
        errors.push({ row, field: 'species', message: 'Species is required' });
      }
      
      // Validate email format
      if (record.contact_email && !this.isValidEmail(record.contact_email)) {
        errors.push({ row, field: 'contact_email', message: 'Invalid email format' });
      }
      
      // Validate phone format
      if (record.contact_phone && !this.isValidPhone(record.contact_phone)) {
        errors.push({ row, field: 'contact_phone', message: 'Invalid phone format' });
      }
      
      // Validate coordinates
      if (record.latitude && (record.latitude < -90 || record.latitude > 90)) {
        errors.push({ row, field: 'latitude', message: 'Invalid latitude' });
      }
      
      if (record.longitude && (record.longitude < -180 || record.longitude > 180)) {
        errors.push({ row, field: 'longitude', message: 'Invalid longitude' });
      }
    }
    
    return errors;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidPhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 15;
  }

  async geocodeAddresses(records: ImportRecord[]): Promise<ImportRecord[]> {
    const geocoded = [];
    
    for (const record of records) {
      if (record.last_seen_location && (!record.latitude || !record.longitude)) {
        try {
          const result = await geocodeLocation(record.last_seen_location);
          if ('latitude' in result && 'longitude' in result) {
            record.latitude = result.latitude;
            record.longitude = result.longitude;
          }
        } catch (error) {
          console.error(`Failed to geocode address: ${record.last_seen_location}`, error);
        }
      }
      geocoded.push(record);
    }
    
    return geocoded;
  }

  async detectDuplicates(records: ImportRecord[]): Promise<Set<number>> {
    const duplicateIndices = new Set<number>();
    
    // Check for duplicates within the import
    for (let i = 0; i < records.length; i++) {
      for (let j = i + 1; j < records.length; j++) {
        if (this.isDuplicate(records[i], records[j])) {
          duplicateIndices.add(j);
        }
      }
    }
    
    // Check against existing database records
    const { data: existingPets } = await supabase
      .from('pets')
      .select('name, species, microchip_id, contact_email, contact_phone');
    
    if (existingPets) {
      for (let i = 0; i < records.length; i++) {
        const isDup = existingPets.some(existing => 
          this.isDuplicate(records[i], existing as any)
        );
        if (isDup) duplicateIndices.add(i);
      }
    }
    
    return duplicateIndices;
  }

  private isDuplicate(record1: ImportRecord, record2: ImportRecord): boolean {
    // Check microchip ID
    if (record1.microchip_id && record2.microchip_id) {
      return record1.microchip_id === record2.microchip_id;
    }
    
    // Check name + species + contact
    const sameName = record1.name?.toLowerCase() === record2.name?.toLowerCase();
    const sameSpecies = record1.species?.toLowerCase() === record2.species?.toLowerCase();
    const sameContact = (
      (record1.contact_email && record1.contact_email === record2.contact_email) ||
      (record1.contact_phone && record1.contact_phone === record2.contact_phone)
    );
    
    return sameName && sameSpecies && sameContact;
  }

  async importRecords(
    records: ImportRecord[],
    skipDuplicates: boolean = true,
    userId?: string
  ): Promise<ImportResult> {
    const errors: ValidationError[] = [];
    let imported = 0;
    let failed = 0;
    let duplicates = 0;
    
    const duplicateIndices = await this.detectDuplicates(records);
    
    for (let i = 0; i < records.length; i++) {
      if (skipDuplicates && duplicateIndices.has(i)) {
        duplicates++;
        continue;
      }
      
      try {
        const petData = this.mapToPetData(records[i], userId);
        const { error } = await supabase.from('pets').insert(petData);
        
        if (error) throw error;
        imported++;
      } catch (error: any) {
        failed++;
        errors.push({
          row: i + 2,
          field: 'general',
          message: error.message || 'Failed to import record'
        });
      }
    }
    
    return {
      success: failed === 0,
      imported,
      failed,
      duplicates,
      errors,
      records
    };
  }

  private mapToPetData(record: ImportRecord, userId?: string): any {
    return {
      name: record.name,
      species: record.species,
      breed: record.breed,
      color: record.color,
      age: record.age,
      size: record.size,
      status: record.status || 'lost',
      last_seen_date: record.last_seen_date || new Date().toISOString(),
      last_seen_location: record.last_seen_location,
      description: record.description,
      contact_name: record.contact_name,
      contact_phone: record.contact_phone,
      contact_email: record.contact_email,
      microchip_id: record.microchip_id,
      reward: record.reward,
      image_url: record.image_url,
      latitude: record.latitude,
      longitude: record.longitude,
      owner_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}

export const csvImportService = new CSVImportService();