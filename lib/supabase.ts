import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
// Using direct values from project configuration
const supabaseUrl = 'https://iszecjqkufweyplfabmz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlzemVjanFrdWZ3ZXlwbGZhYm16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4ODYyOTgsImV4cCI6MjA3NTQ2MjI5OH0.EwSD8gLmD_J6wL1pt--DvOgf_q2TWDrbr7fM4Qp_UZ0';
const supabase = createClient(supabaseUrl, supabaseKey);

// Mission Planning Tables
export const createMissionPlanningTables = async () => {
  // Mission plans table
  await supabase.rpc('create_table_if_not_exists', {
    table_name: 'mission_plans',
    table_schema: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      description text,
      drone_id text NOT NULL,
      status text DEFAULT 'draft',
      estimated_duration integer,
      estimated_battery_usage integer,
      total_distance numeric,
      max_altitude numeric,
      search_area_km2 numeric,
      created_by text NOT NULL,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now(),
      scheduled_for timestamp with time zone,
      weather_conditions jsonb,
      terrain_analysis jsonb,
      optimization_score numeric
    `
  }).catch(() => {});

  // Waypoints table
  await supabase.rpc('create_table_if_not_exists', {
    table_name: 'mission_waypoints',
    table_schema: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      mission_id uuid REFERENCES mission_plans(id) ON DELETE CASCADE,
      sequence integer NOT NULL,
      latitude numeric NOT NULL,
      longitude numeric NOT NULL,
      altitude numeric NOT NULL,
      action text DEFAULT 'flyover',
      hover_duration integer DEFAULT 0,
      camera_angle integer DEFAULT 0,
      speed numeric,
      notes text,
      created_at timestamp with time zone DEFAULT now()
    `
  }).catch(() => {});

  // No-fly zones table
  await supabase.rpc('create_table_if_not_exists', {
    table_name: 'no_fly_zones',
    table_schema: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text NOT NULL,
      type text NOT NULL,
      coordinates jsonb NOT NULL,
      min_altitude numeric,
      max_altitude numeric,
      restriction_level text DEFAULT 'prohibited',
      active boolean DEFAULT true,
      created_at timestamp with time zone DEFAULT now(),
      expires_at timestamp with time zone
    `
  }).catch(() => {});

  // Search areas table
  await supabase.rpc('create_table_if_not_exists', {
    table_name: 'mission_search_areas',
    table_schema: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      mission_id uuid REFERENCES mission_plans(id) ON DELETE CASCADE,
      name text NOT NULL,
      coordinates jsonb NOT NULL,
      search_pattern text DEFAULT 'grid',
      line_spacing numeric DEFAULT 50,
      altitude numeric DEFAULT 100,
      camera_overlap integer DEFAULT 20,
      priority integer DEFAULT 1,
      created_at timestamp with time zone DEFAULT now()
    `
  }).catch(() => {});

  // Mission simulations table
  await supabase.rpc('create_table_if_not_exists', {
    table_name: 'mission_simulations',
    table_schema: `
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      mission_id uuid REFERENCES mission_plans(id) ON DELETE CASCADE,
      simulation_time integer NOT NULL,
      battery_usage integer NOT NULL,
      distance_covered numeric NOT NULL,
      issues_detected jsonb,
      optimization_suggestions jsonb,
      success_probability numeric,
      created_at timestamp with time zone DEFAULT now()
    `
  }).catch(() => {});
};

// Initialize tables
createMissionPlanningTables();

export { supabase };