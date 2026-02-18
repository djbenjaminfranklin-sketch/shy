import { useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import { profilesService } from '../services/supabase/profiles';
import { googlePlacesService, GeocodingResult } from '../services/google';
import { SearchRadius, DEFAULT_SEARCH_RADIUS, MAX_SEARCH_RADIUS, MIN_SEARCH_RADIUS } from '../constants';
import { approximateCoordinates, haversineDistance, geocodePosition } from '../utils/locationUtils';
import type { Profile } from '../types/profile';

export interface LocationTrackingState {
  latitude: number | null;
  longitude: number | null;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  searchRadius: SearchRadius;
  city: string | null;
  neighborhood: string | null;
  formattedAddress: string | null;
}

interface UseLocationTrackingParams {
  userId: string | undefined;
  profile: Profile | null;
  permissionStatus: Location.PermissionStatus | null;
  requestPermission: () => Promise<boolean>;
}

interface UseLocationTrackingReturn {
  state: LocationTrackingState;
  enableLocation: () => Promise<{ error: string | null }>;
  disableLocation: () => Promise<{ error: string | null }>;
  refreshLocation: () => Promise<void>;
  setSearchRadius: (radius: SearchRadius) => Promise<{ error: string | null }>;
  getProfilesInRadius: () => Promise<{ count: number; error: string | null }>;
  calculateDistance: (lat: number, lng: number) => number | null;
  reverseGeocode: () => Promise<GeocodingResult | null>;
  getLocationDisplayName: () => string;
}

/**
 * Hook pour le suivi de la position, le calcul de distance et le geocodage
 */
export function useLocationTracking({
  userId,
  profile,
  permissionStatus,
  requestPermission,
}: UseLocationTrackingParams): UseLocationTrackingReturn {
  const [state, setState] = useState<LocationTrackingState>({
    latitude: profile?.latitude || null,
    longitude: profile?.longitude || null,
    isEnabled: profile?.locationEnabled || false,
    isLoading: false,
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

  // Charger la ville automatiquement si on a des coordonnees mais pas de ville
  useEffect(() => {
    const loadCity = async () => {
      if (state.latitude && state.longitude && !state.city && state.isEnabled) {
        const geoInfo = await geocodePosition(state.latitude, state.longitude);
        if (geoInfo.city) {
          setState((prev) => ({ ...prev, ...geoInfo }));
        }
      }
    };
    loadCity();
  }, [state.latitude, state.longitude, state.isEnabled, state.city]);

  // Auto-refresh la position au demarrage si la localisation est activee
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!state.isEnabled || !userId || state.isLoading || permissionStatus !== 'granted') return;

      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = approximateCoordinates(
          location.coords.latitude,
          location.coords.longitude
        );

        // Mettre a jour seulement si la position a significativement change (> 500m)
        if (state.latitude && state.longitude) {
          const distance = haversineDistance(state.latitude, state.longitude, latitude, longitude);
          if (distance < 0.5) return;
        }

        await profilesService.updateLocation(userId, latitude, longitude);
        const geoInfo = await geocodePosition(latitude, longitude);
        setState((prev) => ({ ...prev, latitude, longitude, ...geoInfo }));
      } catch (err) {
        console.error('[GPS] Auto-refresh: error getting position', err);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [userId, permissionStatus]);

  // Activer la geolocalisation
  const enableLocation = useCallback(async (): Promise<{ error: string | null }> => {
    if (!userId) return { error: 'Utilisateur non connecte' };

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setState((prev) => ({ ...prev, isLoading: false, error: 'Permission de localisation refusee' }));
        return { error: 'Permission de localisation refusee' };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      });
      const { latitude, longitude } = approximateCoordinates(
        location.coords.latitude,
        location.coords.longitude
      );

      const { error } = await profilesService.updateLocation(userId, latitude, longitude);
      if (error) {
        setState((prev) => ({ ...prev, isLoading: false, error }));
        return { error };
      }

      const geoInfo = await geocodePosition(latitude, longitude);
      setState((prev) => ({
        ...prev, latitude, longitude, isEnabled: true, isLoading: false, error: null, ...geoInfo,
      }));
      return { error: null };
    } catch (err) {
      const errorMessage = 'Impossible de recuperer votre position';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return { error: errorMessage };
    }
  }, [userId, requestPermission]);

  // Desactiver la geolocalisation
  const disableLocation = useCallback(async (): Promise<{ error: string | null }> => {
    if (!userId) return { error: 'Utilisateur non connecte' };

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { error } = await profilesService.hideLocation(userId);
      if (error) {
        setState((prev) => ({ ...prev, isLoading: false, error }));
        return { error };
      }
      setState((prev) => ({ ...prev, isEnabled: false, isLoading: false, error: null }));
      return { error: null };
    } catch (err) {
      const errorMessage = 'Impossible de masquer votre position';
      setState((prev) => ({ ...prev, isLoading: false, error: errorMessage }));
      return { error: errorMessage };
    }
  }, [userId]);

  // Rafraichir la position
  const refreshLocation = useCallback(async () => {
    if (!state.isEnabled || !userId) return;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = approximateCoordinates(
        location.coords.latitude,
        location.coords.longitude
      );
      await profilesService.updateLocation(userId, latitude, longitude);
      const geoInfo = await geocodePosition(latitude, longitude);
      setState((prev) => ({ ...prev, latitude, longitude, ...geoInfo }));
    } catch (err) {
      console.error('[GPS] refreshLocation: error', err);
    }
  }, [state.isEnabled, userId]);

  // Definir le rayon de recherche
  const setSearchRadius = useCallback(async (radius: SearchRadius): Promise<{ error: string | null }> => {
    if (!userId) return { error: 'Utilisateur non connecte' };
    if (radius < MIN_SEARCH_RADIUS || radius > MAX_SEARCH_RADIUS) {
      return { error: `Le rayon doit etre entre ${MIN_SEARCH_RADIUS} et ${MAX_SEARCH_RADIUS} km` };
    }
    try {
      const { error } = await profilesService.updateProfile(userId, { searchRadius: radius });
      if (error) return { error };
      setState((prev) => ({ ...prev, searchRadius: radius }));
      return { error: null };
    } catch (err) {
      return { error: 'Impossible de mettre a jour le rayon de recherche' };
    }
  }, [userId]);

  // Obtenir le nombre de profils dans le rayon actuel
  const getProfilesInRadius = useCallback(async (): Promise<{ count: number; error: string | null }> => {
    if (!userId || !state.latitude || !state.longitude) {
      return { count: 0, error: 'Position non disponible' };
    }
    try {
      const { profiles, error } = await profilesService.getDiscoverProfiles(
        userId,
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
      if (error) return { count: 0, error };
      const profilesInRadius = profiles.filter((p) => {
        if (p.distance === null) return false;
        return p.distance <= state.searchRadius;
      });
      return { count: profilesInRadius.length, error: null };
    } catch (err) {
      return { count: 0, error: 'Erreur lors du comptage des profils' };
    }
  }, [userId, state.latitude, state.longitude, state.searchRadius, profile]);

  // Calculer la distance vers un point
  const calculateDistance = useCallback((lat: number, lng: number): number | null => {
    if (!state.latitude || !state.longitude) return null;
    return haversineDistance(state.latitude, state.longitude, lat, lng);
  }, [state.latitude, state.longitude]);

  // Geocodage inverse
  const reverseGeocode = useCallback(async (): Promise<GeocodingResult | null> => {
    if (!state.latitude || !state.longitude) return null;
    try {
      const { result, error } = await googlePlacesService.reverseGeocode(state.latitude, state.longitude);
      if (error || !result) return null;
      setState((prev) => ({
        ...prev,
        city: result.city,
        neighborhood: result.neighborhood,
        formattedAddress: result.formattedAddress,
      }));
      return result;
    } catch (error) {
      return null;
    }
  }, [state.latitude, state.longitude]);

  // Obtenir un nom d'affichage pour la position actuelle
  const getLocationDisplayName = useCallback((): string => {
    if (state.city) return state.city;
    if (state.neighborhood) return state.neighborhood;
    if (state.formattedAddress) {
      const parts = state.formattedAddress.split(',');
      if (parts.length >= 2) return parts[parts.length - 2].trim();
      return state.formattedAddress;
    }
    if (state.latitude && state.longitude) return 'Ma position';
    return 'Position non disponible';
  }, [state.neighborhood, state.city, state.formattedAddress, state.latitude, state.longitude]);

  return {
    state,
    enableLocation,
    disableLocation,
    refreshLocation,
    setSearchRadius,
    getProfilesInRadius,
    calculateDistance,
    reverseGeocode,
    getLocationDisplayName,
  };
}

export default useLocationTracking;
