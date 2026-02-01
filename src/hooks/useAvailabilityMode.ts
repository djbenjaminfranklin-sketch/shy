import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { availabilityModesService } from '../services/supabase/availabilityModes';
import { notificationService } from '../services/notifications';
import { MODE_LIMITS, MODE_NOTIFICATION_TIMING, getModeLabel } from '../constants/availabilityModes';
import type {
  ModeDuration,
  ActiveModeState,
  CanActivateModeResult,
  ActivateModeParams,
} from '../types/availabilityMode';

interface UseAvailabilityModeReturn {
  // State
  activeMode: ActiveModeState | null;
  isLoading: boolean;
  error: string | null;

  // Computed
  hasActiveMode: boolean;
  remainingMinutes: number;
  remainingTimeFormatted: string;
  isExpiringSoon: boolean;

  // Limits based on subscription
  canUse72Hours: boolean;
  weeklyActivationsLimit: number;
  weeklyActivationsUsed: number;
  hasRemainingActivations: boolean;

  // Actions
  activateMode: (params: ActivateModeParams) => Promise<{ success: boolean; error?: string }>;
  deactivateMode: () => Promise<{ success: boolean; error?: string }>;
  checkCanActivate: (durationHours: ModeDuration) => Promise<CanActivateModeResult | null>;
  refreshMode: () => Promise<void>;
}

export function useAvailabilityMode(): UseAvailabilityModeReturn {
  const { user } = useAuth();
  const { currentPlan, isPlus } = useSubscription();

  const [activeMode, setActiveMode] = useState<ActiveModeState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weeklyActivationsUsed, setWeeklyActivationsUsed] = useState(0);

  // Timer pour mettre à jour le temps restant
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // ID de la notification programmée pour l'expiration
  const expirationNotificationIdRef = useRef<string | null>(null);

  // Charger le mode actif
  const refreshMode = useCallback(async () => {
    if (!user) {
      setActiveMode(null);
      setIsLoading(false);
      return;
    }

    try {
      const { mode, error: modeError } = await availabilityModesService.getActiveMode(user.id);

      if (modeError) {
        setError(modeError);
      } else {
        setActiveMode(mode);
        setError(null);
      }

      // Charger aussi le nombre d'activations de la semaine
      const { count } = await availabilityModesService.getWeeklyActivationsCount(user.id);
      setWeeklyActivationsUsed(count);
    } catch (err) {
      setError('Erreur lors du chargement du mode');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Charger au montage et quand l'utilisateur change
  useEffect(() => {
    refreshMode();
  }, [refreshMode]);

  // Timer pour mettre à jour le temps restant toutes les minutes
  useEffect(() => {
    if (activeMode?.hasActiveMode && activeMode.expiresAt) {
      const updateRemainingTime = () => {
        const now = new Date();
        const expiresAt = new Date(activeMode.expiresAt!);
        const remainingMs = expiresAt.getTime() - now.getTime();

        if (remainingMs <= 0) {
          // Mode expiré
          refreshMode();
        } else {
          // Mettre à jour le temps restant
          setActiveMode((prev) =>
            prev
              ? {
                  ...prev,
                  remainingMinutes: Math.floor(remainingMs / 60000),
                }
              : prev
          );
        }
      };

      // Mettre à jour immédiatement
      updateRemainingTime();

      // Puis toutes les minutes
      timerRef.current = setInterval(updateRemainingTime, 60000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [activeMode?.hasActiveMode, activeMode?.expiresAt, refreshMode]);

  // Computed values
  const hasActiveMode = activeMode?.hasActiveMode ?? false;
  const remainingMinutes = activeMode?.remainingMinutes ?? 0;

  const remainingTimeFormatted = useCallback(() => {
    if (remainingMinutes <= 0) return '0 min';

    const hours = Math.floor(remainingMinutes / 60);
    const mins = remainingMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins} min`;
  }, [remainingMinutes])();

  const isExpiringSoon = remainingMinutes <= MODE_NOTIFICATION_TIMING.expirationWarning && remainingMinutes > 0;

  // Subscription-based limits
  const planLimits = MODE_LIMITS[currentPlan] || MODE_LIMITS.free;
  const canUse72Hours = isPlus;
  const weeklyActivationsLimit = planLimits.activationsPerWeek;
  const hasRemainingActivations = weeklyActivationsLimit === -1 || weeklyActivationsUsed < weeklyActivationsLimit;

  // Actions
  const checkCanActivate = useCallback(
    async (durationHours: ModeDuration): Promise<CanActivateModeResult | null> => {
      if (!user) return null;

      const { result, error: checkError } = await availabilityModesService.canActivateMode(
        user.id,
        durationHours
      );

      if (checkError) {
        setError(checkError);
        return null;
      }

      return result;
    },
    [user]
  );

  const activateMode = useCallback(
    async (params: ActivateModeParams): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'Non connecté' };
      }

      setIsLoading(true);
      setError(null);

      try {
        const { result, error: activateError } = await availabilityModesService.activateMode(
          user.id,
          params
        );

        if (activateError) {
          setError(activateError);
          return { success: false, error: activateError };
        }

        if (!result?.success) {
          const errorMsg = result?.message || 'Impossible d\'activer le mode';
          setError(errorMsg);
          return { success: false, error: errorMsg };
        }

        // Programmer la notification d'expiration
        if (result.expiresAt) {
          const modeName = getModeLabel(params.modeType, 'fr');
          const notificationId = await notificationService.scheduleModeExpirationNotification(
            modeName,
            new Date(result.expiresAt),
            MODE_NOTIFICATION_TIMING.expirationWarning
          );
          if (notificationId) {
            expirationNotificationIdRef.current = notificationId;
          }
        }

        // Rafraîchir l'état
        await refreshMode();
        return { success: true };
      } catch (err) {
        const errorMsg = 'Erreur lors de l\'activation';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [user, refreshMode]
  );

  const deactivateMode = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'Non connecté' };
    }

    setIsLoading(true);
    setError(null);

    try {
      const { result, error: deactivateError } = await availabilityModesService.deactivateMode(
        user.id
      );

      if (deactivateError) {
        setError(deactivateError);
        return { success: false, error: deactivateError };
      }

      if (!result?.success) {
        const errorMsg = result?.message || 'Impossible de désactiver le mode';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Annuler la notification d'expiration programmée
      if (expirationNotificationIdRef.current) {
        await notificationService.cancelScheduledNotification(expirationNotificationIdRef.current);
        expirationNotificationIdRef.current = null;
      }

      // Rafraîchir l'état
      await refreshMode();
      return { success: true };
    } catch (err) {
      const errorMsg = 'Erreur lors de la désactivation';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshMode]);

  return {
    // State
    activeMode,
    isLoading,
    error,

    // Computed
    hasActiveMode,
    remainingMinutes,
    remainingTimeFormatted,
    isExpiringSoon,

    // Limits
    canUse72Hours,
    weeklyActivationsLimit,
    weeklyActivationsUsed,
    hasRemainingActivations,

    // Actions
    activateMode,
    deactivateMode,
    checkCanActivate,
    refreshMode,
  };
}

export default useAvailabilityMode;
