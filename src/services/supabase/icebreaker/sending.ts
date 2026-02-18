import { supabase } from '../client';
import type { CompatibleProfile, IceBreakerResult, IceBreakerCandidate } from '../../../types/icebreaker';
import { generatePersonalizedMessage, sendIceBreakerMessage } from './messages';

/**
 * Use an Ice Breaker - find compatible profiles and send personalized messages
 */
export async function useIceBreaker(
  userId: string,
  getUserIceBreakerState: (userId: string) => Promise<{ state: { iceBreakersAvailable: number; totalIceBreakersUsed: number }; error: string | null }>,
  findCompatibleProfilesFn: (userId: string, userProfile: { interests: string[] | null; intention: string; gender: string; gender_filter: string[] | null; latitude: number | null; longitude: number | null }) => Promise<CompatibleProfile[]>
): Promise<{
  success: boolean;
  results: IceBreakerResult[];
  error: string | null;
}> {
  try {
    // Get current state
    const { state, error: stateError } = await getUserIceBreakerState(userId);

    if (stateError) {
      return { success: false, results: [], error: stateError };
    }

    if (state.iceBreakersAvailable <= 0) {
      return { success: false, results: [], error: 'Aucun Ice Breaker disponible' };
    }

    // Get user's profile for matching
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('interests, intention, gender, gender_filter, latitude, longitude')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return { success: false, results: [], error: 'Impossible de récupérer votre profil' };
    }

    // Find compatible profiles
    const compatibleProfiles = await findCompatibleProfilesFn(userId, userProfile);

    if (compatibleProfiles.length === 0) {
      return { success: false, results: [], error: 'Aucun profil compatible trouvé. Réessayez plus tard !' };
    }

    // Generate and send messages
    const results: IceBreakerResult[] = [];

    for (const profile of compatibleProfiles) {
      const message = generatePersonalizedMessage(profile, userProfile.interests || []);

      // Send the message via invitations/messages system
      const { error: sendError } = await sendIceBreakerMessage(userId, profile.id, message);

      results.push({
        profileId: profile.id,
        profileName: profile.display_name,
        message,
        sent: !sendError,
        error: sendError || undefined,
      });
    }

    // Update Ice Breaker balance
    const sentCount = results.filter(r => r.sent).length;

    if (sentCount > 0) {
      await supabase
        .from('user_icebreakers')
        .upsert({
          user_id: userId,
          icebreakers_available: state.iceBreakersAvailable - 1,
          last_icebreaker_used_at: new Date().toISOString(),
          total_icebreakers_used: state.totalIceBreakersUsed + 1,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
    }

    return {
      success: sentCount > 0,
      results,
      error: sentCount === 0 ? 'Aucun message n\'a pu être envoyé' : null
    };
  } catch (err) {
    return { success: false, results: [], error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Send Ice Breaker messages to approved candidates only
 */
export async function sendToApprovedCandidates(
  userId: string,
  candidates: IceBreakerCandidate[],
  getUserIceBreakerState: (userId: string) => Promise<{ state: { iceBreakersAvailable: number; totalIceBreakersUsed: number }; error: string | null }>
): Promise<{
  success: boolean;
  results: IceBreakerResult[];
  error: string | null;
}> {
  try {
    // Get current state
    const { state, error: stateError } = await getUserIceBreakerState(userId);

    if (stateError) {
      return { success: false, results: [], error: stateError };
    }

    if (state.iceBreakersAvailable <= 0) {
      return { success: false, results: [], error: 'Aucun Ice Breaker disponible' };
    }

    const approvedCandidates = candidates.filter(c => c.approved);

    if (approvedCandidates.length === 0) {
      return { success: false, results: [], error: 'Aucun profil approuvé' };
    }

    // Send messages to approved candidates
    const results: IceBreakerResult[] = [];

    for (const candidate of approvedCandidates) {
      const { error: sendError } = await sendIceBreakerMessage(userId, candidate.id, candidate.message);

      results.push({
        profileId: candidate.id,
        profileName: candidate.name,
        message: candidate.message,
        sent: !sendError,
        error: sendError || undefined,
      });
    }

    // Update Ice Breaker balance
    const sentCount = results.filter(r => r.sent).length;

    if (sentCount > 0) {
      await supabase
        .from('user_icebreakers')
        .upsert({
          user_id: userId,
          icebreakers_available: state.iceBreakersAvailable - 1,
          last_icebreaker_used_at: new Date().toISOString(),
          total_icebreakers_used: state.totalIceBreakersUsed + 1,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
    }

    return {
      success: sentCount > 0,
      results,
      error: sentCount === 0 ? 'Aucun message n\'a pu être envoyé' : null,
    };
  } catch (err) {
    return { success: false, results: [], error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Send Ice Breaker message to a single candidate
 */
export async function sendToSingleCandidate(
  userId: string,
  candidate: IceBreakerCandidate
): Promise<{
  success: boolean;
  conversationId: string | null;
  error: string | null;
}> {
  try {
    // Send the Ice Breaker message (this now creates the connection and conversation)
    const { error: sendError, conversationId } = await sendIceBreakerMessage(userId, candidate.id, candidate.message);

    if (sendError) {
      return { success: false, conversationId: null, error: sendError };
    }

    return {
      success: true,
      conversationId,
      error: null,
    };
  } catch (err) {
    return { success: false, conversationId: null, error: 'Une erreur est survenue' };
  }
}
