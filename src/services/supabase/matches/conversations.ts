import { supabase } from '../client';
import type { MatchWithProfile } from '../../../types/match';

/**
 * Récupérer toutes les connexions d'un utilisateur
 * (Utilise la table 'connections' qui stocke les invitations acceptées)
 */
export async function getMatches(userId: string): Promise<{ matches: MatchWithProfile[]; error: string | null }> {
  try {
    // Récupérer les connexions (invitations acceptées)
    const { data: connections, error } = await supabase
      .from('connections')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (error) {
      return { matches: [], error: error.message };
    }

    if (!connections || connections.length === 0) {
      return { matches: [], error: null };
    }

    // Récupérer les IDs des autres utilisateurs
    const otherUserIds = connections.map((c) =>
      c.user1_id === userId ? c.user2_id : c.user1_id
    );

    // Récupérer les profils séparément
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', otherUserIds);

    const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

    // Récupérer les conversations et derniers messages
    const connectionIds = connections.map((c) => c.id);
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id, connection_id, last_message_at')
      .in('connection_id', connectionIds);

    const conversationMap = new Map((conversations || []).map((c) => [c.connection_id, c]));

    // Créer les conversations manquantes
    for (const connection of connections) {
      if (!conversationMap.has(connection.id)) {
        const { data: newConversation } = await supabase
          .from('conversations')
          .insert({ connection_id: connection.id })
          .select('id, connection_id, last_message_at')
          .single();

        if (newConversation) {
          conversationMap.set(connection.id, newConversation);
        }
      }
    }

    // Récupérer les derniers messages pour chaque conversation
    const conversationIds = Array.from(conversationMap.values()).map(c => c.id);
    const lastMessagesMap = new Map<string, { content: string; senderId: string }>();
    const unreadCountMap = new Map<string, number>();
    const iceBreakerMap = new Map<string, boolean>();

    if (conversationIds.length > 0) {
      // Récupérer le dernier message de chaque conversation
      for (const convId of conversationIds) {
        const { data: lastMsg } = await supabase
          .from('messages')
          .select('content, sender_id')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lastMsg) {
          lastMessagesMap.set(convId, { content: lastMsg.content, senderId: lastMsg.sender_id });
        }

        // Compter les messages non lus
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', convId)
          .eq('is_read', false)
          .neq('sender_id', userId);

        unreadCountMap.set(convId, count || 0);

        // Vérifier s'il y a des messages Ice Breaker (reçus, pas envoyés par nous)
        const { count: iceBreakerCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', convId)
          .eq('is_ice_breaker', true)
          .neq('sender_id', userId);

        iceBreakerMap.set(convId, (iceBreakerCount || 0) > 0);
      }
    }

    // Construire le résultat - filtrer les connexions sans conversation valide
    const result: MatchWithProfile[] = connections
      .filter((connection) => conversationMap.has(connection.id))
      .map((connection) => {
      const otherUserId = connection.user1_id === userId ? connection.user2_id : connection.user1_id;
      const otherUser = profilesMap.get(otherUserId);
      const conversation = conversationMap.get(connection.id)!;
      const lastMsg = lastMessagesMap.get(conversation.id);
      const unreadCount = unreadCountMap.get(conversation.id) || 0;

      return {
        id: conversation.id, // Toujours utiliser l'ID de conversation
        user1Id: connection.user1_id,
        user2Id: connection.user2_id,
        createdAt: connection.created_at,
        profile: otherUser ? {
          id: otherUser.id,
          displayName: otherUser.display_name,
          birthDate: otherUser.birth_date,
          age: otherUser.age,
          gender: otherUser.gender,
          hairColor: otherUser.hair_color,
          bio: otherUser.bio,
          intention: otherUser.intention,
          availability: otherUser.availability,
          languages: otherUser.languages || [],
          interests: otherUser.interests || [],
          photos: otherUser.photos || [],
          videoUrl: otherUser.video_url || null,
          height: otherUser.height || null,
          drinking: otherUser.drinking || null,
          smoking: otherUser.smoking || null,
          children: otherUser.children || null,
          prompts: otherUser.prompts || [],
          locationEnabled: otherUser.location_enabled,
          latitude: otherUser.latitude,
          longitude: otherUser.longitude,
          locationUpdatedAt: otherUser.location_updated_at,
          searchRadius: otherUser.search_radius,
          minAgeFilter: otherUser.min_age_filter,
          maxAgeFilter: otherUser.max_age_filter,
          genderFilter: otherUser.gender_filter || [],
          createdAt: otherUser.created_at,
          updatedAt: otherUser.updated_at,
        } : {
          // Profil minimal si non trouvé
          id: otherUserId,
          displayName: 'Utilisateur',
          birthDate: '',
          age: 0,
          gender: 'autre' as const,
          hairColor: null,
          bio: null,
          intention: 'social' as const,
          availability: null,
          languages: [],
          interests: [],
          photos: [],
          videoUrl: null,
          height: null,
          drinking: null,
          smoking: null,
          children: null,
          prompts: [],
          locationEnabled: false,
          latitude: null,
          longitude: null,
          locationUpdatedAt: null,
          searchRadius: 25,
          minAgeFilter: 18,
          maxAgeFilter: 99,
          genderFilter: [],
          createdAt: '',
          updatedAt: '',
        },
        lastMessage: lastMsg?.content,
        lastMessageAt: conversation?.last_message_at,
        unreadCount: unreadCount,
        hasIceBreakerMessages: iceBreakerMap.get(conversation.id) || false,
      };
    });

    return { matches: result, error: null };
  } catch (err) {
    return { matches: [], error: 'Une erreur inattendue est survenue' };
  }
}

