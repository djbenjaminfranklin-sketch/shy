import { supabase } from '../client';
import type { UserIceBreakerState, UserIceBreakerRow } from '../../../types/icebreaker';
import { getDefaultState } from './utils';

/**
 * Get the current Ice Breaker state for a user
 */
export async function getUserIceBreakerState(userId: string): Promise<{ state: UserIceBreakerState; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('user_icebreakers')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return { state: getDefaultState(), error: error.message };
    }

    if (!data) {
      return { state: getDefaultState(), error: null };
    }

    const row = data as UserIceBreakerRow;

    return {
      state: {
        iceBreakersAvailable: row.icebreakers_available,
        lastIceBreakerUsedAt: row.last_icebreaker_used_at,
        totalIceBreakersUsed: row.total_icebreakers_used,
      },
      error: null,
    };
  } catch (err) {
    return { state: getDefaultState(), error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Add Ice Breakers to user's balance after a purchase
 */
export async function purchaseIceBreakers(
  userId: string,
  quantity: number,
  productId: string,
  price?: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: existingData } = await supabase
      .from('user_icebreakers')
      .select('icebreakers_available')
      .eq('user_id', userId)
      .single();

    const currentIceBreakers = existingData?.icebreakers_available || 0;

    const { error: upsertError } = await supabase
      .from('user_icebreakers')
      .upsert({
        user_id: userId,
        icebreakers_available: currentIceBreakers + quantity,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (upsertError) {
      return { success: false, error: upsertError.message };
    }

    // Record the purchase
    await supabase
      .from('icebreaker_purchases')
      .insert({
        user_id: userId,
        product_id: productId,
        quantity,
        price: price || null,
        purchased_at: new Date().toISOString(),
      });

    return { success: true, error: null };
  } catch (err) {
    return { success: false, error: 'Une erreur inattendue est survenue' };
  }
}
