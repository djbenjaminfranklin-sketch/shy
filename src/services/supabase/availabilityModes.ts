import { supabase } from './client';
import type {
  AvailabilityModeType,
  ModeDuration,
  ActiveModeState,
  CanActivateModeResult,
  ActivateModeResult,
  DeactivateModeResult,
  ActivateModeParams,
} from '../../types/availabilityMode';

export const availabilityModesService = {
  /**
   * Vérifier si l'utilisateur peut activer un mode
   */
  async canActivateMode(
    userId: string,
    durationHours: ModeDuration
  ): Promise<{ result: CanActivateModeResult | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('can_activate_availability_mode', {
        p_user_id: userId,
        p_duration_hours: durationHours,
      });

      if (error) {
        console.error('[availabilityModesService.canActivateMode] Error:', error);
        return { result: null, error: error.message };
      }

      // Mapper la réponse JSON vers le type TypeScript
      const result: CanActivateModeResult = {
        canActivate: data.can_activate,
        reason: data.reason,
        message: data.message,
        isPremium: data.is_premium,
        subscriptionPlan: data.subscription_plan,
        activationsThisWeek: data.activations_this_week,
      };

      return { result, error: null };
    } catch (err) {
      console.error('[availabilityModesService.canActivateMode] Unexpected error:', err);
      return { result: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Activer un mode de disponibilité
   */
  async activateMode(
    userId: string,
    params: ActivateModeParams
  ): Promise<{ result: ActivateModeResult | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('activate_availability_mode', {
        p_user_id: userId,
        p_mode_type: params.modeType,
        p_duration_hours: params.durationHours,
        p_show_badge: params.showBadge ?? true,
      });

      if (error) {
        console.error('[availabilityModesService.activateMode] Error:', error);
        return { result: null, error: error.message };
      }

      // Mapper la réponse JSON vers le type TypeScript
      const result: ActivateModeResult = {
        success: data.success ?? false,
        modeId: data.mode_id,
        modeType: data.mode_type,
        expiresAt: data.expires_at,
        durationHours: data.duration_hours,
        reason: data.reason,
        message: data.message,
      };

      return { result, error: null };
    } catch (err) {
      console.error('[availabilityModesService.activateMode] Unexpected error:', err);
      return { result: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Désactiver le mode actif
   */
  async deactivateMode(
    userId: string
  ): Promise<{ result: DeactivateModeResult | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('deactivate_availability_mode', {
        p_user_id: userId,
      });

      if (error) {
        console.error('[availabilityModesService.deactivateMode] Error:', error);
        return { result: null, error: error.message };
      }

      const result: DeactivateModeResult = {
        success: data.success ?? false,
        deactivatedModeId: data.deactivated_mode_id,
        reason: data.reason,
        message: data.message,
      };

      return { result, error: null };
    } catch (err) {
      console.error('[availabilityModesService.deactivateMode] Unexpected error:', err);
      return { result: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Obtenir le mode actif de l'utilisateur
   */
  async getActiveMode(
    userId: string
  ): Promise<{ mode: ActiveModeState | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('get_active_availability_mode', {
        p_user_id: userId,
      });

      if (error) {
        console.error('[availabilityModesService.getActiveMode] Error:', error);
        return { mode: null, error: error.message };
      }

      const mode: ActiveModeState = {
        hasActiveMode: data.has_active_mode ?? false,
        modeId: data.mode_id,
        modeType: data.mode_type,
        durationHours: data.duration_hours,
        activatedAt: data.activated_at,
        expiresAt: data.expires_at,
        showBadge: data.show_badge,
        remainingMinutes: data.remaining_minutes,
      };

      return { mode, error: null };
    } catch (err) {
      console.error('[availabilityModesService.getActiveMode] Unexpected error:', err);
      return { mode: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Obtenir les IDs des profils avec le même mode actif
   */
  async getProfilesWithSameMode(
    userId: string,
    modeType: AvailabilityModeType
  ): Promise<{ profileIds: string[]; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('get_profiles_with_same_mode', {
        p_user_id: userId,
        p_mode_type: modeType,
      });

      if (error) {
        console.error('[availabilityModesService.getProfilesWithSameMode] Error:', error);
        return { profileIds: [], error: error.message };
      }

      const profileIds = (data || []).map((row: { profile_id: string }) => row.profile_id);
      return { profileIds, error: null };
    } catch (err) {
      console.error('[availabilityModesService.getProfilesWithSameMode] Unexpected error:', err);
      return { profileIds: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer le mode actif d'un autre utilisateur (pour afficher le badge)
   */
  async getUserActiveMode(
    targetUserId: string
  ): Promise<{ mode: ActiveModeState | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('availability_modes')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Pas de mode actif trouvé
          return { mode: { hasActiveMode: false }, error: null };
        }
        console.error('[availabilityModesService.getUserActiveMode] Error:', error);
        return { mode: null, error: error.message };
      }

      const expiresAt = new Date(data.expires_at);
      const now = new Date();
      const remainingMs = expiresAt.getTime() - now.getTime();

      const mode: ActiveModeState = {
        hasActiveMode: true,
        modeId: data.id,
        modeType: data.mode_type,
        durationHours: data.duration_hours,
        activatedAt: data.activated_at,
        expiresAt: data.expires_at,
        showBadge: data.show_badge,
        remainingMinutes: Math.max(0, Math.floor(remainingMs / 60000)),
      };

      return { mode, error: null };
    } catch (err) {
      console.error('[availabilityModesService.getUserActiveMode] Unexpected error:', err);
      return { mode: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Compter les activations de la semaine (pour affichage)
   */
  async getWeeklyActivationsCount(
    userId: string
  ): Promise<{ count: number; error: string | null }> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count, error } = await supabase
        .from('availability_mode_activations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('activated_at', sevenDaysAgo.toISOString());

      if (error) {
        console.error('[availabilityModesService.getWeeklyActivationsCount] Error:', error);
        return { count: 0, error: error.message };
      }

      return { count: count || 0, error: null };
    } catch (err) {
      console.error('[availabilityModesService.getWeeklyActivationsCount] Unexpected error:', err);
      return { count: 0, error: 'Une erreur inattendue est survenue' };
    }
  },
};

export default availabilityModesService;
