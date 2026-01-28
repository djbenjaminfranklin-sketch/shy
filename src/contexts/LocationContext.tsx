import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { profilesService } from '../services/supabase/profiles';
import { useAuth } from './AuthContext';
import { SearchRadius, DEFAULT_SEARCH_RADIUS, MAX_SEARCH_RADIUS, MIN_SEARCH_RADIUS } from '../constants';
import { googlePlacesService, GeocodingResult } from '../services/google';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  isEnabled: boolean;
  isLoading: boolean;
  permissionStatus: Location.PermissionStatus | null;
  error: string | null;
  searchRadius: SearchRadius;
  // Informations de géocodage
  city: string | null;
  neighborhood: string | null;
  formattedAddress: string | null;
}

interface LocationContextType extends LocationState {
  requestPermission: () => Promise<boolean>;
  enableLocation: () => Promise<{ error: string | null }>;
  disableLocation: () => Promise<{ error: string | null }>;
  refreshLocation: () => Promise<void>;
  setSearchRadius: (radius: SearchRadius) => Promise<{ error: string | null }>;
  getProfilesInRadius: () => Promise<{ count: number; error: string | null }>;
  calculateDistance: (lat: number, lng: number) => number | null;
  // Nouvelles méthodes de géocodage
  reverseGeocode: () => Promise<GeocodingResult | null>;
  getLocationDisplayName: () => string;
}

const LocationContext = createContext<LocationContextType | null>(null);

/**
 * Calcule la distance entre deux points (formule de Haversine)
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const { user, profile } = useAuth();

  const [state, setState] = useState<LocationState>({
    latitude: profile?.latitude || null,
    longitude: profile?.longitude || null,
    isEnabled: profile?.locationEnabled || false,
    isLoading: false,
    permissionStatus: null,
    error: null,
    searchRadius: (profile?.searchRadius as SearchRadius) || DEFAULT_SEARCH_RADIUS,
    city: null,
    neighborhood: null,
    formattedAddress: null,
  });

  // Mettre a jour l'etat quand le profil change
  useEffect(() => {
    if (profile) {
      setState((prev) => ({
        ...prev,
        latitude: profile.latitude,
        longitude: profile.longitude,
        isEnabled: profile.locationEnabled,
        searchRadius: (profile.searchRadius as SearchRadius) || DEFAULT_SEARCH_RADIUS,
      }));
    }
  }, [profile]);

  // Verifier les permissions au demarrage
  useEffect(() => {
    const checkPermission = async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      setState((prev) => ({ ...prev, permissionStatus: status }));
    };

    checkPermission();
  }, []);

  // Demander la permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setState((prev) => ({ ...prev, permissionStatus: status }));
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }, []);

  // Activer la geolocalisation
  const enableLocation = useCallback(async (): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: 'Utilisateur non connecte' };
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Verifier/demander la permission
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: 'Permission de localisation refusee',
        }));
        return { error: 'Permission de localisation refusee' };
      }

      // Recuperer la position avec haute précision
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High, // Précision maximale
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const { latitude, longitude } = location.coords;

      console.log(`📍 Position GPS: ${latitude}, ${longitude} (précision: ${location.coords.accuracy}m)`);

      // Mettre a jour le profil
      const { error } = await profilesService.updateLocation(user.id, latitude, longitude);

      if (error) {
        setState((prev) => ({ ...prev, isLoading: false, error }));
        return { error };
      }

      // Géocodage inverse pour obtenir l'adresse
      let city = null;
      let neighborhood = null;
      let formattedAddress = null;

      try {
        const { result } = await googlePlacesService.reverseGeocode(latitude, longitude);
        if (result) {
          city = result.city;
          neighborhood = result.neighborhood;
          formattedAddress = result.formattedAddress;
          console.log(`📍 Adresse: ${formattedAddress}`);
        }
      } catch (geoError) {
        console.warn('Géocodage échoué, position GPS uniquement');
      }

      setState((prev) => ({
        ...prev,
        latitude,
        longitude,
        isEnabled: true,
        isLoading: false,
        error: null,
        city,
        neighborhood,
        formattedAddress,
      }));

      return { error: null };
    } catch (err) {
      const errorMessage = 'Impossible de recuperer votre position';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return { error: errorMessage };
    }
  }, [user, requestPermission]);

  // Desactiver la geolocalisation
  const disableLocation = useCallback(async (): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: 'Utilisateur non connecte' };
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await profilesService.hideLocation(user.id);

      if (error) {
        setState((prev) => ({ ...prev, isLoading: false, error }));
        return { error };
      }

      setState((prev) => ({
        ...prev,
        isEnabled: false,
        isLoading: false,
        error: null,
      }));

      return { error: null };
    } catch (err) {
      const errorMessage = 'Impossible de masquer votre position';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return { error: errorMessage };
    }
  }, [user]);

  // Rafraichir la position
  const refreshLocation = useCallback(async () => {
    if (!state.isEnabled || !user) return;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      await profilesService.updateLocation(user.id, latitude, longitude);

      setState((prev) => ({
        ...prev,
        latitude,
        longitude,
      }));
    } catch (err) {
      // Ignorer les erreurs silencieusement
    }
  }, [state.isEnabled, user]);

  // Definir le rayon de recherche
  const setSearchRadius = useCallback(async (radius: SearchRadius): Promise<{ error: string | null }> => {
    if (!user) {
      return { error: 'Utilisateur non connecte' };
    }

    // Valider le rayon
    if (radius < MIN_SEARCH_RADIUS || radius > MAX_SEARCH_RADIUS) {
      return { error: `Le rayon doit etre entre ${MIN_SEARCH_RADIUS} et ${MAX_SEARCH_RADIUS} km` };
    }

    try {
      const { error } = await profilesService.updateProfile(user.id, { searchRadius: radius });

      if (error) {
        return { error };
      }

      setState((prev) => ({
        ...prev,
        searchRadius: radius,
      }));

      return { error: null };
    } catch (err) {
      return { error: 'Impossible de mettre a jour le rayon de recherche' };
    }
  }, [user]);

  // Obtenir le nombre de profils dans le rayon actuel
  const getProfilesInRadius = useCallback(async (): Promise<{ count: number; error: string | null }> => {
    if (!user || !state.latitude || !state.longitude) {
      return { count: 0, error: 'Position non disponible' };
    }

    try {
      const { profiles, error } = await profilesService.getDiscoverProfiles(
        user.id,
        {
          searchRadius: state.searchRadius,
          minAge: profile?.minAgeFilter || 18,
          maxAge: profile?.maxAgeFilter || 99,
          genders: profile?.genderFilter || [],
          intentions: [],
          hairColors: [],
          languages: [],
          interests: [],
        },
        state.latitude,
        state.longitude
      );

      if (error) {
        return { count: 0, error };
      }

      // Filtrer uniquement les profils dans le rayon
      const profilesInRadius = profiles.filter((p) => {
        if (p.distance === null) return false;
        return p.distance <= state.searchRadius;
      });

      return { count: profilesInRadius.length, error: null };
    } catch (err) {
      return { count: 0, error: 'Erreur lors du comptage des profils' };
    }
  }, [user, state.latitude, state.longitude, state.searchRadius, profile]);

  // Calculer la distance vers un point
  const calculateDistance = useCallback((lat: number, lng: number): number | null => {
    if (!state.latitude || !state.longitude) {
      return null;
    }

    return haversineDistance(state.latitude, state.longitude, lat, lng);
  }, [state.latitude, state.longitude]);

  // Géocodage inverse : obtenir l'adresse à partir des coordonnées
  const reverseGeocode = useCallback(async (): Promise<GeocodingResult | null> => {
    if (!state.latitude || !state.longitude) {
      return null;
    }

    try {
      const { result, error } = await googlePlacesService.reverseGeocode(
        state.latitude,
        state.longitude
      );

      if (error || !result) {
        console.warn('Reverse geocoding failed:', error);
        return null;
      }

      // Mettre à jour l'état avec les infos de géocodage
      setState((prev) => ({
        ...prev,
        city: result.city,
        neighborhood: result.neighborhood,
        formattedAddress: result.formattedAddress,
      }));

      return result;
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
      return null;
    }
  }, [state.latitude, state.longitude]);

  // Obtenir un nom d'affichage pour la position actuelle
  const getLocationDisplayName = useCallback((): string => {
    if (state.neighborhood && state.city) {
      return `${state.neighborhood}, ${state.city}`;
    }
    if (state.city) {
      return state.city;
    }
    if (state.formattedAddress) {
      return state.formattedAddress;
    }
    if (state.latitude && state.longitude) {
      return `${state.latitude.toFixed(2)}°, ${state.longitude.toFixed(2)}°`;
    }
    return 'Position non disponible';
  }, [state.neighborhood, state.city, state.formattedAddress, state.latitude, state.longitude]);

  const value: LocationContextType = {
    ...state,
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
