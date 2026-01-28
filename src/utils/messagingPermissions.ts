import { GenderId } from '../constants/genders';

/**
 * Vérifie si un utilisateur peut envoyer un message direct à un autre
 * sans passer par le système d'invitation/match classique.
 *
 * Règles:
 * - Femme → Homme : Message direct autorisé ✅
 * - Non-binaire → Non-binaire : Message direct autorisé ✅
 * - Tous les autres cas : Invitation obligatoire ❌
 */
export const canSendDirectMessage = (
  senderGender: GenderId,
  receiverGender: GenderId
): boolean => {
  // Femme peut envoyer un message direct à un homme
  if (senderGender === 'femme' && receiverGender === 'homme') {
    return true;
  }

  // Non-binaire peut envoyer un message direct à un autre non-binaire
  if (senderGender === 'non-binaire' && receiverGender === 'non-binaire') {
    return true;
  }

  // Tous les autres cas : invitation obligatoire
  return false;
};

/**
 * Vérifie si un utilisateur a le privilège d'initier des conversations
 * (peut voir le bouton "Message" sur les profils)
 */
export const hasDirectMessagePrivilege = (userGender: GenderId): boolean => {
  return userGender === 'femme' || userGender === 'non-binaire';
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
      ? 'Vous pouvez envoyer un message directement aux hommes qui vous intéressent.'
      : 'You can send a message directly to men you\'re interested in.';
  }

  if (userGender === 'non-binaire') {
    return language === 'fr'
      ? 'Vous pouvez envoyer un message directement aux personnes non-binaires.'
      : 'You can send a message directly to non-binary people.';
  }

  return language === 'fr'
    ? 'Envoyez une invitation pour démarrer une conversation.'
    : 'Send an invitation to start a conversation.';
};
