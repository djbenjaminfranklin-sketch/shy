import { supabase } from '../client';
import type { CompatibleProfile } from '../../../types/icebreaker';

// Message templates based on common interests
const MESSAGE_TEMPLATES = [
  "Salut {name} ! J'ai vu qu'on partage un intérêt pour {interest}. Je suis un peu timide pour faire le premier pas, mais j'aimerais bien discuter avec toi !",
  "Hey {name} ! On dirait qu'on aime tous les deux {interest}. Ça te dit d'en parler ?",
  "Coucou {name} ! {interest}, moi aussi ! C'est pas tous les jours qu'on croise quelqu'un avec les mêmes centres d'intérêt. On échange ?",
  "Salut {name} ! Je vois qu'on a {interest} en commun. J'adorerais en savoir plus sur toi !",
  "Hello {name} ! Passionné(e) de {interest} aussi ? On devrait discuter !",
];

// Fallback messages when no common interests
const FALLBACK_TEMPLATES = [
  "Salut {name} ! Ton profil m'a intrigué(e). Je suis un peu timide, mais j'aimerais bien te connaître !",
  "Hey {name} ! J'ai hésité à t'écrire, mais je me lance. Ça te dit de discuter ?",
  "Coucou {name} ! Je fais rarement le premier pas, mais ton profil m'a donné envie de te parler !",
];

/**
 * Generate a personalized message based on common interests
 */
export function generatePersonalizedMessage(profile: CompatibleProfile, userInterests: string[]): string {
  const commonInterests = profile.interests.filter(i => userInterests.includes(i));

  let template: string;
  let interest: string;

  if (commonInterests.length > 0) {
    // Use a random common interest
    interest = commonInterests[Math.floor(Math.random() * commonInterests.length)];
    template = MESSAGE_TEMPLATES[Math.floor(Math.random() * MESSAGE_TEMPLATES.length)];
  } else {
    // Use fallback template
    template = FALLBACK_TEMPLATES[Math.floor(Math.random() * FALLBACK_TEMPLATES.length)];
    interest = '';
  }

  return template
    .replace('{name}', profile.display_name)
    .replace('{interest}', interest);
}

/**
 * Send an Ice Breaker message (creates a connection, conversation, and sends the message)
 */
export async function sendIceBreakerMessage(
  senderId: string,
  receiverId: string,
  message: string
): Promise<{ error: string | null; conversationId: string | null }> {
  try {
    // Sort user IDs for consistent connection creation
    const [user1, user2] = [senderId, receiverId].sort();

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('connections')
      .select('id')
      .eq('user1_id', user1)
      .eq('user2_id', user2)
      .single();

    let connectionId: string;

    if (existingConnection) {
      connectionId = existingConnection.id;
    } else {
      // Create a new connection
      const { data: newConnection, error: connectionError } = await supabase
        .from('connections')
        .insert({
          user1_id: user1,
          user2_id: user2,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (connectionError || !newConnection) {
        return { error: connectionError?.message || 'Erreur lors de la création de la connexion', conversationId: null };
      }

      connectionId = newConnection.id;
    }

    // Check if conversation already exists
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('connection_id', connectionId)
      .single();

    let conversationId: string;

    if (existingConversation) {
      conversationId = existingConversation.id;
    } else {
      // Create a new conversation
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          connection_id: connectionId,
          created_at: new Date().toISOString(),
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (conversationError || !newConversation) {
        return { error: conversationError?.message || 'Erreur lors de la création de la conversation', conversationId: null };
      }

      conversationId = newConversation.id;
    }

    // Send the Ice Breaker message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: message,
        is_ice_breaker: true,
        created_at: new Date().toISOString(),
      });

    if (messageError) {
      return { error: messageError.message, conversationId: null };
    }

    // Update conversation last_message_at
    await supabase
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId);

    return { error: null, conversationId };
  } catch (err) {
    return { error: 'Une erreur est survenue', conversationId: null };
  }
}
