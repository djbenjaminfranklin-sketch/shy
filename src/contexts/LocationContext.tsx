import React, { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';
import { SearchRadius } from '../constants';
import { GeocodingResult } from '../services/google';
import { useLocationPermissions } from '../hooks/useLocationPermissions';
import { useLocationTracking } from '../hooks/useLocationTracking';
import type { LocationTrackingState } from '../hooks/useLocationTracking';
import * as Location from 'expo-location';

interface LocationContextType extends LocationTrackingState {
  permissionStatus: Location.PermissionStatus | null;
  requestPermission: () => Promise<boolean>;
  enableLocation: () => Promise<{ error: string | null }>;
  disableLocation: () => Promise<{ error: string | null }>;
  refreshLocation: () => Promise<void>;
  setSearchRadius: (radius: SearchRadius) => Promise<{ error: string | null }>;
  getProfilesInRadius: () => Promise<{ count: number; error: string | null }>;
  calculateDistance: (lat: number, lng: number) => number | null;
  reverseGeocode: () => Promise<GeocodingResult | null>;
  getLocationDisplayName: () => string;
}

const LocationContext = createContext<LocationContextType | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();

  const { permissionStatus, requestPermission } = useLocationPermissions();

  const {
    state,
    enableLocation,
    disableLocation,
    refreshLocation,
    setSearchRadius,
    getProfilesInRadius,
    calculateDistance,
    reverseGeocode,
    getLocationDisplayName,
  } = useLocationTracking({
    userId: user?.id,
    profile,
    permissionStatus,
    requestPermission,
  });

  const value: LocationContextType = {
    ...state,
    permissionStatus,
    requestPermission,
    enableLocation,
    disableLocation,
    refreshLocation,
    setSearchRadius,
    getProfilesInRadius,
    calculateDistance,
    reverseGeocode,
    getLocationDisplayName,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }

  return context;
}

export default LocationContext;
