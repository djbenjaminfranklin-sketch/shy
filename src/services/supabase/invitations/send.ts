import { supabase } from '../client';
import type { Invitation } from '../../../types/match';
import { checkExistingInvitation, getDailyInvitationCount } from './queries';

// Duree d'expiration des invitations (7 jours)
const INVITATION_EXPIRY_DAYS = 7;

/**
 * Envoyer une invitation
 * Verifie d'abord si l'utilisateur n'a pas depasse sa limite quotidienne
 */
export async function sendInvitation(
  senderId: string,
  receiverId: string
): Promise<{
  invitation: Invitation | null;
  error: string | null;
}> {
  try {
    // Verifier si une invitation existe deja
    const { exists, invitation: existingInvitation, error: checkError } =
      await checkExistingInvitation(senderId, receiverId);

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
    const { count, limit: userLimit, error: countError } = await getDailyInvitationCount(senderId);

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

    // Envoyer une notification push si le destinataire a les notifications activées
    try {
      // Récupérer le profil du destinataire pour vérifier ses préférences
      const { data: receiverProfile } = await supabase
        .from('profiles')
        .select('notification_invitations, push_token')
        .eq('id', receiverId)
        .single();

      if (receiverProfile?.notification_invitations && receiverProfile?.push_token) {
        // Récupérer le nom de l'expéditeur
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', senderId)
          .single();

        // Envoyer la notification via Expo
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: receiverProfile.push_token,
            title: 'Nouvelle invitation',
            body: `${senderProfile?.display_name || 'Quelqu\'un'} souhaite vous rencontrer`,
            data: { type: 'invitation', invitationId: newInvitation.id },
          }),
        });
      }
    } catch (notifError) {
      // Ne pas bloquer l'envoi de l'invitation si la notification échoue
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
}
