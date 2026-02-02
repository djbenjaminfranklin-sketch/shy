import { GenderId } from '../constants/genders';

/**
 * Vérifie si un utilisateur peut envoyer un message direct à un autre
 * sans passer par le système d'invitation/match classique.
 *
 * Règles:
 * - Femme → Homme : Message direct autorisé ✅ (elle a le pouvoir d'initier)
 * - Homme → Femme : Invitation obligatoire ❌ (il doit attendre qu'elle accepte)
 * - Femme → Femme : Message direct autorisé ✅ (égalité)
 * - Homme → Homme : Message direct autorisé ✅ (égalité)
 * - Non-binaire ↔ Tout le monde : Invitation obligatoire ❌ (les deux swipent et attendent)
 */
export const canSendDirectMessage = (
  senderGender: GenderId,
  receiverGender: GenderId
): boolean => {
  // Non-binaire : toujours invitation obligatoire (des deux côtés)
  if (senderGender === 'non-binaire' || receiverGender === 'non-binaire') {
    return false;
  }

  // Femme peut envoyer un message direct à un homme
  if (senderGender === 'femme' && receiverGender === 'homme') {
    return true;
  }

  // Femme → Femme : message direct (égalité)
  if (senderGender === 'femme' && receiverGender === 'femme') {
    return true;
  }

  // Homme → Homme : message direct (égalité)
  if (senderGender === 'homme' && receiverGender === 'homme') {
    return true;
  }

  // Homme → Femme : invitation obligatoire
  return false;
};

/**
 * Vérifie si un utilisateur a le privilège d'initier des conversations
 * Le bouton "Message" est visible selon le genre de l'utilisateur et du profil consulté
 */
export const hasDirectMessagePrivilege = (
  userGender: GenderId,
  targetGender?: GenderId
): boolean => {
  // Sans cible spécifiée, on vérifie juste si l'utilisateur peut envoyer des messages directs à quelqu'un
  if (!targetGender) {
    // Tout le monde sauf les hommes hétéros peut envoyer des messages directs à quelqu'un
    return true; // On affine avec canSendDirectMessage quand on a la cible
  }

  return canSendDirectMessage(userGender, targetGender);
};

/**
 * Retourne le texte explicatif pour l'utilisateur selon son genre
 */
export const getMessagingExplanation = (
  userGender: GenderId,
  language: 'fr' | 'en' = 'fr'
): string => {
  if (userGender === 'femme') {
    return language === 'fr'
      ? 'Vous pouvez envoyer un message directement aux profils qui vous intéressent.'
      : 'You can send a message directly to profiles you\'re interested in.';
  }

  if (userGender === 'non-binaire') {
    return language === 'fr'
      ? 'Envoyez une invitation pour démarrer une conversation.'
      : 'Send an invitation to start a conversation.';
  }

  // Homme
  return language === 'fr'
    ? 'Vous pouvez envoyer un message directement aux hommes. Pour les femmes, envoyez une invitation.'
    : 'You can send a message directly to men. For women, send an invitation.';
};
