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
   * Liker un profil
   */
  async likeProfile(fromUserId: string, toUserId: string): Promise<{ isMatch: boolean; error: string | null }> {
    try {
      // Enregistrer le like
      const { error: likeError } = await supabase
        .from('likes')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          is_like: true,
        });

      if (likeError) {
        // Si le like existe déjà, ignorer l'erreur
        if (likeError.code !== '23505') {
          return { isMatch: false, error: likeError.message };
        }
      }

      // Vérifier si c'est un match (l'autre personne a aussi liké)
      const { data: reciprocalLike } = await supabase
        .from('likes')
        .select('id')
        .eq('from_user_id', toUserId)
        .eq('to_user_id', fromUserId)
        .eq('is_like', true)
        .single();

      if (reciprocalLike) {
        // C'est un match ! Créer l'entrée match
        const [user1, user2] = [fromUserId, toUserId].sort();

        const { error: matchError } = await supabase
          .from('matches')
          .insert({
            user1_id: user1,
            user2_id: user2,
          });

        if (matchError && matchError.code !== '23505') {
          return { isMatch: false, error: matchError.message };
        }

        // Créer la conversation
        const { data: match } = await supabase
          .from('matches')
          .select('id')
          .eq('user1_id', user1)
          .eq('user2_id', user2)
          .single();

        if (match) {
          await supabase
            .from('conversations')
            .insert({
              match_id: match.id,
            });
        }

        return { isMatch: true, error: null };
      }

      return { isMatch: false, error: null };
    } catch (err) {
      return { isMatch: false, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Passer un profil
   */
  async passProfile(fromUserId: string, toUserId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('likes')
        .insert({
          from_user_id: fromUserId,
          to_user_id: toUserId,
          is_like: false,
        });

      if (error && error.code !== '23505') {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer tous les matchs d'un utilisateur
   */
  async getMatches(userId: string): Promise<{ matches: MatchWithProfile[]; error: string | null }> {
    try {
      // Récupérer les matchs de base (sans join pour éviter erreurs de relation)
      const { data: matches, error } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        return { matches: [], error: error.message };
      }

      if (!matches || matches.length === 0) {
        return { matches: [], error: null };
      }

      // Récupérer les IDs des autres utilisateurs
      const otherUserIds = matches.map((m) =>
        m.user1_id === userId ? m.user2_id : m.user1_id
      );

      // Récupérer les profils séparément
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', otherUserIds);

      const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

      // Récupérer les conversations et derniers messages
      const matchIds = matches.map((m) => m.id);
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, match_id, last_message_at')
        .in('match_id', matchIds);

      const conversationMap = new Map((conversations || []).map((c) => [c.match_id, c]));

      // Construire le résultat
      const result: MatchWithProfile[] = matches.map((match) => {
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const otherUser = profilesMap.get(otherUserId);
        const conversation = conversationMap.get(match.id);

        return {
          id: match.id,
          user1Id: match.user1_id,
          user2Id: match.user2_id,
          createdAt: match.created_at,
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
   * Supprimer un match (unmatch)
   */
  async unmatch(matchId: string): Promise<{ error: string | null }> {
    try {
      // Supprimer le match (les conversations et messages seront supprimés en cascade)
      const { error } = await supabase
        .from('matches')
        .delete()
        .eq('id', matchId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer les likes reçus (personnes qui vous ont liké)
   */
  async getReceivedLikes(userId: string): Promise<{ likes: any[]; error: string | null }> {
    try {
      // Récupérer les likes de base (sans join)
      const { data: likes, error } = await supabase
        .from('likes')
        .select('id, from_user_id, created_at')
        .eq('to_user_id', userId)
        .eq('is_like', true)
        .order('created_at', { ascending: false });

      if (error) {
        return { likes: [], error: error.message };
      }

      if (!likes || likes.length === 0) {
        return { likes: [], error: null };
      }

      // Filtrer ceux qui ne sont pas encore matchés
      const { data: matches } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      const matchedUserIds = new Set(
        (matches || []).flatMap((m) => [m.user1_id, m.user2_id]).filter((id) => id !== userId)
      );

      const unmatchedLikes = likes.filter((like) => !matchedUserIds.has(like.from_user_id));

      if (unmatchedLikes.length === 0) {
        return { likes: [], error: null };
      }

      // Récupérer les profils séparément
      const fromUserIds = unmatchedLikes.map((l) => l.from_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', fromUserIds);

      const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

      const result = unmatchedLikes.map((like) => {
        const profileData = profilesMap.get(like.from_user_id);

        return {
          id: like.id,
          fromUserId: like.from_user_id,
          createdAt: like.created_at,
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
   * Vérifier si deux utilisateurs sont matchés
   */
  async checkMatch(userId1: string, userId2: string): Promise<{ match: Match | null; error: string | null }> {
    try {
      const [user1, user2] = [userId1, userId2].sort();

      const { data: match, error } = await supabase
        .from('matches')
        .select('*')
        .eq('user1_id', user1)
        .eq('user2_id', user2)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { match: null, error: error.message };
      }

      if (!match) {
        return { match: null, error: null };
      }

      return {
        match: {
          id: match.id,
          user1Id: match.user1_id,
          user2Id: match.user2_id,
          createdAt: match.created_at,
        },
        error: null,
      };
    } catch (err) {
      return { match: null, error: 'Une erreur inattendue est survenue' };
    }
  },
};

export default matchesService;
