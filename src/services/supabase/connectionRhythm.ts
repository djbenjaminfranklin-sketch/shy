import { supabase } from './client';
import type {
  ConnectionRhythmScore,
  RhythmScoreResult,
  PendingRhythmScore,
} from '../../types/connectionRhythm';

export const connectionRhythmService = {
  /**
   * Récupérer le score de rythme pour une conversation
   */
  async getRhythmScore(
    conversationId: string
  ): Promise<{ score: RhythmScoreResult | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('get_connection_rhythm', {
        p_conversation_id: conversationId,
      });

      if (error) {
        console.error('[connectionRhythmService.getRhythmScore] Error:', error);
        return { score: null, error: error.message };
      }

      if (!data) {
        return {
          score: {
            isValid: false,
            currentMessageCount: 0,
            minMessagesRequired: 5,
          } as PendingRhythmScore,
          error: null,
        };
      }

      // Map the response
      if (!data.is_valid) {
        const pendingScore: PendingRhythmScore = {
          isValid: false,
          currentMessageCount: data.current_message_count || 0,
          minMessagesRequired: data.min_messages_required || 5,
        };
        return { score: pendingScore, error: null };
      }

      const score: ConnectionRhythmScore = {
        isValid: true,
        rhythmScore: data.rhythm_score,
        availabilityScore: data.availability_score,
        engagementScore: data.engagement_score,
        regularityScore: data.regularity_score,
        totalScore: data.total_score,
        trend: data.trend,
        currentMessageCount: data.current_message_count,
        minMessagesRequired: data.min_messages_required || 5,
        calculatedAt: data.calculated_at,
      };

      return { score, error: null };
    } catch (err) {
      console.error('[connectionRhythmService.getRhythmScore] Unexpected error:', err);
      return { score: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Forcer le recalcul du score (appelé manuellement si besoin)
   */
  async recalculateScore(
    conversationId: string
  ): Promise<{ score: RhythmScoreResult | null; error: string | null }> {
    try {
      const { data, error } = await supabase.rpc('calculate_connection_rhythm', {
        p_conversation_id: conversationId,
      });

      if (error) {
        console.error('[connectionRhythmService.recalculateScore] Error:', error);
        return { score: null, error: error.message };
      }

      if (!data || !data.is_valid) {
        const pendingScore: PendingRhythmScore = {
          isValid: false,
          currentMessageCount: data?.current_message_count || 0,
          minMessagesRequired: data?.min_messages_required || 5,
        };
        return { score: pendingScore, error: null };
      }

      const score: ConnectionRhythmScore = {
        isValid: true,
        rhythmScore: data.rhythm_score,
        availabilityScore: data.availability_score,
        engagementScore: data.engagement_score,
        regularityScore: data.regularity_score,
        totalScore: data.total_score,
        trend: data.trend,
        currentMessageCount: data.message_count,
        minMessagesRequired: 5,
        calculatedAt: new Date().toISOString(),
      };

      return { score, error: null };
    } catch (err) {
      console.error('[connectionRhythmService.recalculateScore] Unexpected error:', err);
      return { score: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer le score directement depuis la table (sans recalcul)
   */
  async getStoredScore(
    conversationId: string
  ): Promise<{ score: ConnectionRhythmScore | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('connection_rhythm_scores')
        .select('*')
        .eq('conversation_id', conversationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { score: null, error: null }; // Not found
        }
        console.error('[connectionRhythmService.getStoredScore] Error:', error);
        return { score: null, error: error.message };
      }

      if (!data.is_valid) {
        return { score: null, error: null };
      }

      const score: ConnectionRhythmScore = {
        isValid: true,
        rhythmScore: data.rhythm_score,
        availabilityScore: data.availability_score,
        engagementScore: data.engagement_score,
        regularityScore: data.regularity_score,
        totalScore: data.total_score,
        trend: data.trend,
        currentMessageCount: data.current_message_count,
        minMessagesRequired: data.min_messages_required,
        calculatedAt: data.calculated_at,
      };

      return { score, error: null };
    } catch (err) {
      console.error('[connectionRhythmService.getStoredScore] Unexpected error:', err);
      return { score: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * S'abonner aux changements de score pour une conversation
   */
  subscribeToScoreChanges(
    conversationId: string,
    onUpdate: (score: ConnectionRhythmScore) => void
  ) {
    const subscription = supabase
      .channel(`rhythm-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'connection_rhythm_scores',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const data = payload.new as Record<string, unknown>;
          if (data.is_valid) {
            const score: ConnectionRhythmScore = {
              isValid: true,
              rhythmScore: data.rhythm_score as number,
              availabilityScore: data.availability_score as number,
              engagementScore: data.engagement_score as number,
              regularityScore: data.regularity_score as number,
              totalScore: data.total_score as number,
              trend: data.trend as 'up' | 'down' | 'stable',
              currentMessageCount: data.current_message_count as number,
              minMessagesRequired: data.min_messages_required as number,
              calculatedAt: data.calculated_at as string,
            };
            onUpdate(score);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },
};

export default connectionRhythmService;
