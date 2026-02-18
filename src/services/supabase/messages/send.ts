import { supabase } from '../client';
import type { Message } from '../../../types/message';

// Rate limiting constants
const MAX_MESSAGES_PER_MINUTE = 5;
const MAX_MESSAGES_PER_HOUR = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_HOUR_MS = 60 * 60 * 1000; // 1 hour

// In-memory rate limit tracking (will reset on app restart, but that's acceptable)
const messageSendTimes: Map<string, number[]> = new Map();

/**
 * Check if user is rate limited
 */
function isRateLimited(userId: string): { limited: boolean; waitTime: number } {
  const now = Date.now();
  const userSendTimes = messageSendTimes.get(userId) || [];

  // Clean up old entries
  const recentMinute = userSendTimes.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  const recentHour = userSendTimes.filter(t => now - t < RATE_LIMIT_HOUR_MS);

  // Check minute limit
  if (recentMinute.length >= MAX_MESSAGES_PER_MINUTE) {
    const oldestInMinute = Math.min(...recentMinute);
    const waitTime = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldestInMinute)) / 1000);
    return { limited: true, waitTime };
  }

  // Check hour limit
  if (recentHour.length >= MAX_MESSAGES_PER_HOUR) {
    const oldestInHour = Math.min(...recentHour);
    const waitTime = Math.ceil((RATE_LIMIT_HOUR_MS - (now - oldestInHour)) / 1000);
    return { limited: true, waitTime };
  }

  return { limited: false, waitTime: 0 };
}

/**
 * Record a message send for rate limiting
 */
function recordMessageSend(userId: string): void {
  const now = Date.now();
  const userSendTimes = messageSendTimes.get(userId) || [];

  // Keep only recent entries (last hour)
  const filteredTimes = userSendTimes.filter(t => now - t < RATE_LIMIT_HOUR_MS);
  filteredTimes.push(now);

  messageSendTimes.set(userId, filteredTimes);
}

/**
 * Envoyer un message
 */
export async function sendMessage(conversationId: string, senderId: string, content: string): Promise<{ message: Message | null; error: string | null }> {
  try {
    // Vérifier le rate limiting
    const rateLimit = isRateLimited(senderId);
    if (rateLimit.limited) {
      return {
        message: null,
        error: `Vous envoyez des messages trop rapidement. Veuillez attendre ${rateLimit.waitTime} secondes.`,
      };
    }

    // Vérifier que la conversation existe
    const { data: conv, error: convError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .single();

    if (convError || !conv) {
      return { message: null, error: 'Conversation introuvable' };
    }

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

    // Enregistrer l'envoi pour le rate limiting
    recordMessageSend(senderId);

    // Mettre à jour last_message_at de la conversation
    await supabase
      .from('conversations')
      .update({ last_message_at: message.created_at })
      .eq('id', conversationId);

    // Envoyer une notification push si le destinataire a les notifications activées
    try {
      const { data: conversation } = await supabase
        .from('conversations')
        .select(`
          connection:connections(user1_id, user2_id)
        `)
        .eq('id', conversationId)
        .single();

      if (conversation?.connection) {
        const conn = Array.isArray(conversation.connection) ? conversation.connection[0] : conversation.connection;
        const receiverId = conn.user1_id === senderId ? conn.user2_id : conn.user1_id;

        const { data: receiverProfile } = await supabase
          .from('profiles')
          .select('notification_messages, push_token')
          .eq('id', receiverId)
          .single();

        if (receiverProfile?.notification_messages && receiverProfile?.push_token) {
          const { data: senderProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', senderId)
            .single();

          await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: receiverProfile.push_token,
              title: senderProfile?.display_name || 'Nouveau message',
              body: content.length > 50 ? content.substring(0, 50) + '...' : content,
              data: { conversationId },
            }),
          });
        }
      }
    } catch (notifError) {
      // Ne pas bloquer l'envoi du message si la notification échoue
    }

    return {
      message: {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        content: message.content,
        isRead: message.is_read,
        createdAt: message.created_at,
        isIceBreaker: message.is_ice_breaker || false,
      },
      error: null,
    };
  } catch (err) {
    return { message: null, error: 'Une erreur inattendue est survenue' };
  }
}
