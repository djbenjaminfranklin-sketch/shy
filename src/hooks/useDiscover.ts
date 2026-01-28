import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { profilesService } from '../services/supabase/profiles';
import { matchesService } from '../services/supabase/matches';
import { subscriptionsService } from '../services/supabase/subscriptions';
import { ProfileWithDistance, ProfileFilters } from '../types/profile';
import { MIN_AGE, MAX_AGE, SUBSCRIPTION_PLANS } from '../constants';

const DEFAULT_FILTERS: ProfileFilters = {
  searchRadius: 25,
  minAge: MIN_AGE,
  maxAge: MAX_AGE,
  genders: [],
  intentions: [],
  hairColors: [],
  languages: [],
  interests: [],
};

export function useDiscover() {
  const { user } = useAuth();
  const { latitude, longitude, isEnabled: locationEnabled } = useLocation();

  const [profiles, setProfiles] = useState<ProfileWithDistance[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filters, setFilters] = useState<ProfileFilters>(DEFAULT_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<ProfileWithDistance | null>(null);

  // Subscription limits
  const [likesUsed, setLikesUsed] = useState(0);
  const [likesTotal, setLikesTotal] = useState(10);
  const [showPaywall, setShowPaywall] = useState(false);

  // Charger les limites d'abonnement
  const loadLimits = useCallback(async () => {
    if (!user) return;

    try {
      const { subscription } = await subscriptionsService.getUserSubscription(user.id);
      const planId = subscription?.planId || 'free';
      const plan = SUBSCRIPTION_PLANS[planId];
      setLikesTotal(plan.features.dailyLikes);

      const { limits } = await subscriptionsService.getUserLimits(user.id);
      setLikesUsed(limits?.likesUsed || 0);
    } catch (err) {
      console.error('Error loading limits:', err);
    }
  }, [user]);

  // Charger les profils
  const loadProfiles = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Charger les limites en parallèle
      await loadLimits();

      const { profiles: newProfiles, error: loadError } = await profilesService.getDiscoverProfiles(
        user.id,
        filters,
        locationEnabled && latitude ? latitude : undefined,
        locationEnabled && longitude ? longitude : undefined
      );

      if (loadError) {
        setError(loadError);
      } else {
        setProfiles(newProfiles);
        setCurrentIndex(0);
      }
    } catch (err) {
      setError('Impossible de charger les profils');
    } finally {
      setIsLoading(false);
    }
  }, [user, filters, latitude, longitude, locationEnabled, loadLimits]);

  // Charger au montage et quand les filtres changent
  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Like un profil
  const likeProfile = useCallback(async (): Promise<boolean> => {
    if (!user || currentIndex >= profiles.length) return false;

    // Vérifier les limites (sauf si illimité = -1)
    if (likesTotal !== -1 && likesUsed >= likesTotal) {
      setShowPaywall(true);
      return false;
    }

    const targetProfile = profiles[currentIndex];

    try {
      const { isMatch, error: likeError } = await matchesService.likeProfile(
        user.id,
        targetProfile.id
      );

      if (likeError) {
        console.error('Error liking profile:', likeError);
        return false;
      }

      // Incrémenter le compteur local
      setLikesUsed((prev) => prev + 1);

      // Incrémenter sur le serveur
      await subscriptionsService.incrementLikes(user.id);

      if (isMatch) {
        setMatchedProfile(targetProfile);
      }

      setCurrentIndex((prev) => prev + 1);
      return true;
    } catch (err) {
      console.error('Error liking profile:', err);
      return false;
    }
  }, [user, profiles, currentIndex, likesUsed, likesTotal]);

  // Passer un profil
  const passProfile = useCallback(async () => {
    if (!user || currentIndex >= profiles.length) return;

    const targetProfile = profiles[currentIndex];

    try {
      await matchesService.passProfile(user.id, targetProfile.id);
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error('Error passing profile:', err);
    }
  }, [user, profiles, currentIndex]);

  // Fermer le modal de match
  const closeMatch = useCallback(() => {
    setMatchedProfile(null);
  }, []);

  // Fermer le paywall
  const closePaywall = useCallback(() => {
    setShowPaywall(false);
  }, []);

  // Mettre à jour les filtres
  const updateFilters = useCallback((newFilters: ProfileFilters) => {
    setFilters(newFilters);
  }, []);

  // Rafraîchir
  const refresh = useCallback(() => {
    loadProfiles();
  }, [loadProfiles]);

  // Profils visibles (actuel + suivant)
  const visibleProfiles = profiles.slice(currentIndex, currentIndex + 2);
  const currentProfile = profiles[currentIndex];
  const hasMoreProfiles = currentIndex < profiles.length;

  return {
    profiles: visibleProfiles,
    currentProfile,
    hasMoreProfiles,
    isLoading,
    error,
    filters,
    matchedProfile,
    likeProfile,
    passProfile,
    closeMatch,
    updateFilters,
    refresh,
    // Subscription limits
    likesUsed,
    likesTotal,
    showPaywall,
    closePaywall,
  };
}

export default useDiscover;
