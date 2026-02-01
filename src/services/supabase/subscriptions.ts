import { supabase } from './client';
import { UserSubscription, UserLimits, AutoReplySettings, SubscriptionFeatureCheck } from '../../types/subscription';
import { SUBSCRIPTION_PLANS_BY_ID, PlanType } from '../../constants/subscriptions';

export const subscriptionsService = {
  /**
   * Récupérer l'abonnement actuel d'un utilisateur
   */
  async getUserSubscription(userId: string): Promise<{ subscription: UserSubscription | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        return { subscription: null, error: error.message };
      }

      if (!data) {
        // Retourner un abonnement gratuit par défaut
        return {
          subscription: {
            id: 'free',
            userId,
            planId: 'free',
            status: 'active',
            startDate: new Date().toISOString(),
            endDate: null,
            autoRenew: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          error: null,
        };
      }

      return {
        subscription: {
          id: data.id,
          userId: data.user_id,
          planId: data.plan_id,
          status: data.status,
          startDate: data.start_date,
          endDate: data.end_date,
          autoRenew: data.auto_renew,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
        error: null,
      };
    } catch (err) {
      return { subscription: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer les limites quotidiennes d'un utilisateur
   */
  async getUserLimits(userId: string): Promise<{ limits: UserLimits | null; error: string | null }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('user_daily_limits')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { limits: null, error: error.message };
      }

      if (!data) {
        // Créer les limites pour aujourd'hui
        const { data: newData, error: insertError } = await supabase
          .from('user_daily_limits')
          .insert({
            user_id: userId,
            date: today,
            invitations_sent: 0,
            messages_used: 0,
          })
          .select()
          .single();

        if (insertError) {
          return { limits: null, error: insertError.message };
        }

        return {
          limits: {
            id: newData.id,
            userId: newData.user_id,
            date: newData.date,
            likesUsed: newData.invitations_sent, // invitations_sent = likesUsed pour compatibilité
            messagesUsed: newData.messages_used,
            lastResetAt: newData.created_at,
          },
          error: null,
        };
      }

      return {
        limits: {
          id: data.id,
          userId: data.user_id,
          date: data.date,
          likesUsed: data.invitations_sent, // invitations_sent = likesUsed pour compatibilité
          messagesUsed: data.messages_used,
          lastResetAt: data.last_reset_at || data.created_at,
        },
        error: null,
      };
    } catch (err) {
      return { limits: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Incrémenter l'utilisation des likes
   */
  async incrementLikes(userId: string): Promise<{ success: boolean; error: string | null }> {
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
  },

  /**
   * Incrémenter l'utilisation des messages
   */
  async incrementMessages(userId: string): Promise<{ success: boolean; error: string | null }> {
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
  },

  /**
   * Vérifier si une action est autorisée
   */
  async checkFeature(
    userId: string,
    feature: 'like' | 'message' | 'seeWhoLikedYou' | 'boost' | 'filters' | 'autoReply' | 'readReceipts'
  ): Promise<SubscriptionFeatureCheck> {
    try {
      const { subscription } = await this.getUserSubscription(userId);
      const planId = (subscription?.planId || 'free') as PlanType;
      const plan = SUBSCRIPTION_PLANS_BY_ID[planId];
      const features = plan?.features;

      if (!features) {
        return { allowed: false, reason: 'Plan non trouvé' };
      }

      switch (feature) {
        case 'like': {
          const dailyLikes = features.dailyLikes ?? features.invitationsPerDay;
          if (dailyLikes === -1) {
            return { allowed: true };
          }
          const { limits } = await this.getUserLimits(userId);
          const remaining = dailyLikes - (limits?.likesUsed || 0);
          return {
            allowed: remaining > 0,
            remainingCount: Math.max(0, remaining),
            reason: remaining <= 0 ? 'Limite de likes quotidiens atteinte' : undefined,
            upgradeRequired: remaining <= 0,
          };
        }

        case 'message': {
          const dailyMessages = features.dailyMessages ?? -1; // Messages illimités après connexion
          if (dailyMessages === -1) {
            return { allowed: true };
          }
          const { limits } = await this.getUserLimits(userId);
          const remaining = dailyMessages - (limits?.messagesUsed || 0);
          return {
            allowed: remaining > 0,
            remainingCount: Math.max(0, remaining),
            reason: remaining <= 0 ? 'Limite de messages quotidiens atteinte' : undefined,
            upgradeRequired: remaining <= 0,
          };
        }

        case 'seeWhoLikedYou':
          return {
            allowed: features.canSeeWhoLikedYou ?? features.seeWhoLikedYou ?? false,
            reason: !(features.canSeeWhoLikedYou ?? features.seeWhoLikedYou) ? 'Fonctionnalité réservée aux abonnés SHY+' : undefined,
            upgradeRequired: !(features.canSeeWhoLikedYou ?? features.seeWhoLikedYou),
          };

        case 'boost':
          return {
            allowed: features.canBoostProfile ?? features.boostsPerWeek > 0,
            reason: !(features.canBoostProfile ?? features.boostsPerWeek > 0) ? 'Fonctionnalité réservée aux abonnés Premium' : undefined,
            upgradeRequired: !(features.canBoostProfile ?? features.boostsPerWeek > 0),
          };

        case 'filters':
          return {
            allowed: features.canUseFilters ?? features.allFilters ?? false,
            reason: !(features.canUseFilters ?? features.allFilters) ? 'Fonctionnalité réservée aux abonnés SHY+' : undefined,
            upgradeRequired: !(features.canUseFilters ?? features.allFilters),
          };

        case 'autoReply':
          return {
            allowed: features.canSetAutoReply ?? false,
            reason: !features.canSetAutoReply ? 'Fonctionnalité réservée aux abonnés SHY+' : undefined,
            upgradeRequired: !features.canSetAutoReply,
          };

        case 'readReceipts':
          return {
            allowed: features.canSeeReadReceipts ?? false,
            reason: !features.canSeeReadReceipts ? 'Fonctionnalité réservée aux abonnés SHY+' : undefined,
            upgradeRequired: !features.canSeeReadReceipts,
          };

        default:
          return { allowed: false, reason: 'Fonctionnalité inconnue' };
      }
    } catch (err) {
      return { allowed: false, reason: 'Erreur de vérification' };
    }
  },

  /**
   * Récupérer les paramètres de réponse automatique
   */
  async getAutoReplySettings(userId: string): Promise<{ settings: AutoReplySettings | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('user_auto_reply')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { settings: null, error: error.message };
      }

      if (!data) {
        return {
          settings: {
            enabled: false,
            templateId: null,
            customMessage: null,
            activeHoursOnly: false,
            startHour: 22,
            endHour: 8,
          },
          error: null,
        };
      }

      return {
        settings: {
          enabled: data.enabled,
          templateId: data.template_id,
          customMessage: data.custom_message,
          activeHoursOnly: data.active_hours_only,
          startHour: data.start_hour,
          endHour: data.end_hour,
        },
        error: null,
      };
    } catch (err) {
      return { settings: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Sauvegarder les paramètres de réponse automatique
   */
  async saveAutoReplySettings(userId: string, settings: AutoReplySettings): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('user_auto_reply')
        .upsert({
          user_id: userId,
          enabled: settings.enabled,
          template_id: settings.templateId,
          custom_message: settings.customMessage,
          active_hours_only: settings.activeHoursOnly,
          start_hour: settings.startHour,
          end_hour: settings.endHour,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Une erreur inattendue est survenue' };
    }
  },
};

export default subscriptionsService;
