import { supabase } from '../client';
import type { IceBreakerCandidate } from '../../../types/icebreaker';
import { generatePersonalizedMessage } from './messages';
import { calculateDistance } from './utils';

// Number of profiles to contact with each Ice Breaker
const PROFILES_PER_ICEBREAKER = 5;

/**
 * Get Ice Breaker candidates for preview (new flow)
 * Returns 5 candidates + extra for replacements
 */
export async function getCandidates(
  userId: string,
  getUserIceBreakerState: (userId: string) => Promise<{ state: { iceBreakersAvailable: number }; error: string | null }>
): Promise<{
  candidates: IceBreakerCandidate[];
  replacementPool: IceBreakerCandidate[];
  error: string | null;
}> {
  try {
    // Get current state
    const { state, error: stateError } = await getUserIceBreakerState(userId);

    if (stateError) {
      return { candidates: [], replacementPool: [], error: stateError };
    }

    if (state.iceBreakersAvailable <= 0) {
      return { candidates: [], replacementPool: [], error: 'Aucun Ice Breaker disponible' };
    }

    // Get user's profile for matching
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('interests, intention, gender, gender_filter, latitude, longitude')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return { candidates: [], replacementPool: [], error: 'Impossible de récupérer votre profil: ' + (profileError?.message || 'profil non trouvé') };
    }

    // Find compatible profiles with photos
    const allCandidates = await findCandidatesWithDetails(userId, userProfile);

    if (allCandidates.length === 0) {
      return { candidates: [], replacementPool: [], error: 'Aucun profil compatible trouvé. Réessayez plus tard !' };
    }

    // Split into main candidates and replacement pool
    const candidates = allCandidates.slice(0, PROFILES_PER_ICEBREAKER);
    const replacementPool = allCandidates.slice(PROFILES_PER_ICEBREAKER);

    return { candidates, replacementPool, error: null };
  } catch (err) {
    return { candidates: [], replacementPool: [], error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Find compatible profiles with full details for preview
 */
export async function findCandidatesWithDetails(
  userId: string,
  userProfile: { interests: string[] | null; intention: string; gender: string; gender_filter: string[] | null; latitude: number | null; longitude: number | null }
): Promise<IceBreakerCandidate[]> {
  try {
    // Simple query - get ALL profiles except current user
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId)
      .limit(30);

    if (error) {
      return [];
    }

    if (!profiles || profiles.length === 0) {
      return [];
    }

    // Calculate age from birth_date
    const calculateAgeFromBirthDate = (birthDate: string): number => {
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    // Get primary photo URL
    const getPhotoUrl = (photos: string[] | null): string | null => {
      if (photos && photos.length > 0) {
        return photos[0];
      }
      return null;
    };

    // Score and sort profiles by compatibility
    const userInterests = userProfile.interests || [];

    const scoredProfiles = profiles.map(profile => {
      let score = 0;

      // Score based on common interests
      const profileInterests = profile.interests || [];
      const commonInterests = userInterests.filter((i: string) => profileInterests.includes(i));
      score += commonInterests.length * 10;

      // Bonus for matching intention
      if (userProfile.intention && profile.intention === userProfile.intention) {
        score += 15;
      }

      // Calculate distance
      let distance: number | undefined;
      if (userProfile.latitude && userProfile.longitude && profile.latitude && profile.longitude) {
        distance = Math.round(calculateDistance(
          userProfile.latitude, userProfile.longitude,
          profile.latitude, profile.longitude
        ));
        if (distance < 10) score += 20;
        else if (distance < 25) score += 10;
        else if (distance < 50) score += 5;
      }

      // Generate personalized message
      const message = generatePersonalizedMessage(
        { id: profile.id, display_name: profile.display_name, interests: profileInterests, intention: profile.intention },
        userInterests
      );

      return {
        id: profile.id,
        name: profile.display_name,
        age: calculateAgeFromBirthDate(profile.birth_date),
        photoUrl: getPhotoUrl(profile.photos),
        interests: profileInterests,
        commonInterests,
        intention: profile.intention,
        distance,
        message,
        approved: false,
        score,
      };
    });

    // Sort by score and remove the score from final result
    scoredProfiles.sort((a, b) => b.score - a.score);

    return scoredProfiles.map(({ score, ...candidate }) => candidate);
  } catch (err) {
    return [];
  }
}
