import { supabase } from '../client';
import type { Match } from '../../../types/match';
import { canSendDirectMessage } from '../../../utils/messagingPermissions';
import { GenderId } from '../../../constants/genders';

/**
 * Créer une connexion instantanée pour les messages directs
 * (Femme -> Homme ou Non-binaire -> Non-binaire)
 * Utilise une fonction SQL sécurisée qui vérifie les permissions
 */
export async function createInstantConnection(
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
}

/**
 * Liker un profil (envoyer une invitation)
 */
export async function likeProfile(fromUserId: string, toUserId: string, isSuperLike: boolean = false): Promise<{ isMatch: boolean; error: string | null }> {
  try {
    // Vérifier si une invitation réciproque existe déjà (l'autre nous a liké)
    const { data: reciprocalInvitation } = await supabase
      .from('invitations')
      .select('id, status')
      .eq('sender_id', toUserId)
      .eq('receiver_id', fromUserId)
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
        sender_id: fromUserId,
        receiver_id: toUserId,
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
}

/**
 * Passer un profil (rejeter / skip)
 * Note: On peut soit ne rien enregistrer (le profil réapparaîtra plus tard),
 * soit enregistrer un "pass" pour éviter de le revoir
 */
export async function passProfile(_fromUserId: string, _toUserId: string): Promise<{ error: string | null }> {
  try {
    // Optionnel: Créer une invitation avec status 'rejected' pour éviter de revoir ce profil
    // Ou on peut utiliser une table séparée 'passes' si elle existe
    // Pour l'instant, on ne fait rien car passer un profil est temporaire
    return { error: null };
  } catch (err) {
    return { error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Supprimer une connexion (unmatch)
 */
export async function unmatch(connectionId: string): Promise<{ error: string | null }> {
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
}

/**
 * Vérifier si deux utilisateurs sont connectés (matchés)
 * Utilise la table 'connections' qui stocke les matches acceptés
 */
export async function checkMatch(userId1: string, userId2: string): Promise<{ match: Match | null; error: string | null }> {
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
}
