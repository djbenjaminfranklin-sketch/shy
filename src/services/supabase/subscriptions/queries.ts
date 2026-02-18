import { supabase } from '../client';
import { UserSubscription, UserLimits } from '../../../types/subscription';

/**
 * Récupérer l'abonnement actuel d'un utilisateur
 */
export async function getUserSubscription(userId: string): Promise<{ subscription: UserSubscription | null; error: string | null }> {
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
}

/**
 * Récupérer les limites quotidiennes d'un utilisateur
 */
export async function getUserLimits(userId: string): Promise<{ limits: UserLimits | null; error: string | null }> {
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
          superLikesUsed: newData.super_likes_used || 0,
          rewindsUsed: newData.rewinds_used || 0,
          quickMeetProposalsUsed: newData.quick_meet_proposals_used || 0,
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
        superLikesUsed: data.super_likes_used || 0,
        rewindsUsed: data.rewinds_used || 0,
        quickMeetProposalsUsed: data.quick_meet_proposals_used || 0,
        lastResetAt: data.last_reset_at || data.created_at,
      },
      error: null,
    };
  } catch (err) {
    return { limits: null, error: 'Une erreur inattendue est survenue' };
  }
}
