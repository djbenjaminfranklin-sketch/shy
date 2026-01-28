import { supabase } from './client';
import type {
  Invitation,
  InvitationWithProfile,
  Connection,
  ConnectionWithProfile,
} from '../../types/match';

// Constantes pour les limites d'invitations
const DAILY_INVITATION_LIMITS = {
  male: 40,
  female: Infinity,
  non_binary: Infinity,
  other: Infinity,
} as const;

// Duree d'expiration des invitations (7 jours en millisecondes)
const INVITATION_EXPIRY_DAYS = 7;

/**
 * Transforme les donnees brutes du profil Supabase en format Profile
 */
function mapProfileData(profileData: Record<string, unknown>) {
  return {
    id: profileData.id as string,
    displayName: profileData.display_name as string,
    birthDate: profileData.birth_date as string,
    age: profileData.age as number,
    gender: profileData.gender as string,
    hairColor: profileData.hair_color as string | null,
    bio: profileData.bio as string | null,
    intention: profileData.intention as string,
    availability: profileData.availability as string | null,
    languages: (profileData.languages as string[]) || [],
    interests: (profileData.interests as string[]) || [],
    photos: (profileData.photos as string[]) || [],
    locationEnabled: profileData.location_enabled as boolean,
    latitude: profileData.latitude as number | null,
    longitude: profileData.longitude as number | null,
    locationUpdatedAt: profileData.location_updated_at as string | null,
    searchRadius: profileData.search_radius as number,
    minAgeFilter: profileData.min_age_filter as number,
    maxAgeFilter: profileData.max_age_filter as number,
    genderFilter: (profileData.gender_filter as string[]) || [],
    createdAt: profileData.created_at as string,
    updatedAt: profileData.updated_at as string,
  };
}

export const invitationsService = {
  /**
   * Envoyer une invitation
   * Verifie d'abord si l'utilisateur n'a pas depasse sa limite quotidienne
   */
  async sendInvitation(
    senderId: string,
    receiverId: string
  ): Promise<{
    invitation: Invitation | null;
    error: string | null;
  }> {
    try {
      // Verifier si une invitation existe deja
      const { exists, invitation: existingInvitation, error: checkError } =
        await this.checkExistingInvitation(senderId, receiverId);

      if (checkError) {
        return { invitation: null, error: checkError };
      }

      if (exists && existingInvitation) {
        // Si l'invitation est en attente ou acceptee, ne pas en creer une nouvelle
        if (existingInvitation.status === 'pending' || existingInvitation.status === 'accepted') {
          return {
            invitation: existingInvitation,
            error: 'Une invitation existe deja pour cet utilisateur',
          };
        }
      }

      // Verifier la limite quotidienne
      const { count, limit: userLimit, error: countError } = await this.getDailyInvitationCount(senderId);

      if (countError) {
        return { invitation: null, error: countError };
      }

      if (count >= userLimit) {
        return {
          invitation: null,
          error: `Vous avez atteint votre limite quotidienne de ${userLimit} invitations`,
        };
      }

      // Calculer la date d'expiration (7 jours)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

      // Creer l'invitation
      const { data: newInvitation, error: insertError } = await supabase
        .from('invitations')
        .insert({
          sender_id: senderId,
          receiver_id: receiverId,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '23505') {
          return { invitation: null, error: 'Une invitation existe deja pour cet utilisateur' };
        }
        return {
          invitation: null,
          error: `Erreur lors de l'envoi de l'invitation: ${insertError.message}`,
        };
      }

      return {
        invitation: {
          id: newInvitation.id,
          senderId: newInvitation.sender_id,
          receiverId: newInvitation.receiver_id,
          status: newInvitation.status,
          sentAt: newInvitation.sent_at || newInvitation.created_at,
          expiresAt: newInvitation.expires_at,
          respondedAt: newInvitation.responded_at,
        },
        error: null,
      };
    } catch (err) {
      return { invitation: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Recuperer les invitations envoyees (pour voir leur statut)
   * Ne montre que "En attente" ou "Acceptee" (pas de "Refusee")
   */
  async getSentInvitations(userId: string): Promise<{
    invitations: InvitationWithProfile[];
    error: string | null;
  }> {
    try {
      const { data: invitations, error } = await supabase
        .from('invitations')
        .select(
          `
          *,
          receiver:profiles!invitations_receiver_id_fkey(*)
        `
        )
        .eq('sender_id', userId)
        .in('status', ['pending', 'accepted']) // Ne pas montrer les refus
        .order('created_at', { ascending: false });

      if (error) {
        return { invitations: [], error: error.message };
      }

      // Filtrer les invitations expirees
      const now = new Date();
      const result: InvitationWithProfile[] = (invitations || [])
        .filter((inv) => {
          // Si l'invitation est acceptee, la garder
          if (inv.status === 'accepted') return true;
          // Si pending, verifier si pas expiree
          return new Date(inv.expires_at) > now;
        })
        .map((inv) => {
          const profileData = Array.isArray(inv.receiver) ? inv.receiver[0] : inv.receiver;

          return {
            id: inv.id,
            senderId: inv.sender_id,
            receiverId: inv.receiver_id,
            status: inv.status,
            sentAt: inv.sent_at || inv.created_at,
            expiresAt: inv.expires_at,
            respondedAt: inv.responded_at,
            receiverProfile: mapProfileData(profileData),
          } as InvitationWithProfile;
        });

      return { invitations: result, error: null };
    } catch (err) {
      return { invitations: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Recuperer les invitations recues (en attente uniquement)
   */
  async getReceivedInvitations(userId: string): Promise<{
    invitations: InvitationWithProfile[];
    error: string | null;
  }> {
    try {
      const { data: invitations, error } = await supabase
        .from('invitations')
        .select(
          `
          *,
          sender:profiles!invitations_sender_id_fkey(*)
        `
        )
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        return { invitations: [], error: error.message };
      }

      // Filtrer les invitations expirees
      const now = new Date();
      const result: InvitationWithProfile[] = (invitations || [])
        .filter((inv) => new Date(inv.expires_at) > now)
        .map((inv) => {
          const profileData = Array.isArray(inv.sender) ? inv.sender[0] : inv.sender;

          return {
            id: inv.id,
            senderId: inv.sender_id,
            receiverId: inv.receiver_id,
            status: inv.status,
            sentAt: inv.sent_at || inv.created_at,
            expiresAt: inv.expires_at,
            respondedAt: inv.responded_at,
            senderProfile: mapProfileData(profileData),
          } as InvitationWithProfile;
        });

      return { invitations: result, error: null };
    } catch (err) {
      return { invitations: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Accepter une invitation - cree une connection et une conversation
   */
  async acceptInvitation(
    invitationId: string,
    userId: string
  ): Promise<{
    connection: Connection | null;
    error: string | null;
  }> {
    try {
      // Recuperer l'invitation
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('receiver_id', userId)
        .eq('status', 'pending')
        .single();

      if (fetchError || !invitation) {
        return { connection: null, error: 'Invitation non trouvee ou deja traitee' };
      }

      // Verifier si l'invitation n'est pas expiree
      if (new Date(invitation.expires_at) < new Date()) {
        // Marquer comme expiree
        await supabase.from('invitations').update({ status: 'expired' }).eq('id', invitationId);

        return { connection: null, error: 'Cette invitation a expire' };
      }

      // Mettre a jour le statut de l'invitation
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (updateError) {
        return { connection: null, error: `Erreur lors de l'acceptation: ${updateError.message}` };
      }

      // Creer la connection d'abord (car conversations.connection_id est NOT NULL)
      const [user1, user2] = [invitation.sender_id, invitation.receiver_id].sort();

      const { data: connection, error: connError } = await supabase
        .from('connections')
        .insert({
          user1_id: user1,
          user2_id: user2,
          invitation_id: invitationId,
        })
        .select()
        .single();

      if (connError) {
        return {
          connection: null,
          error: `Erreur lors de la creation de la connection: ${connError.message}`,
        };
      }

      // Creer la conversation avec le connection_id
      const { error: convError } = await supabase
        .from('conversations')
        .insert({
          connection_id: connection.id,
        });

      if (convError) {
        return {
          connection: null,
          error: `Erreur lors de la creation de la conversation: ${convError.message}`,
        };
      }

      return {
        connection: {
          id: connection.id,
          user1Id: connection.user1_id,
          user2Id: connection.user2_id,
          invitationId: connection.invitation_id,
          createdAt: connection.created_at,
        },
        error: null,
      };
    } catch (err) {
      return { connection: null, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Refuser une invitation (silencieusement - l'envoyeur ne voit pas le refus)
   */
  async refuseInvitation(
    invitationId: string,
    userId: string
  ): Promise<{
    error: string | null;
  }> {
    try {
      // Verifier que l'invitation existe et appartient bien au destinataire
      const { data: invitation, error: fetchError } = await supabase
        .from('invitations')
        .select('id, receiver_id, status')
        .eq('id', invitationId)
        .eq('receiver_id', userId)
        .single();

      if (fetchError || !invitation) {
        return { error: 'Invitation non trouvee' };
      }

      if (invitation.status !== 'pending') {
        return { error: 'Cette invitation a deja ete traitee' };
      }

      // Mettre a jour le statut en "refused"
      // Note: L'envoyeur verra toujours "En attente" puis "Expiree" grace au filtre dans getSentInvitations
      const { error: updateError } = await supabase
        .from('invitations')
        .update({
          status: 'refused',
          responded_at: new Date().toISOString(),
        })
        .eq('id', invitationId);

      if (updateError) {
        return { error: `Erreur lors du refus: ${updateError.message}` };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Recuperer le nombre d'invitations envoyees aujourd'hui
   */
  async getDailyInvitationCount(userId: string): Promise<{
    count: number;
    limit: number;
    error: string | null;
  }> {
    try {
      // Recuperer le genre de l'utilisateur pour determiner la limite
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('gender')
        .eq('id', userId)
        .single();

      if (profileError) {
        return { count: 0, limit: 0, error: 'Impossible de recuperer votre profil' };
      }

      const gender = profile.gender as keyof typeof DAILY_INVITATION_LIMITS;
      const limit = DAILY_INVITATION_LIMITS[gender] ?? DAILY_INVITATION_LIMITS.other;

      // Calculer le debut de la journee (minuit)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Compter les invitations envoyees aujourd'hui
      const { count, error: countError } = await supabase
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .gte('created_at', today.toISOString());

      if (countError) {
        return { count: 0, limit, error: countError.message };
      }

      return { count: count || 0, limit, error: null };
    } catch (err) {
      return { count: 0, limit: 0, error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Recuperer toutes les connections (invitations acceptees)
   */
  async getConnections(userId: string): Promise<{
    connections: ConnectionWithProfile[];
    error: string | null;
  }> {
    try {
      const { data: connections, error } = await supabase
        .from('connections')
        .select(
          `
          *,
          user1:profiles!connections_user1_id_fkey(*),
          user2:profiles!connections_user2_id_fkey(*),
          conversation:conversations(
            id,
            last_message_at,
            messages(content, created_at, is_read, sender_id)
          )
        `
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        return { connections: [], error: error.message };
      }

      const result: ConnectionWithProfile[] = (connections || []).map((conn) => {
        const otherUser = conn.user1_id === userId ? conn.user2 : conn.user1;
        const profileData = Array.isArray(otherUser) ? otherUser[0] : otherUser;
        const conversation = Array.isArray(conn.conversation)
          ? conn.conversation[0]
          : conn.conversation;
        const messages = conversation?.messages || [];
        const lastMessage = messages[0];
        const unreadCount = messages.filter(
          (m: { is_read: boolean; sender_id: string }) => !m.is_read && m.sender_id !== userId
        ).length;

        return {
          id: conn.id,
          user1Id: conn.user1_id,
          user2Id: conn.user2_id,
          invitationId: conn.invitation_id,
          createdAt: conn.created_at,
          profile: mapProfileData(profileData),
          lastMessage: lastMessage?.content,
          lastMessageAt: lastMessage?.created_at,
          unreadCount,
        } as ConnectionWithProfile;
      });

      return { connections: result, error: null };
    } catch (err) {
      return { connections: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Supprimer une connection
   */
  async removeConnection(connectionId: string): Promise<{
    error: string | null;
  }> {
    try {
      // La suppression en cascade supprimera aussi la conversation associee
      const { error } = await supabase.from('connections').delete().eq('id', connectionId);

      if (error) {
        return { error: `Erreur lors de la suppression: ${error.message}` };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Verifier si une invitation existe deja entre deux users
   */
  async checkExistingInvitation(
    senderId: string,
    receiverId: string
  ): Promise<{
    exists: boolean;
    invitation: Invitation | null;
    error: string | null;
  }> {
    try {
      // Chercher une invitation dans les deux sens
      const { data: invitation, error } = await supabase
        .from('invitations')
        .select('*')
        .or(
          `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),` +
            `and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
        )
        .in('status', ['pending', 'accepted'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        return { exists: false, invitation: null, error: error.message };
      }

      if (!invitation) {
        return { exists: false, invitation: null, error: null };
      }

      return {
        exists: true,
        invitation: {
          id: invitation.id,
          senderId: invitation.sender_id,
          receiverId: invitation.receiver_id,
          status: invitation.status,
          sentAt: invitation.sent_at || invitation.created_at,
          expiresAt: invitation.expires_at,
          respondedAt: invitation.responded_at,
        },
        error: null,
      };
    } catch (err) {
      return { exists: false, invitation: null, error: 'Une erreur inattendue est survenue' };
    }
  },
};

export default invitationsService;
