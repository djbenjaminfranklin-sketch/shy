import { supabase } from './client';
import type { Message, ConversationWithDetails } from '../../types/message';
import { AUTO_REPLY_TEMPLATES } from '../../constants/subscriptions';

export const messagesService = {
  /**
   * Récupérer toutes les conversations d'un utilisateur
   */
  async getConversations(userId: string): Promise<{ conversations: ConversationWithDetails[]; error: string | null }> {
    try {
      const { data: matches, error } = await supabase
        .from('matches')
        .select(`
          id,
          user1_id,
          user2_id,
          user1:profiles!matches_user1_id_fkey(id, display_name, photos),
          user2:profiles!matches_user2_id_fkey(id, display_name, photos),
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
        (matches || []).map(async (match) => {
          const conversation = match.conversations?.[0];
          if (!conversation) return null;

          const otherUserData = match.user1_id === userId ? match.user2 : match.user1;
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
            matchId: match.id,
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
  },

  /**
   * Récupérer les messages d'une conversation
   */
  async getMessages(conversationId: string, limit = 50, before?: string): Promise<{ messages: Message[]; error: string | null }> {
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
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
      }));

      return { messages: result.reverse(), error: null };
    } catch (err) {
      return { messages: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Envoyer un message
   */
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<{ message: Message | null; error: string | null }> {
    try {
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
        })
        .select()
        .single();

      if (error) {
        return { message: null, error: error.message };
      }

      // Mettre à jour last_message_at de la conversation
      await supabase
        .from('conversations')
        .update({ last_message_at: message.created_at })
        .eq('id', conversationId);

      return {
        message: {
          id: message.id,
          conversationId: message.conversation_id,
          senderId: message.sender_id,
          content: message.content,
          isRead: message.is_read,
          createdAt: message.created_at,
        },
        error: null,
      };
    } catch (err) {
      return { message: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Marquer les messages comme lus
   */
  async markAsRead(conversationId: string, userId: string): Promise<{ error: string | null }> {
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
  },

  /**
   * S'abonner aux nouveaux messages d'une conversation
   */
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const m = payload.new;
          callback({
            id: m.id,
            conversationId: m.conversation_id,
            senderId: m.sender_id,
            content: m.content,
            isRead: m.is_read,
            createdAt: m.created_at,
          });
        }
      )
      .subscribe();
  },

  /**
   * Se désabonner des messages
   */
  unsubscribeFromMessages(conversationId: string) {
    supabase.channel(`messages:${conversationId}`).unsubscribe();
  },

  /**
   * Vérifier et envoyer une réponse automatique si configurée
   * Appelé quand un utilisateur reçoit un premier message dans une conversation
   */
  async checkAndSendAutoReply(
    conversationId: string,
    recipientId: string,
    _senderId: string
  ): Promise<{ sent: boolean; error: string | null }> {
    try {
      // Vérifier si c'est le premier message de cette conversation
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('conversation_id', conversationId);

      // Si ce n'est pas le premier message, ne pas envoyer de réponse auto
      if (messageCount && messageCount > 1) {
        return { sent: false, error: null };
      }

      // Récupérer les paramètres de réponse auto du destinataire
      const { data: autoReply, error: autoReplyError } = await supabase
        .from('user_auto_reply')
        .select('*')
        .eq('user_id', recipientId)
        .single();

      if (autoReplyError && autoReplyError.code !== 'PGRST116') {
        return { sent: false, error: autoReplyError.message };
      }

      // Pas de config ou désactivé
      if (!autoReply || !autoReply.enabled) {
        return { sent: false, error: null };
      }

      // Vérifier les heures actives si configuré
      if (autoReply.active_hours_only) {
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = autoReply.start_hour;
        const endHour = autoReply.end_hour;

        // Vérifier si on est dans la plage horaire
        // Ex: 22h à 8h = heures de nuit
        let isInActiveHours = false;
        if (startHour > endHour) {
          // Plage qui traverse minuit (ex: 22-8)
          isInActiveHours = currentHour >= startHour || currentHour < endHour;
        } else {
          // Plage normale (ex: 9-17)
          isInActiveHours = currentHour >= startHour && currentHour < endHour;
        }

        if (!isInActiveHours) {
          return { sent: false, error: null };
        }
      }

      // Construire le message de réponse auto
      let autoMessage = '';
      if (autoReply.template_id === 'custom' && autoReply.custom_message) {
        autoMessage = autoReply.custom_message;
      } else if (autoReply.template_id) {
        const template = AUTO_REPLY_TEMPLATES.find((t) => t.id === autoReply.template_id);
        if (template) {
          autoMessage = template.message;
        }
      }

      if (!autoMessage) {
        return { sent: false, error: null };
      }

      // Envoyer la réponse automatique (après un petit délai simulé)
      const { error: sendError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: recipientId,
          content: autoMessage,
        });

      if (sendError) {
        return { sent: false, error: sendError.message };
      }

      // Mettre à jour last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      return { sent: true, error: null };
    } catch (err) {
      return { sent: false, error: 'Erreur lors de l\'envoi de la réponse automatique' };
    }
  },

  /**
   * Récupérer la conversation ID à partir du match ID
   */
  async getConversationByMatchId(matchId: string): Promise<{ conversationId: string | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('match_id', matchId)
        .single();

      if (error) {
        return { conversationId: null, error: error.message };
      }

      return { conversationId: data.id, error: null };
    } catch (err) {
      return { conversationId: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer l'autre utilisateur d'une conversation
   */
  async getOtherUserInConversation(conversationId: string, currentUserId: string): Promise<{ userId: string | null; error: string | null }> {
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select(`
          match:matches(user1_id, user2_id)
        `)
        .eq('id', conversationId)
        .single();

      if (error) {
        return { userId: null, error: error.message };
      }

      const match = Array.isArray(conversation.match) ? conversation.match[0] : conversation.match;
      const otherUserId = match.user1_id === currentUserId ? match.user2_id : match.user1_id;

      return { userId: otherUserId, error: null };
    } catch (err) {
      return { userId: null, error: 'Une erreur inattendue est survenue' };
    }
  },
};

export default messagesService;
