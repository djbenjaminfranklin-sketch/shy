import { supabase } from '../client';
import type { Message } from '../../../types/message';

/**
 * S'abonner aux nouveaux messages d'une conversation
 */
export function subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
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
          isIceBreaker: m.is_ice_breaker || false,
        });
      }
    )
    .subscribe();
}

/**
 * Se désabonner des messages
 */
export function unsubscribeFromMessages(conversationId: string) {
  supabase.channel(`messages:${conversationId}`).unsubscribe();
}
