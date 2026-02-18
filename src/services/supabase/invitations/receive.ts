import { supabase } from '../client';
import type { Connection } from '../../../types/match';

/**
 * Accepter une invitation - cree une connection et une conversation
 */
export async function acceptInvitation(
  invitationId: string,
  userId: string
): Promise<{
  connection: Connection | null;
  conversationId: string | null;
  error: string | null;
}> {
  try {
    // Recuperer l'invitation
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation) {
      return { connection: null, conversationId: null, error: 'Invitation non trouvee ou deja traitee' };
    }

    // Verifier si l'invitation n'est pas expiree
    if (new Date(invitation.expires_at) < new Date()) {
      // Marquer comme expiree
      await supabase.from('invitations').update({ status: 'expired' }).eq('id', invitationId);

      return { connection: null, conversationId: null, error: 'Cette invitation a expire' };
    }

    // Mettre a jour le statut de l'invitation
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (updateError) {
      return { connection: null, conversationId: null, error: `Erreur lors de l'acceptation: ${updateError.message}` };
    }

    // Creer la connection d'abord (car conversations.connection_id est NOT NULL)
    const [user1, user2] = [invitation.sender_id, invitation.receiver_id].sort();

    const { data: connection, error: connError } = await supabase
      .from('connections')
      .insert({
        user1_id: user1,
        user2_id: user2,
        invitation_id: invitationId,
      })
      .select()
      .single();

    if (connError) {
      return {
        connection: null,
        conversationId: null,
        error: `Erreur lors de la creation de la connection: ${connError.message}`,
      };
    }

    // Creer la conversation avec le connection_id
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .insert({
        connection_id: connection.id,
      })
      .select()
      .single();

    if (convError) {
      return {
        connection: null,
        conversationId: null,
        error: `Erreur lors de la creation de la conversation: ${convError.message}`,
      };
    }

    return {
      connection: {
        id: connection.id,
        user1Id: connection.user1_id,
        user2Id: connection.user2_id,
        invitationId: connection.invitation_id,
        createdAt: connection.created_at,
      },
      conversationId: conversation.id,
      error: null,
    };
  } catch (err) {
    return { connection: null, conversationId: null, error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Refuser une invitation (silencieusement - l'envoyeur ne voit pas le refus)
 */
export async function refuseInvitation(
  invitationId: string,
  userId: string
): Promise<{
  error: string | null;
}> {
  try {
    // Verifier que l'invitation existe et appartient bien au destinataire
    const { data: invitation, error: fetchError } = await supabase
      .from('invitations')
      .select('id, receiver_id, status')
      .eq('id', invitationId)
      .eq('receiver_id', userId)
      .single();

    if (fetchError || !invitation) {
      return { error: 'Invitation non trouvee' };
    }

    if (invitation.status !== 'pending') {
      return { error: 'Cette invitation a deja ete traitee' };
    }

    // Mettre a jour le statut en "refused"
    // Note: L'envoyeur verra toujours "En attente" puis "Expiree" grace au filtre dans getSentInvitations
    const { error: updateError } = await supabase
      .from('invitations')
      .update({
        status: 'refused',
        responded_at: new Date().toISOString(),
      })
      .eq('id', invitationId);

    if (updateError) {
      return { error: `Erreur lors du refus: ${updateError.message}` };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Une erreur inattendue est survenue' };
  }
}
