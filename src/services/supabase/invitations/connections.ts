import { supabase } from '../client';
import type { ConnectionWithProfile } from '../../../types/match';
import { mapProfileData } from './helpers';

/**
 * Recuperer toutes les connections (invitations acceptees)
 */
export async function getConnections(userId: string): Promise<{
  connections: ConnectionWithProfile[];
  error: string | null;
}> {
  try {
    const { data: connections, error } = await supabase
      .from('connections')
      .select(
        `
        *,
        user1:profiles!connections_user1_id_fkey(*),
        user2:profiles!connections_user2_id_fkey(*),
        conversation:conversations(
          id,
          last_message_at,
          messages(content, created_at, is_read, sender_id)
        )
      `
      )
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      return { connections: [], error: error.message };
    }

    const result: ConnectionWithProfile[] = (connections || []).map((conn) => {
      const otherUser = conn.user1_id === userId ? conn.user2 : conn.user1;
      const profileData = Array.isArray(otherUser) ? otherUser[0] : otherUser;
      const conversation = Array.isArray(conn.conversation)
        ? conn.conversation[0]
        : conn.conversation;
      const messages = conversation?.messages || [];
      const lastMessage = messages[0];
      const unreadCount = messages.filter(
        (m: { is_read: boolean; sender_id: string }) => !m.is_read && m.sender_id !== userId
      ).length;

      return {
        id: conn.id,
        user1Id: conn.user1_id,
        user2Id: conn.user2_id,
        invitationId: conn.invitation_id,
        createdAt: conn.created_at,
        profile: mapProfileData(profileData),
        lastMessage: lastMessage?.content,
        lastMessageAt: lastMessage?.created_at,
        unreadCount,
      } as ConnectionWithProfile;
    });

    return { connections: result, error: null };
  } catch (err) {
    return { connections: [], error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Supprimer une connection
 */
export async function removeConnection(connectionId: string): Promise<{
  error: string | null;
}> {
  try {
    // La suppression en cascade supprimera aussi la conversation associee
    const { error } = await supabase.from('connections').delete().eq('id', connectionId);

    if (error) {
      return { error: `Erreur lors de la suppression: ${error.message}` };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Marquer toutes les invitations en attente comme vues
 * Cela permet de réinitialiser le badge sans avoir à accepter/refuser
 */
export async function markInvitationsAsSeen(userId: string): Promise<{
  error: string | null;
}> {
  try {
    const { error } = await supabase
      .from('invitations')
      .update({ seen_at: new Date().toISOString() })
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .is('seen_at', null);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Compter les invitations non vues (pour le badge)
 */
export async function getUnseenInvitationsCount(userId: string): Promise<{
  count: number;
  error: string | null;
}> {
  try {
    // Filtrer aussi les invitations expirées
    const now = new Date().toISOString();

    const { count, error } = await supabase
      .from('invitations')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .is('seen_at', null)
      .gt('expires_at', now);

    if (error) {
      return { count: 0, error: error.message };
    }

    return { count: count || 0, error: null };
  } catch (err) {
    return { count: 0, error: 'Une erreur inattendue est survenue' };
  }
}
