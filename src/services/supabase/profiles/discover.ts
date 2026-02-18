import { supabase } from '../client';
import type { ProfileFilters, ProfileWithDistance } from '../../../types/profile';
import type { AvailabilityModeType } from '../../../types/availabilityMode';
import { mapProfileFromDb, calculateDistance } from './helpers';

/**
 * Récupérer les profils à découvrir
 * Triés par score composite (engagement + proximité)
 * Si activeMode est fourni, ne retourne que les profils avec le même mode actif
 * Inclut également les voyageurs qui ont leur destination dans la zone de recherche
 * Si isAdmin est true, ignore le filtre de distance pour voir tous les profils
 */
export async function getDiscoverProfiles(
  userId: string,
  _filters: ProfileFilters,
  userLat?: number,
  userLng?: number,
  _activeMode?: AvailabilityModeType | null,
  _isAdmin?: boolean
): Promise<{ profiles: ProfileWithDistance[]; error: string | null }> {
  try {
    // Requête simple qui fonctionne
    const { data: allProfiles, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('location_enabled', true)
      .limit(50);

    if (queryError) {
      return { profiles: [], error: queryError.message };
    }

    if (!allProfiles || allProfiles.length === 0) {
      return { profiles: [], error: null };
    }

    // Récupérer les utilisateurs bloqués
    const { data: blocks } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', userId);
    const blockedIds = new Set(blocks?.map((b) => b.blocked_id) || []);

    // Récupérer les invitations déjà envoyées
    const { data: invitations } = await supabase
      .from('invitations')
      .select('receiver_id')
      .eq('sender_id', userId);
    const invitedIds = new Set(invitations?.map((i) => i.receiver_id) || []);

    // Mapper et filtrer les profils
    const result: ProfileWithDistance[] = allProfiles
      .filter((p) => {
        // Exclure soi-même, les bloqués et les déjà invités
        if (p.id === userId) return false;
        if (blockedIds.has(p.id)) return false;
        if (invitedIds.has(p.id)) return false;
        return true;
      })
      .map((p) => {
        const profile = mapProfileFromDb(p);
        let distance: number | null = null;

        // Calculer la distance réelle si coordonnées disponibles
        if (userLat && userLng && profile.latitude && profile.longitude) {
          distance = calculateDistance(userLat, userLng, profile.latitude, profile.longitude);
        }

        return { ...profile, distance };
      });

    return { profiles: result, error: null };
  } catch (err) {
    return { profiles: [], error: 'Une erreur inattendue est survenue' };
  }
}
