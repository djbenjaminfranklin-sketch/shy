import { supabase } from '../client';
import type { Message, ConversationWithDetails } from '../../../types/message';

/**
 * Récupérer toutes les conversations d'un utilisateur
 */
export async function getConversations(userId: string): Promise<{ conversations: ConversationWithDetails[]; error: string | null }> {
  try {
    const { data: connections, error } = await supabase
      .from('connections')
      .select(`
        id,
        user1_id,
        user2_id,
        user1:profiles!connections_user1_id_fkey(id, display_name, photos),
        user2:profiles!connections_user2_id_fkey(id, display_name, photos),
        conversations(
          id,
          last_message_at,
          created_at
        )
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      return { conversations: [], error: error.message };
    }

    const conversationsWithMessages = await Promise.all(
      (connections || []).map(async (connection) => {
        const conversation = connection.conversations?.[0];
        if (!conversation) return null;

        const otherUserData = connection.user1_id === userId ? connection.user2 : connection.user1;
        // Supabase returns related data as arrays, take first element
        const otherUser = Array.isArray(otherUserData) ? otherUserData[0] : otherUserData;

        // Récupérer le dernier message et le nombre de non lus
        const { data: messages } = await supabase
          .from('messages')
          .select('content, created_at, is_read, sender_id')
          .eq('conversation_id', conversation.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .eq('is_read', false)
          .neq('sender_id', userId);

        const lastMessage = messages?.[0];

        return {
          id: conversation.id,
          matchId: connection.id, // connectionId pour compatibilité
          lastMessageAt: conversation.last_message_at,
          createdAt: conversation.created_at,
          otherUserId: otherUser.id,
          otherUserName: otherUser.display_name,
          otherUserPhoto: otherUser.photos?.[0] || null,
          lastMessage: lastMessage?.content || null,
          unreadCount: unreadCount || 0,
        };
      })
    );

    const result = conversationsWithMessages
      .filter((c): c is ConversationWithDetails => c !== null)
      .sort((a, b) => {
        const dateA = a.lastMessageAt || a.createdAt;
        const dateB = b.lastMessageAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

    return { conversations: result, error: null };
  } catch (err) {
    return { conversations: [], error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Récupérer les messages d'une conversation
 */
export async function getMessages(conversationId: string, limit = 50, before?: string): Promise<{ messages: Message[]; error: string | null }> {
  try {
    let query = supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data: messages, error } = await query;

    if (error) {
      return { messages: [], error: error.message };
    }

    const result: Message[] = (messages || []).map((m) => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderId: m.sender_id,
      content: m.content,
      isRead: m.is_read,
      createdAt: m.created_at,
      isIceBreaker: m.is_ice_breaker || false,
    }));

    return { messages: result, error: null };
  } catch (err) {
    return { messages: [], error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Marquer les messages comme lus
 */
export async function markAsRead(conversationId: string, userId: string): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Récupérer la conversation ID à partir du connection ID
 */
export async function getConversationByMatchId(connectionId: string): Promise<{ conversationId: string | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select('id')
      .eq('connection_id', connectionId)
      .single();

    if (error) {
      return { conversationId: null, error: error.message };
    }

    return { conversationId: data.id, error: null };
  } catch (err) {
    return { conversationId: null, error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Récupérer l'autre utilisateur d'une conversation
 */
export async function getOtherUserInConversation(conversationId: string, currentUserId: string): Promise<{ userId: string | null; error: string | null }> {
  try {
    const { data: conversation, error } = await supabase
      .from('conversations')
      .select(`
        connection:connections(user1_id, user2_id)
      `)
      .eq('id', conversationId)
      .single();

    if (error) {
      return { userId: null, error: error.message };
    }

    const connection = Array.isArray(conversation.connection) ? conversation.connection[0] : conversation.connection;
    const otherUserId = connection.user1_id === currentUserId ? connection.user2_id : connection.user1_id;

    return { userId: otherUserId, error: null };
  } catch (err) {
    return { userId: null, error: 'Une erreur inattendue est survenue' };
  }
}
