import { supabase } from '../client';
import { AutoReplySettings, SubscriptionFeatureCheck } from '../../../types/subscription';
import { SUBSCRIPTION_PLANS_BY_ID, PlanType } from '../../../constants/subscriptions';
import { getUserSubscription, getUserLimits } from './queries';

/**
 * Vérifier si une action est autorisée
 */
export async function checkFeature(
  userId: string,
  feature: 'like' | 'message' | 'seeWhoLikedYou' | 'boost' | 'filters' | 'autoReply' | 'readReceipts'
): Promise<SubscriptionFeatureCheck> {
  try {
    const { subscription } = await getUserSubscription(userId);
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
        const { limits } = await getUserLimits(userId);
        const remaining = dailyLikes - (limits?.likesUsed || 0);
        return {
          allowed: remaining > 0,
          remainingCount: Math.max(0, remaining),
          reason: remaining <= 0 ? 'Limite de likes quotidiens atteinte' : undefined,
          upgradeRequired: remaining <= 0,
        };
      }

      case 'message': {
        const dailyMessages = features.dailyMessages ?? -1;
        if (dailyMessages === -1) {
          return { allowed: true };
        }
        const { limits } = await getUserLimits(userId);
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
}

/**
 * Récupérer les paramètres de réponse automatique
 */
export async function getAutoReplySettings(userId: string): Promise<{ settings: AutoReplySettings | null; error: string | null }> {
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
}

/**
 * Sauvegarder les paramètres de réponse automatique
 */
export async function saveAutoReplySettings(userId: string, settings: AutoReplySettings): Promise<{ error: string | null }> {
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
}
