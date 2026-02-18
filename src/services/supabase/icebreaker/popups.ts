import { supabase } from '../client';

/**
 * Check if user has seen the Ice Breaker info popup
 */
export async function hasSeenInfoPopup(userId: string): Promise<{ seen: boolean; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('icebreaker_info_seen')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { seen: false, error: error.message };
    }

    return { seen: !!data, error: null };
  } catch (err) {
    return { seen: false, error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Mark the Ice Breaker info popup as seen
 */
export async function markInfoPopupSeen(userId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('icebreaker_info_seen')
      .insert({
        user_id: userId,
        seen_at: new Date().toISOString(),
      });

    // Ignore duplicate key errors (user already marked as seen)
    if (error && error.code !== '23505') {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Une erreur inattendue est survenue' };
  }
}
