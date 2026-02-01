/**
 * Configuration du système Niveau de Confort
 */
import type { ComfortLevelType, ComfortLevelDisplay } from '../types/comfortLevel';

// Configuration FR
export const COMFORT_LEVELS_FR: Record<ComfortLevelType, Omit<ComfortLevelDisplay, 'level'>> = {
  chatting: {
    label: 'Discussion',
    description: 'Apprendre à se connaître tranquillement',
    icon: '💬',
    color: '#64B5F6',
    unlockedFeatures: [
      'Messages texte',
      'Partage de photos',
    ],
  },
  flirting: {
    label: 'Connexion',
    description: 'Prêt(e) à approfondir la relation',
    icon: '✨',
    color: '#FF85A2',
    unlockedFeatures: [
      'Tous les avantages précédents',
      'Réactions aux messages',
      'Messages vocaux',
    ],
  },
  open_to_meet: {
    label: 'Rencontre',
    description: 'Ouvert(e) à se voir en personne',
    icon: '🤝',
    color: '#81C784',
    unlockedFeatures: [
      'Tous les avantages précédents',
      'Partage de localisation',
      'Suggestion de lieux',
    ],
  },
};

// Configuration EN
export const COMFORT_LEVELS_EN: Record<ComfortLevelType, Omit<ComfortLevelDisplay, 'level'>> = {
  chatting: {
    label: 'Chatting',
    description: 'Getting to know each other calmly',
    icon: '💬',
    color: '#64B5F6',
    unlockedFeatures: [
      'Text messages',
      'Photo sharing',
    ],
  },
  flirting: {
    label: 'Connection',
    description: 'Ready to deepen the relationship',
    icon: '✨',
    color: '#FF85A2',
    unlockedFeatures: [
      'All previous features',
      'Message reactions',
      'Voice messages',
    ],
  },
  open_to_meet: {
    label: 'Meeting',
    description: 'Open to meeting in person',
    icon: '🤝',
    color: '#81C784',
    unlockedFeatures: [
      'All previous features',
      'Location sharing',
      'Place suggestions',
    ],
  },
};

// Liste ordonnée des niveaux
export const COMFORT_LEVELS_ORDER: ComfortLevelType[] = ['chatting', 'flirting', 'open_to_meet'];

// Niveau par défaut
export const DEFAULT_COMFORT_LEVEL: ComfortLevelType = 'chatting';

// Helper: Obtenir la config d'affichage pour un niveau
export function getComfortLevelDisplay(
  level: ComfortLevelType,
  lang: 'fr' | 'en' = 'fr'
): ComfortLevelDisplay {
  const config = lang === 'fr' ? COMFORT_LEVELS_FR[level] : COMFORT_LEVELS_EN[level];
  return { level, ...config };
}

// Helper: Obtenir le niveau minimum (débloqué) entre deux niveaux
export function getUnlockedLevel(
  level1: ComfortLevelType,
  level2: ComfortLevelType
): ComfortLevelType {
  const index1 = COMFORT_LEVELS_ORDER.indexOf(level1);
  const index2 = COMFORT_LEVELS_ORDER.indexOf(level2);
  return COMFORT_LEVELS_ORDER[Math.min(index1, index2)];
}

// Helper: Vérifier si un niveau est supérieur à un autre
export function isHigherLevel(
  level: ComfortLevelType,
  comparedTo: ComfortLevelType
): boolean {
  return COMFORT_LEVELS_ORDER.indexOf(level) > COMFORT_LEVELS_ORDER.indexOf(comparedTo);
}

// Helper: Obtenir le niveau suivant
export function getNextLevel(level: ComfortLevelType): ComfortLevelType | null {
  const currentIndex = COMFORT_LEVELS_ORDER.indexOf(level);
  if (currentIndex < COMFORT_LEVELS_ORDER.length - 1) {
    return COMFORT_LEVELS_ORDER[currentIndex + 1];
  }
  return null;
}

// Helper: Obtenir le niveau précédent
export function getPreviousLevel(level: ComfortLevelType): ComfortLevelType | null {
  const currentIndex = COMFORT_LEVELS_ORDER.indexOf(level);
  if (currentIndex > 0) {
    return COMFORT_LEVELS_ORDER[currentIndex - 1];
  }
  return null;
}
