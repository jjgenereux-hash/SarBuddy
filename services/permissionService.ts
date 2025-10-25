// Permission service for managing role-based access control
export type UserRole = 'admin' | 'scout' | 'pet_owner' | 'veterinary' | 'rescue' | 'public';

export interface MapPermissions {
  canViewAllPets: boolean;
  canViewOwnPets: boolean;
  canViewScoutLocations: boolean;
  canViewGeofences: boolean;
  canEditGeofences: boolean;
  canDispatchDrones: boolean;
  canDispatchK9Units: boolean;
  canReportSightings: boolean;
  canViewHeatmaps: boolean;
  canViewWeatherOverlay: boolean;
  canViewMissionPaths: boolean;
  canViewVolunteerLocations: boolean;
  canAccessCommandCenter: boolean;
  maxVisibleRadius: number; // in kilometers
  dataRefreshRate: number; // in seconds
}

export const rolePermissions: Record<UserRole, MapPermissions> = {
  admin: {
    canViewAllPets: true,
    canViewOwnPets: true,
    canViewScoutLocations: true,
    canViewGeofences: true,
    canEditGeofences: true,
    canDispatchDrones: true,
    canDispatchK9Units: true,
    canReportSightings: true,
    canViewHeatmaps: true,
    canViewWeatherOverlay: true,
    canViewMissionPaths: true,
    canViewVolunteerLocations: true,
    canAccessCommandCenter: true,
    maxVisibleRadius: 1000,
    dataRefreshRate: 5
  },
  scout: {
    canViewAllPets: false,
    canViewOwnPets: false,
    canViewScoutLocations: true,
    canViewGeofences: true,
    canEditGeofences: true,
    canDispatchDrones: false,
    canDispatchK9Units: false,
    canReportSightings: true,
    canViewHeatmaps: true,
    canViewWeatherOverlay: true,
    canViewMissionPaths: false,
    canViewVolunteerLocations: true,
    canAccessCommandCenter: false,
    maxVisibleRadius: 50,
    dataRefreshRate: 10
  },
  pet_owner: {
    canViewAllPets: false,
    canViewOwnPets: true,
    canViewScoutLocations: false,
    canViewGeofences: false,
    canEditGeofences: false,
    canDispatchDrones: false,
    canDispatchK9Units: false,
    canReportSightings: true,
    canViewHeatmaps: false,
    canViewWeatherOverlay: false,
    canViewMissionPaths: false,
    canViewVolunteerLocations: false,
    canAccessCommandCenter: false,
    maxVisibleRadius: 10,
    dataRefreshRate: 30
  },
  veterinary: {
    canViewAllPets: false,
    canViewOwnPets: false,
    canViewScoutLocations: false,
    canViewGeofences: false,
    canEditGeofences: false,
    canDispatchDrones: false,
    canDispatchK9Units: false,
    canReportSightings: true,
    canViewHeatmaps: false,
    canViewWeatherOverlay: false,
    canViewMissionPaths: false,
    canViewVolunteerLocations: false,
    canAccessCommandCenter: false,
    maxVisibleRadius: 5,
    dataRefreshRate: 60
  },
  rescue: {
    canViewAllPets: true,
    canViewOwnPets: false,
    canViewScoutLocations: true,
    canViewGeofences: true,
    canEditGeofences: false,
    canDispatchDrones: false,
    canDispatchK9Units: true,
    canReportSightings: true,
    canViewHeatmaps: true,
    canViewWeatherOverlay: true,
    canViewMissionPaths: true,
    canViewVolunteerLocations: true,
    canAccessCommandCenter: false,
    maxVisibleRadius: 100,
    dataRefreshRate: 15
  },
  public: {
    canViewAllPets: false,
    canViewOwnPets: false,
    canViewScoutLocations: false,
    canViewGeofences: false,
    canEditGeofences: false,
    canDispatchDrones: false,
    canDispatchK9Units: false,
    canReportSightings: false,
    canViewHeatmaps: false,
    canViewWeatherOverlay: false,
    canViewMissionPaths: false,
    canViewVolunteerLocations: false,
    canAccessCommandCenter: false,
    maxVisibleRadius: 2,
    dataRefreshRate: 120
  }
};

export function getMapPermissions(role: UserRole | undefined): MapPermissions {
  return rolePermissions[role || 'public'];
}

export function getVisibleLayers(role: UserRole | undefined): string[] {
  const permissions = getMapPermissions(role);
  const layers: string[] = ['base'];
  
  if (permissions.canViewAllPets || permissions.canViewOwnPets) layers.push('pets');
  if (permissions.canViewScoutLocations) layers.push('scouts');
  if (permissions.canViewGeofences) layers.push('geofences');
  if (permissions.canViewHeatmaps) layers.push('heatmap');
  if (permissions.canViewWeatherOverlay) layers.push('weather');
  if (permissions.canViewMissionPaths) layers.push('missions');
  if (permissions.canViewVolunteerLocations) layers.push('volunteers');
  
  return layers;
}