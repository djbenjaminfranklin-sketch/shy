import { supabase } from './client';
import type {
  MeetProposal,
  MeetProposalStatus,
  MeetProposalResponse,
  TimeSlot,
  SuggestedPlace,
  MeetDuration,
} from '../../types/quickMeet';
import { PROPOSAL_EXPIRY_HOURS } from '../../constants/quickMeet';

export const quickMeetService = {
  /**
   * Créer une nouvelle proposition de rendez-vous
   */
  async createProposal(
    conversationId: string,
    proposerId: string,
    recipientId: string,
    duration: MeetDuration,
    timeSlots: TimeSlot[],
    places: SuggestedPlace[],
    message?: string
  ): Promise<{ proposal: MeetProposal | null; error: string | null }> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + PROPOSAL_EXPIRY_HOURS);

      const { data, error } = await supabase
        .from('quick_meet_proposals')
        .insert({
          conversation_id: conversationId,
          proposer_id: proposerId,
          recipient_id: recipientId,
          duration,
          proposed_slots: timeSlots,
          suggested_places: places,
          message,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('[quickMeetService.createProposal] Error:', error);
        return { proposal: null, error: error.message };
      }

      return { proposal: this.mapProposal(data), error: null };
    } catch (err) {
      console.error('[quickMeetService.createProposal] Unexpected error:', err);
      return { proposal: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer la proposition active pour une conversation
   */
  async getActiveProposal(
    conversationId: string
  ): Promise<{ proposal: MeetProposal | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('quick_meet_proposals')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[quickMeetService.getActiveProposal] Error:', error);
        return { proposal: null, error: error.message };
      }

      return { proposal: data ? this.mapProposal(data) : null, error: null };
    } catch (err) {
      console.error('[quickMeetService.getActiveProposal] Unexpected error:', err);
      return { proposal: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Répondre à une proposition
   */
  async respondToProposal(
    response: MeetProposalResponse
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const updateData: Record<string, unknown> = {
        status: response.accepted ? 'accepted' : 'declined',
        responded_at: new Date().toISOString(),
      };

      if (response.accepted) {
        updateData.selected_slot_id = response.selectedSlotId;
        updateData.selected_place_id = response.selectedPlaceId;
      } else {
        updateData.decline_reason = response.declineReason;
      }

      const { error } = await supabase
        .from('quick_meet_proposals')
        .update(updateData)
        .eq('id', response.proposalId);

      if (error) {
        console.error('[quickMeetService.respondToProposal] Error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('[quickMeetService.respondToProposal] Unexpected error:', err);
      return { success: false, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Annuler une proposition
   */
  async cancelProposal(
    proposalId: string,
    userId: string
  ): Promise<{ success: boolean; error: string | null }> {
    try {
      const { error } = await supabase
        .from('quick_meet_proposals')
        .update({
          status: 'cancelled',
          responded_at: new Date().toISOString(),
        })
        .eq('id', proposalId)
        .eq('proposer_id', userId);

      if (error) {
        console.error('[quickMeetService.cancelProposal] Error:', error);
        return { success: false, error: error.message };
      }

      return { success: true, error: null };
    } catch (err) {
      console.error('[quickMeetService.cancelProposal] Unexpected error:', err);
      return { success: false, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer l'historique des propositions
   */
  async getProposalHistory(
    conversationId: string,
    limit: number = 10
  ): Promise<{ proposals: MeetProposal[]; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('quick_meet_proposals')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[quickMeetService.getProposalHistory] Error:', error);
        return { proposals: [], error: error.message };
      }

      return {
        proposals: (data || []).map(this.mapProposal),
        error: null,
      };
    } catch (err) {
      console.error('[quickMeetService.getProposalHistory] Unexpected error:', err);
      return { proposals: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * S'abonner aux changements de proposition
   */
  subscribeToProposals(
    conversationId: string,
    onUpdate: (proposal: MeetProposal) => void
  ) {
    const subscription = supabase
      .channel(`quickmeet-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quick_meet_proposals',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (payload.new) {
            onUpdate(this.mapProposal(payload.new as Record<string, unknown>));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  /**
   * Mapper les données de la DB vers le type TypeScript
   */
  mapProposal(data: Record<string, unknown>): MeetProposal {
    return {
      id: data.id as string,
      conversationId: data.conversation_id as string,
      proposerId: data.proposer_id as string,
      recipientId: data.recipient_id as string,
      duration: data.duration as MeetDuration,
      proposedSlots: data.proposed_slots as TimeSlot[],
      selectedSlotId: data.selected_slot_id as string | undefined,
      suggestedPlaces: data.suggested_places as SuggestedPlace[],
      selectedPlaceId: data.selected_place_id as string | undefined,
      message: data.message as string | undefined,
      status: data.status as MeetProposalStatus,
      createdAt: data.created_at as string,
      expiresAt: data.expires_at as string,
      respondedAt: data.responded_at as string | undefined,
    };
  },
};

export default quickMeetService;
