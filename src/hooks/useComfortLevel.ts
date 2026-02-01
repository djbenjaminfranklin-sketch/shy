import { useState, useEffect, useCallback } from 'react';
import { comfortLevelsService } from '../services/supabase/comfortLevels';
import {
  getComfortLevelDisplay,
  getNextLevel,
  getPreviousLevel,
  DEFAULT_COMFORT_LEVEL,
  COMFORT_LEVELS_ORDER,
} from '../constants/comfortLevels';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import type {
  ComfortLevelType,
  ConversationComfortState,
  ComfortLevelDisplay,
} from '../types/comfortLevel';

interface UseComfortLevelReturn {
  // État
  state: ConversationComfortState | null;
  isLoading: boolean;
  error: string | null;

  // Niveau actuel de l'utilisateur
  myLevel: ComfortLevelType;
  myLevelDisplay: ComfortLevelDisplay;

  // Niveau débloqué (mutuel)
  unlockedLevel: ComfortLevelType;
  unlockedLevelDisplay: ComfortLevelDisplay;

  // Indicateurs
  isMutual: boolean;
  otherUserHigher: boolean;
  canUpgrade: boolean;
  canDowngrade: boolean;

  // Actions
  upgrade: () => Promise<boolean>;
  downgrade: () => Promise<boolean>;
  setLevel: (level: ComfortLevelType) => Promise<boolean>;
  reset: () => Promise<boolean>;
  refresh: () => Promise<void>;

  // Helpers
  isFeatureUnlocked: (requiredLevel: ComfortLevelType) => boolean;
  getAllLevels: () => ComfortLevelDisplay[];
}

export function useComfortLevel(conversationId: string | null): UseComfortLevelReturn {
  const { language } = useLanguage();
  const { user } = useAuth();
  const lang = (language || 'fr') as 'fr' | 'en';

  const [state, setState] = useState<ConversationComfortState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger l'état
  const loadState = useCallback(async () => {
    if (!conversationId || !user) {
      setState(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { state: loadedState, error: loadError } = await comfortLevelsService.getComfortState(
        conversationId,
        user.id
      );

      if (loadError) {
        setError(loadError);
      } else {
        setState(loadedState);
        setError(null);
      }
    } catch (err) {
      setError('Erreur lors du chargement');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, user]);

  // Chargement initial
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Abonnement temps réel
  useEffect(() => {
    if (!conversationId || !user) return;

    const unsubscribe = comfortLevelsService.subscribeToComfortChanges(
      conversationId,
      user.id,
      (updatedState) => {
        setState(updatedState);
      }
    );

    return unsubscribe;
  }, [conversationId, user]);

  // Valeurs calculées
  const myLevel = state?.user1Level || DEFAULT_COMFORT_LEVEL;
  const unlockedLevel = state?.unlockedLevel || DEFAULT_COMFORT_LEVEL;
  const isMutual = state?.isMutual || false;
  const otherUserHigher = state?.otherUserHigher || false;

  const myLevelDisplay = getComfortLevelDisplay(myLevel, lang);
  const unlockedLevelDisplay = getComfortLevelDisplay(unlockedLevel, lang);

  const canUpgrade = getNextLevel(myLevel) !== null;
  const canDowngrade = getPreviousLevel(myLevel) !== null;

  // Actions
  const setLevel = useCallback(
    async (level: ComfortLevelType): Promise<boolean> => {
      if (!conversationId || !user) return false;

      const result = await comfortLevelsService.updateComfortLevel(
        conversationId,
        user.id,
        level
      );

      if (result.success) {
        await loadState();
      }

      return result.success;
    },
    [conversationId, user, loadState]
  );

  const upgrade = useCallback(async (): Promise<boolean> => {
    const nextLevel = getNextLevel(myLevel);
    if (!nextLevel) return false;
    return setLevel(nextLevel);
  }, [myLevel, setLevel]);

  const downgrade = useCallback(async (): Promise<boolean> => {
    const prevLevel = getPreviousLevel(myLevel);
    if (!prevLevel) return false;
    return setLevel(prevLevel);
  }, [myLevel, setLevel]);

  const reset = useCallback(async (): Promise<boolean> => {
    if (!conversationId || !user) return false;

    const { success } = await comfortLevelsService.resetToDefault(conversationId, user.id);

    if (success) {
      await loadState();
    }

    return success;
  }, [conversationId, user, loadState]);

  // Helpers
  const isFeatureUnlocked = useCallback(
    (requiredLevel: ComfortLevelType): boolean => {
      const unlockedIndex = COMFORT_LEVELS_ORDER.indexOf(unlockedLevel);
      const requiredIndex = COMFORT_LEVELS_ORDER.indexOf(requiredLevel);
      return unlockedIndex >= requiredIndex;
    },
    [unlockedLevel]
  );

  const getAllLevels = useCallback((): ComfortLevelDisplay[] => {
    return COMFORT_LEVELS_ORDER.map((level) => getComfortLevelDisplay(level, lang));
  }, [lang]);

  return {
    state,
    isLoading,
    error,
    myLevel,
    myLevelDisplay,
    unlockedLevel,
    unlockedLevelDisplay,
    isMutual,
    otherUserHigher,
    canUpgrade,
    canDowngrade,
    upgrade,
    downgrade,
    setLevel,
    reset,
    refresh: loadState,
    isFeatureUnlocked,
    getAllLevels,
  };
}

export default useComfortLevel;
