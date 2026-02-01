import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { travelModeService } from '../services/supabase/travelMode';
import type { TravelMode, TravelModeFormData, TravelLocation } from '../types/travelMode';
import { PLAN_FEATURES } from '../constants/subscriptions';

export function useTravelMode() {
  const { user } = useAuth();
  const { currentPlan } = useSubscription();

  const [travelMode, setTravelMode] = useState<TravelMode | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur a accès au mode voyage (Premium uniquement)
  const canUseTravelMode = PLAN_FEATURES[currentPlan]?.travelModeEnabled ?? false;

  // Charger le mode voyage actif
  const loadTravelMode = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { travelMode: mode, error: err } = await travelModeService.getActiveTravelMode(user.id);

    if (err) {
      setError(err);
    } else {
      setTravelMode(mode);
      setError(null);
    }
    setIsLoading(false);
  }, [user?.id]);

  // Charger au montage
  useEffect(() => {
    loadTravelMode();
  }, [loadTravelMode]);

  // Activer le mode voyage
  const activateTravelMode = useCallback(
    async (formData: TravelModeFormData): Promise<{ success: boolean; error: string | null }> => {
      if (!user?.id) {
        return { success: false, error: 'Utilisateur non connecté' };
      }

      if (!canUseTravelMode) {
        return { success: false, error: 'Mode Voyage réservé aux abonnés Premium' };
      }

      setIsLoading(true);
      const { travelMode: mode, error: err } = await travelModeService.activateTravelMode(
        user.id,
        formData
      );

      if (err) {
        setError(err);
        setIsLoading(false);
        return { success: false, error: err };
      }

      setTravelMode(mode);
      setError(null);
      setIsLoading(false);
      return { success: true, error: null };
    },
    [user?.id, canUseTravelMode]
  );

  // Désactiver le mode voyage
  const deactivateTravelMode = useCallback(async (): Promise<{
    success: boolean;
    error: string | null;
  }> => {
    if (!user?.id) {
      return { success: false, error: 'Utilisateur non connecté' };
    }

    setIsLoading(true);
    const { error: err } = await travelModeService.deactivateTravelMode(user.id);

    if (err) {
      setError(err);
      setIsLoading(false);
      return { success: false, error: err };
    }

    setTravelMode(null);
    setError(null);
    setIsLoading(false);
    return { success: true, error: null };
  }, [user?.id]);

  // Rechercher une ville
  const searchCities = useCallback(async (query: string): Promise<TravelLocation[]> => {
    if (query.length < 2) return [];
    return travelModeService.searchCities(query);
  }, []);

  // Calculer les jours restants avant l'arrivée
  const daysUntilArrival = travelMode
    ? Math.ceil(
        (new Date(travelMode.arrivalDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null;

  // Vérifier si l'utilisateur est "en voyage" (date d'arrivée passée)
  const isCurrentlyTraveling = travelMode
    ? new Date(travelMode.arrivalDate) <= new Date()
    : false;

  return {
    travelMode,
    isLoading,
    error,
    canUseTravelMode,
    hasActiveTravelMode: !!travelMode,
    daysUntilArrival,
    isCurrentlyTraveling,
    activateTravelMode,
    deactivateTravelMode,
    searchCities,
    refresh: loadTravelMode,
  };
}

export default useTravelMode;
