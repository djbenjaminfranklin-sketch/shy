import { supabase } from '../client';

/**
 * Incrémenter l'utilisation des likes
 */
export async function incrementLikes(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.rpc('increment_daily_likes', {
      p_user_id: userId,
      p_date: today,
    });

    if (error) {
      // Fallback: mise à jour directe avec upsert
      // Note: On doit d'abord récupérer la valeur actuelle pour l'incrémenter
      const { data: current } = await supabase
        .from('user_daily_limits')
        .select('invitations_sent')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      await supabase
        .from('user_daily_limits')
        .upsert({
          user_id: userId,
          date: today,
          invitations_sent: (current?.invitations_sent || 0) + 1,
        }, {
          onConflict: 'user_id,date',
        });
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Incrémenter l'utilisation des messages
 */
export async function incrementMessages(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { error } = await supabase.rpc('increment_daily_messages', {
      p_user_id: userId,
      p_date: today,
    });

    if (error) {
      // Fallback: mise à jour directe
      await supabase
        .from('user_daily_limits')
        .upsert({
          user_id: userId,
          date: today,
          messages_used: 1,
        }, {
          onConflict: 'user_id,date',
        });
    }

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Incrémenter les super likes utilisés aujourd'hui
 */
export async function incrementSuperLikes(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Upsert avec incrémentation
    const { data: current } = await supabase
      .from('user_daily_limits')
      .select('super_likes_used')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    await supabase
      .from('user_daily_limits')
      .upsert({
        user_id: userId,
        date: today,
        super_likes_used: (current?.super_likes_used || 0) + 1,
      }, {
        onConflict: 'user_id,date',
      });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Incrémenter les rewinds utilisés aujourd'hui
 */
export async function incrementRewinds(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Upsert avec incrémentation
    const { data: current } = await supabase
      .from('user_daily_limits')
      .select('rewinds_used')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    await supabase
      .from('user_daily_limits')
      .upsert({
        user_id: userId,
        date: today,
        rewinds_used: (current?.rewinds_used || 0) + 1,
      }, {
        onConflict: 'user_id,date',
      });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Incrémenter les propositions Quick Meet utilisées aujourd'hui
 */
export async function incrementQuickMeetProposals(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Upsert avec incrémentation
    const { data: current } = await supabase
      .from('user_daily_limits')
      .select('quick_meet_proposals_used')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    await supabase
      .from('user_daily_limits')
      .upsert({
        user_id: userId,
        date: today,
        quick_meet_proposals_used: (current?.quick_meet_proposals_used || 0) + 1,
      }, {
        onConflict: 'user_id,date',
      });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: 'Une erreur inattendue est survenue' };
  }
}
