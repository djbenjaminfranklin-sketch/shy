import { supabase } from './client';
import type { Match, MatchWithProfile } from '../../types/match';
import { canSendDirectMessage } from '../../utils/messagingPermissions';
import { GenderId } from '../../constants/genders';

export const matchesService = {
  /**
   * Créer une connexion instantanée pour les messages directs
   * (Femme → Homme ou Non-binaire → Non-binaire)
   * Utilise une fonction SQL sécurisée qui vérifie les permissions
   */
  async createInstantConnection(
    fromUserId: string,
    toUserId: string,
    fromGender: GenderId,
    toGender: GenderId
  ): Promise<{ connectionId: string | null; conversationId: string | null; error: string | null }> {
    try {
      // Vérification côté client (la fonction SQL vérifie aussi)
      if (!canSendDirectMessage(fromGender, toGender)) {
        return { connectionId: null, conversationId: null, error: 'Message direct non autorisé' };
      }

      // Appeler la fonction SQL sécurisée
      const { data: connectionId, error } = await supabase
        .rpc('create_instant_connection', {
          p_from_user_id: fromUserId,
          p_to_user_id: toUserId,
        });

      if (error) {
        return { connectionId: null, conversationId: null, error: error.message };
      }

      // Récupérer la conversation associée
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('connection_id', connectionId)
        .single();

      return {
        connectionId,
        conversationId: conversation?.id || null,
        error: null,
      };
    } catch (err) {
      return { connectionId: null, conversationId: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Liker un profil (envoyer une invitation)
   */
  async likeProfile(fromUserId: string, toUserId: string, isSuperLike: boolean = false): Promise<{ isMatch: boolean; error: string | null }> {
    try {
      // Vérifier si une invitation réciproque existe déjà (l'autre nous a liké)
      const { data: reciprocalInvitation } = await supabase
        .from('invitations')
        .select('id, status')
        .eq('from_user_id', toUserId)
        .eq('to_user_id', fromUserId)
        .eq('status', 'pending')
        .single();

      if (reciprocalInvitation) {
        // C'est un match ! Accepter l'invitation et créer la connexion
        const { error: updateError } = await supabase
          .from('invitations')
          .update({ status: 'accepted' })
          .eq('id', reciprocalInvitation.id);

        if (updateError) {
          return { isMatch: false, error: updateError.message };
        }

        // Créer la connexion
        const [user1, user2] = [fromUserId, toUserId].sort();
        const { data: connection, error: connectionError } = await supabase
          .from('connections')
          .insert({
            user1_id: user1,
            user2_id: user2,
            invitation_id: reciprocalInvitation.id,
          })
          .select('id')
          .single();

        if (connectionError && connectionError.code !== '23505') {
          return { isMatch: false, error: connectionError.message };
        }

        // Créer la conversation si la connexion a été créée
        if (connection) {
          await supabase
            .from('conversations')
            .insert({
              connection_id: connection.id,
            });
        }

        return { isMatch: true, error: null };
      }

      // Pas d'invitation réciproque, créer une nouvelle invitation
      const { error: invitationError } = await supabase
        .from('invitations')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          type: isSuperLike ? 'super_like' : 'like',
          status: 'pending',
        });

      if (invitationError) {
        // Si l'invitation existe déjà, ignorer l'erreur
        if (invitationError.code !== '23505') {
          return { isMatch: false, error: invitationError.message };
        }
      }

      return { isMatch: false, error: null };
    } catch (err) {
      return { isMatch: false, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Passer un profil (rejeter / skip)
   * Note: On peut soit ne rien enregistrer (le profil réapparaîtra plus tard),
   * soit enregistrer un "pass" pour éviter de le revoir
   */
  async passProfile(_fromUserId: string, _toUserId: string): Promise<{ error: string | null }> {
    try {
      // Optionnel: Créer une invitation avec status 'rejected' pour éviter de revoir ce profil
      // Ou on peut utiliser une table séparée 'passes' si elle existe
      // Pour l'instant, on ne fait rien car passer un profil est temporaire
      return { error: null };
    } catch (err) {
      return { error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer toutes les connexions d'un utilisateur
   * (Utilise la table 'connections' qui stocke les invitations acceptées)
   */
  async getMatches(userId: string): Promise<{ matches: MatchWithProfile[]; error: string | null }> {
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

      // Construire le résultat
      const result: MatchWithProfile[] = connections.map((connection) => {
        const otherUserId = connection.user1_id === userId ? connection.user2_id : connection.user1_id;
        const otherUser = profilesMap.get(otherUserId);
        const conversation = conversationMap.get(connection.id);

        return {
          id: conversation?.id || connection.id, // Utiliser l'ID de conversation pour la navigation vers le chat
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
          lastMessage: undefined,
          lastMessageAt: conversation?.last_message_at,
          unreadCount: 0,
        };
      });

      return { matches: result, error: null };
    } catch (err) {
      return { matches: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Supprimer une connexion (unmatch)
   */
  async unmatch(connectionId: string): Promise<{ error: string | null }> {
    try {
      // D'abord supprimer la conversation (les messages seront supprimés en cascade)
      await supabase
        .from('conversations')
        .delete()
        .eq('connection_id', connectionId);

      // Puis supprimer la connexion
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer les invitations reçues (personnes qui vous ont liké)
   */
  async getReceivedLikes(userId: string): Promise<{ likes: any[]; error: string | null }> {
    try {
      // Récupérer les invitations en attente reçues
      const { data: invitations, error } = await supabase
        .from('invitations')
        .select('id, from_user_id, type, created_at')
        .eq('to_user_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return { likes: [], error: error.message };
      }

      if (!invitations || invitations.length === 0) {
        return { likes: [], error: null };
      }

      // Récupérer les profils des utilisateurs
      const fromUserIds = invitations.map((inv) => inv.from_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', fromUserIds);

      const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

      const result = invitations.map((invitation) => {
        const profileData = profilesMap.get(invitation.from_user_id);

        return {
          id: invitation.id,
          fromUserId: invitation.from_user_id,
          type: invitation.type,
          createdAt: invitation.created_at,
          profile: profileData ? {
            id: profileData.id,
            displayName: profileData.display_name,
            birthDate: profileData.birth_date,
            age: profileData.age,
            gender: profileData.gender,
            hairColor: profileData.hair_color,
            bio: profileData.bio,
            intention: profileData.intention,
            availability: profileData.availability,
            languages: profileData.languages || [],
            interests: profileData.interests || [],
            photos: profileData.photos || [],
            locationEnabled: profileData.location_enabled,
            latitude: profileData.latitude,
            longitude: profileData.longitude,
            locationUpdatedAt: profileData.location_updated_at,
            searchRadius: profileData.search_radius,
            minAgeFilter: profileData.min_age_filter,
            maxAgeFilter: profileData.max_age_filter,
            genderFilter: profileData.gender_filter || [],
            createdAt: profileData.created_at,
            updatedAt: profileData.updated_at,
          } : null,
        };
      }).filter((l) => l.profile !== null);

      return { likes: result, error: null };
    } catch (err) {
      return { likes: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Vérifier si deux utilisateurs sont connectés (matchés)
   * Utilise la table 'connections' qui stocke les matches acceptés
   */
  async checkMatch(userId1: string, userId2: string): Promise<{ match: Match | null; error: string | null }> {
    try {
      const [user1, user2] = [userId1, userId2].sort();

      const { data: connection, error } = await supabase
        .from('connections')
        .select('*')
        .eq('user1_id', user1)
        .eq('user2_id', user2)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { match: null, error: error.message };
      }

      if (!connection) {
        return { match: null, error: null };
      }

      return {
        match: {
          id: connection.id,
          user1Id: connection.user1_id,
          user2Id: connection.user2_id,
          createdAt: connection.created_at,
        },
        error: null,
      };
    } catch (err) {
      return { match: null, error: 'Une erreur inattendue est survenue' };
    }
  },
};

export default matchesService;
