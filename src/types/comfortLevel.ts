/**
 * Types pour le système Niveau de Confort
 * Système de progression basé sur le consentement mutuel
 */

// Les 3 niveaux de confort
export type ComfortLevelType = 'chatting' | 'flirting' | 'open_to_meet';

// Ordre des niveaux (pour comparaison)
export const COMFORT_LEVEL_ORDER: Record<ComfortLevelType, number> = {
  chatting: 1,
  flirting: 2,
  open_to_meet: 3,
};

// État du niveau de confort d'un utilisateur dans une conversation
export interface UserComfortLevel {
  odId: string;
  odconversationId: string;
  userId: string;
  level: ComfortLevelType;
  updatedAt: string;
}

// État partagé du niveau de confort dans une conversation
export interface ConversationComfortState {
  conversationId: string;
  user1Level: ComfortLevelType;
  user2Level: ComfortLevelType;
  // Le niveau débloqué est le minimum des deux
  unlockedLevel: ComfortLevelType;
  // Indique si les deux utilisateurs sont au même niveau
  isMutual: boolean;
  // Indique si l'autre utilisateur a un niveau plus élevé (invitation à monter)
  otherUserHigher: boolean;
}

// Configuration d'affichage pour chaque niveau
export interface ComfortLevelDisplay {
  level: ComfortLevelType;
  label: string;
  description: string;
  icon: string;
  color: string;
  unlockedFeatures: string[];
}

// Résultat de la mise à jour du niveau
export interface ComfortLevelUpdateResult {
  success: boolean;
  newLevel: ComfortLevelType;
  unlockedLevel: ComfortLevelType;
  isMutual: boolean;
  error?: string;
}

// Notification de changement de niveau
export interface ComfortLevelNotification {
  type: 'level_matched' | 'other_upgraded' | 'other_downgraded';
  level: ComfortLevelType;
  otherUserName: string;
}
