import { supabase } from './client';
import type {
  EngagementMetrics,
  EngagementBoost,
  RankedProfile,
} from '../../types/engagementScore';
import { getEngagementLevel } from '../../constants/engagementScore';

export const engagementScoreService = {
  /**
   * Récupérer le score d'engagement d'un utilisateur
   */
  async getEngagementScore(
    userId: string
  ): Promise<{ metrics: EngagementMetrics | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('get_engagement_score', {
        p_user_id: userId,
      });

      if (error) {
        console.error('[engagementScoreService.getEngagementScore] Error:', error);
        return { metrics: null, error: error.message };
      }

      if (!data) {
        return { metrics: null, error: null };
      }

      const metrics: EngagementMetrics = {
        responsivenessScore: data.responsiveness_score || 50,
        avgResponseTimeMinutes: data.avg_response_time_minutes || 60,
        responseRate: data.response_rate || 0,
        conversationScore: data.conversation_score || 50,
        avgConversationLength: data.avg_conversation_length || 0,
        conversationsStarted: data.conversations_started || 0,
        conversationsContinued: data.conversations_continued || 0,
        meetingScore: data.meeting_score || 50,
        meetingsProposed: data.meetings_proposed || 0,
        meetingsAccepted: data.meetings_accepted || 0,
        meetingsDeclined: data.meetings_declined || 0,
        activityScore: data.activity_score || 50,
        daysActiveLastWeek: data.days_active_last_week || 0,
        avgSessionsPerDay: data.avg_sessions_per_day || 0,
        lastActiveAt: data.last_active_at || new Date().toISOString(),
        totalScore: data.total_score || 50,
        calculatedAt: data.calculated_at || new Date().toISOString(),
        dataPoints: data.data_points || 0,
      };

      return { metrics, error: null };
    } catch (err) {
      console.error('[engagementScoreService.getEngagementScore] Unexpected error:', err);
      return { metrics: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Recalculer le score d'engagement d'un utilisateur
   */
  async recalculateScore(
    userId: string
  ): Promise<{ metrics: EngagementMetrics | null; error: string | null }> {
    try {
      const { error } = await supabase.rpc('calculate_engagement_score', {
        p_user_id: userId,
      });

      if (error) {
        console.error('[engagementScoreService.recalculateScore] Error:', error);
        return { metrics: null, error: error.message };
      }

      return this.getEngagementScore(userId);
    } catch (err) {
      console.error('[engagementScoreService.recalculateScore] Unexpected error:', err);
      return { metrics: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer les boosts actifs d'un utilisateur
   */
  async getActiveBoosts(
    userId: string
  ): Promise<{ boosts: EngagementBoost[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('engagement_boosts')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('[engagementScoreService.getActiveBoosts] Error:', error);
        return { boosts: [], error: error.message };
      }

      const boosts: EngagementBoost[] = (data || []).map((b) => ({
        id: b.id,
        userId: b.user_id,
        boostType: b.boost_type,
        multiplier: b.multiplier,
        expiresAt: b.expires_at,
      }));

      return { boosts, error: null };
    } catch (err) {
      console.error('[engagementScoreService.getActiveBoosts] Unexpected error:', err);
      return { boosts: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer les profils classés pour discover
   */
  async getRankedProfiles(
    userId: string,
    filters: {
      maxDistance?: number;
      minAge?: number;
      maxAge?: number;
      genders?: string[];
    },
    limit: number = 20
  ): Promise<{ profiles: RankedProfile[]; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('get_ranked_profiles', {
        p_user_id: userId,
        p_max_distance: filters.maxDistance || 50,
        p_min_age: filters.minAge || 18,
        p_max_age: filters.maxAge || 99,
        p_genders: filters.genders || [],
        p_limit: limit,
      });

      if (error) {
        console.error('[engagementScoreService.getRankedProfiles] Error:', error);
        return { profiles: [], error: error.message };
      }

      const profiles: RankedProfile[] = (data || []).map((p: Record<string, unknown>, index: number) => ({
        profileId: p.profile_id as string,
        engagementScore: p.engagement_score as number || 50,
        engagementLevel: getEngagementLevel(p.engagement_score as number || 50),
        boostMultiplier: p.boost_multiplier as number || 1,
        finalRank: index + 1,
        matchScore: p.match_score as number || 50,
      }));

      return { profiles, error: null };
    } catch (err) {
      console.error('[engagementScoreService.getRankedProfiles] Unexpected error:', err);
      return { profiles: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Enregistrer une activité (pour mise à jour du score)
   */
  async recordActivity(
    userId: string,
    activityType: 'message_sent' | 'message_replied' | 'meeting_proposed' | 'meeting_accepted' | 'session_start'
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase.rpc('record_engagement_activity', {
        p_user_id: userId,
        p_activity_type: activityType,
      });

      if (error) {
        console.error('[engagementScoreService.recordActivity] Error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('[engagementScoreService.recordActivity] Unexpected error:', err);
      return { success: false, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Mettre à jour la dernière activité (appelé à chaque session)
   */
  async updateLastActive(userId: string): Promise<void> {
    try {
      await supabase
        .from('profiles')
        .update({ last_active_at: new Date().toISOString() })
        .eq('id', userId);
    } catch (err) {
      console.error('[engagementScoreService.updateLastActive] Error:', err);
    }
  },
};

export default engagementScoreService;
