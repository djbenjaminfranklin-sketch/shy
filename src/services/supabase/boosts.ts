import { supabase } from './client';
import { UserBoostState, UserBoostRow } from '../../types/boost';
import { BOOST_DURATION_MINUTES } from '../../constants/subscriptions';

/**
 * Service for managing profile boosts
 */
export const boostsService = {
  /**
   * Get the current boost state for a user
   */
  async getUserBoostState(userId: string): Promise<{ state: UserBoostState; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_boosts')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { state: this.getDefaultState(), error: error.message };
      }

      if (!data) {
        // No record exists, return default state
        return { state: this.getDefaultState(), error: null };
      }

      const row = data as UserBoostRow;
      const now = new Date();
      const expiresAt = row.active_boost_expires_at ? new Date(row.active_boost_expires_at) : null;
      const isBoostActive = expiresAt ? expiresAt > now : false;
      const remainingSeconds = isBoostActive && expiresAt
        ? Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
        : 0;

      return {
        state: {
          boostsAvailable: row.boosts_available,
          activeBoostExpiresAt: row.active_boost_expires_at,
          lastBoostActivatedAt: row.last_boost_activated_at,
          isBoostActive,
          remainingSeconds,
        },
        error: null,
      };
    } catch (err) {
      return { state: this.getDefaultState(), error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Add boosts to user's balance after a purchase
   */
  async purchaseBoosts(
    userId: string,
    quantity: number,
    productId: string,
    price?: number
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      // First, upsert the user_boosts record
      const { data: existingData } = await supabase
        .from('user_boosts')
        .select('boosts_available')
        .eq('user_id', userId)
        .single();

      const currentBoosts = existingData?.boosts_available || 0;

      const { error: upsertError } = await supabase
        .from('user_boosts')
        .upsert({
          user_id: userId,
          boosts_available: currentBoosts + quantity,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (upsertError) {
        return { success: false, error: upsertError.message };
      }

      // Record the purchase
      const { error: purchaseError } = await supabase
        .from('boost_purchases')
        .insert({
          user_id: userId,
          product_id: productId,
          quantity,
          price: price || null,
          purchased_at: new Date().toISOString(),
        });

      if (purchaseError) {
        // Don't fail the whole operation if purchase record fails
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Activate a boost for the user (consumes 1 boost, lasts 30 minutes)
   */
  async activateBoost(userId: string): Promise<{ success: boolean; expiresAt: string | null; error: string | null }> {
    try {
      // Get current state
      const { state, error: stateError } = await this.getUserBoostState(userId);

      if (stateError) {
        return { success: false, expiresAt: null, error: stateError };
      }

      // Check if boost is already active
      if (state.isBoostActive) {
        return { success: false, expiresAt: state.activeBoostExpiresAt, error: 'Un boost est déjà actif' };
      }

      // Check if user has boosts available
      if (state.boostsAvailable <= 0) {
        return { success: false, expiresAt: null, error: 'Aucun boost disponible' };
      }

      // Calculate expiration time
      const now = new Date();
      const expiresAt = new Date(now.getTime() + BOOST_DURATION_MINUTES * 60 * 1000);

      // Update the user_boosts record
      const { error: updateError } = await supabase
        .from('user_boosts')
        .upsert({
          user_id: userId,
          boosts_available: state.boostsAvailable - 1,
          active_boost_expires_at: expiresAt.toISOString(),
          last_boost_activated_at: now.toISOString(),
          updated_at: now.toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (updateError) {
        return { success: false, expiresAt: null, error: updateError.message };
      }

      return { success: true, expiresAt: expiresAt.toISOString(), error: null };
    } catch (err) {
      return { success: false, expiresAt: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Check and clear expired boost
   */
  async checkBoostExpiration(userId: string): Promise<{ wasExpired: boolean; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_boosts')
        .select('active_boost_expires_at')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { wasExpired: false, error: error.message };
      }

      if (!data || !data.active_boost_expires_at) {
        return { wasExpired: false, error: null };
      }

      const expiresAt = new Date(data.active_boost_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        // Boost has expired, clear it
        const { error: updateError } = await supabase
          .from('user_boosts')
          .update({
            active_boost_expires_at: null,
            updated_at: now.toISOString(),
          })
          .eq('user_id', userId);

        if (updateError) {
          return { wasExpired: true, error: updateError.message };
        }

        return { wasExpired: true, error: null };
      }

      return { wasExpired: false, error: null };
    } catch (err) {
      return { wasExpired: false, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Get default empty state
   */
  getDefaultState(): UserBoostState {
    return {
      boostsAvailable: 0,
      activeBoostExpiresAt: null,
      lastBoostActivatedAt: null,
      isBoostActive: false,
      remainingSeconds: 0,
    };
  },
};

export default boostsService;
