import { supabase } from '../client';
import type {
  Invitation,
  InvitationWithProfile,
} from '../../../types/match';
import { mapProfileData } from './helpers';

// Constantes pour les limites d'invitations
const DAILY_INVITATION_LIMITS = {
  male: 40,
  female: Infinity,
  non_binary: Infinity,
  other: Infinity,
} as const;

/**
 * Recuperer les invitations envoyees (pour voir leur statut)
 * Ne montre que "En attente" ou "Acceptee" (pas de "Refusee")
 */
export async function getSentInvitations(userId: string): Promise<{
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
}

/**
 * Recuperer les invitations recues (en attente uniquement)
 */
export async function getReceivedInvitations(userId: string): Promise<{
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
}

/**
 * Recuperer le nombre d'invitations envoyees aujourd'hui
 */
export async function getDailyInvitationCount(userId: string): Promise<{
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
}

/**
 * Verifier si une invitation existe deja entre deux users
 */
export async function checkExistingInvitation(
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
}
