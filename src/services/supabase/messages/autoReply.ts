import { supabase } from '../client';
import { AUTO_REPLY_TEMPLATES } from '../../../constants/subscriptions';

/**
 * Vérifier et envoyer une réponse automatique si configurée
 * Appelé quand un utilisateur reçoit un premier message dans une conversation
 */
export async function checkAndSendAutoReply(
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

    // Envoyer la réponse auto uniquement au premier message reçu
    if (messageCount !== 1) {
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

    // Envoyer la réponse automatique
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
}
