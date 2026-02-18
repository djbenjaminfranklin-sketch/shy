import { supabase } from '../client';
import type { CompatibleProfile } from '../../../types/icebreaker';
import { calculateDistance } from './utils';

// Number of profiles to contact with each Ice Breaker
const PROFILES_PER_ICEBREAKER = 5;

/**
 * Find compatible profiles for Ice Breaker
 */
export async function findCompatibleProfiles(
  userId: string,
  userProfile: { interests: string[] | null; intention: string; gender: string; gender_filter: string[] | null; latitude: number | null; longitude: number | null }
): Promise<CompatibleProfile[]> {
  try {
    // Build query for compatible profiles
    let query = supabase
      .from('profiles')
      .select('id, display_name, interests, intention, latitude, longitude')
      .neq('id', userId)
      .eq('is_active', true);

    // Filter by gender preference
    if (userProfile.gender_filter && userProfile.gender_filter.length > 0) {
      query = query.in('gender', userProfile.gender_filter);
    }

    // Filter by intention (same intention = more compatible)
    if (userProfile.intention) {
      query = query.eq('intention', userProfile.intention);
    }

    // Exclude already contacted/matched profiles
    const { data: existingConversations } = await supabase
      .from('conversations')
      .select('participant_ids')
      .contains('participant_ids', [userId]);

    const excludeIds = [userId];
    if (existingConversations) {
      existingConversations.forEach(conv => {
        conv.participant_ids.forEach((id: string) => {
          if (id !== userId && !excludeIds.includes(id)) {
            excludeIds.push(id);
          }
        });
      });
    }

    // Also exclude pending invitations
    const { data: pendingInvitations } = await supabase
      .from('invitations')
      .select('receiver_id')
      .eq('sender_id', userId)
      .eq('status', 'pending');

    if (pendingInvitations) {
      pendingInvitations.forEach(inv => {
        if (!excludeIds.includes(inv.receiver_id)) {
          excludeIds.push(inv.receiver_id);
        }
      });
    }

    query = query.not('id', 'in', `(${excludeIds.join(',')})`);

    // Limit results
    query = query.limit(PROFILES_PER_ICEBREAKER * 2); // Get more to filter

    const { data: profiles, error } = await query;

    if (error || !profiles) {
      return [];
    }

    // Score and sort profiles by compatibility
    const scoredProfiles = profiles.map(profile => {
      let score = 0;

      // Score based on common interests
      const userInterests = userProfile.interests || [];
      const profileInterests = profile.interests || [];
      const commonInterests = userInterests.filter(i => profileInterests.includes(i));
      score += commonInterests.length * 10;

      // Score based on distance (if available)
      if (userProfile.latitude && userProfile.longitude && profile.latitude && profile.longitude) {
        const distance = calculateDistance(
          userProfile.latitude, userProfile.longitude,
          profile.latitude, profile.longitude
        );
        if (distance < 10) score += 20;
        else if (distance < 25) score += 10;
        else if (distance < 50) score += 5;
      }

      return { ...profile, score, commonInterests };
    });

    // Sort by score and take top N
    scoredProfiles.sort((a, b) => b.score - a.score);

    return scoredProfiles.slice(0, PROFILES_PER_ICEBREAKER).map(p => ({
      id: p.id,
      display_name: p.display_name,
      interests: p.interests || [],
      intention: p.intention,
    }));
  } catch (err) {
    return [];
  }
}
