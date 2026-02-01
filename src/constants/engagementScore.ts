/**
 * Configuration du système Score d'Engagement
 */
import type {
  EngagementLevel,
  EngagementLevelDisplay,
  EngagementAlgorithmConfig,
} from '../types/engagementScore';

// Seuils des niveaux d'engagement
export const ENGAGEMENT_LEVEL_THRESHOLDS: Array<{
  min: number;
  max: number;
  level: EngagementLevel;
}> = [
  { min: 80, max: 100, level: 'very_active' },
  { min: 60, max: 79, level: 'active' },
  { min: 40, max: 59, level: 'moderate' },
  { min: 20, max: 39, level: 'casual' },
  { min: 0, max: 19, level: 'new' },
];

// Configuration d'affichage FR
export const ENGAGEMENT_LEVELS_FR: Record<EngagementLevel, Omit<EngagementLevelDisplay, 'level'>> = {
  very_active: {
    label: 'Très actif',
    description: 'Répond rapidement et engage des conversations',
    icon: '⚡',
    color: '#4CAF50',
    badgeVisible: true,
  },
  active: {
    label: 'Actif',
    description: 'Présent régulièrement sur l\'app',
    icon: '✨',
    color: '#8BC34A',
    badgeVisible: true,
  },
  moderate: {
    label: 'Modéré',
    description: 'Se connecte de temps en temps',
    icon: '👋',
    color: '#FFC107',
    badgeVisible: false,
  },
  casual: {
    label: 'Occasionnel',
    description: 'Visite l\'app occasionnellement',
    icon: '🌱',
    color: '#FF9800',
    badgeVisible: false,
  },
  new: {
    label: 'Nouveau',
    description: 'Vient de rejoindre la communauté',
    icon: '🆕',
    color: '#2196F3',
    badgeVisible: true,
  },
};

// Configuration d'affichage EN
export const ENGAGEMENT_LEVELS_EN: Record<EngagementLevel, Omit<EngagementLevelDisplay, 'level'>> = {
  very_active: {
    label: 'Very active',
    description: 'Responds quickly and starts conversations',
    icon: '⚡',
    color: '#4CAF50',
    badgeVisible: true,
  },
  active: {
    label: 'Active',
    description: 'Regularly present on the app',
    icon: '✨',
    color: '#8BC34A',
    badgeVisible: true,
  },
  moderate: {
    label: 'Moderate',
    description: 'Connects from time to time',
    icon: '👋',
    color: '#FFC107',
    badgeVisible: false,
  },
  casual: {
    label: 'Casual',
    description: 'Visits the app occasionally',
    icon: '🌱',
    color: '#FF9800',
    badgeVisible: false,
  },
  new: {
    label: 'New',
    description: 'Just joined the community',
    icon: '🆕',
    color: '#2196F3',
    badgeVisible: true,
  },
};

// Configuration de l'algorithme
export const ENGAGEMENT_ALGORITHM_CONFIG: EngagementAlgorithmConfig = {
  weights: {
    responsiveness: 30,
    conversation: 30,
    meeting: 20,
    activity: 20,
  },
  thresholds: {
    minDataPoints: 5,
    responseTimeExcellent: 30, // 30 minutes = score max
    responseTimePoor: 1440, // 24 heures = score min
    conversationGood: 10, // 10+ messages = bonne conversation
  },
  safeguards: {
    maxScoreChangePerDay: 15, // Max +/- 15 points par jour
    minTimeBetweenMessages: 5, // 5 secondes minimum
    decayRate: 2, // -2% par jour d'inactivité
  },
};

// Multiplicateurs de boost
export const BOOST_MULTIPLIERS = {
  new_user: 1.5, // +50% pour les nouveaux (7 jours)
  returning: 1.3, // +30% pour les utilisateurs qui reviennent après absence
  high_response: 1.2, // +20% pour taux de réponse > 90%
  meeting_accepted: 1.4, // +40% temporaire après acceptation de rencontre
};

// Helper: Obtenir le niveau d'engagement depuis un score
export function getEngagementLevel(score: number): EngagementLevel {
  for (const threshold of ENGAGEMENT_LEVEL_THRESHOLDS) {
    if (score >= threshold.min && score <= threshold.max) {
      return threshold.level;
    }
  }
  return 'new';
}

// Helper: Obtenir la config d'affichage pour un niveau
export function getEngagementLevelDisplay(
  level: EngagementLevel,
  lang: 'fr' | 'en' = 'fr'
): EngagementLevelDisplay {
  const config = lang === 'fr' ? ENGAGEMENT_LEVELS_FR[level] : ENGAGEMENT_LEVELS_EN[level];
  return { level, ...config };
}

// Helper: Obtenir la config d'affichage depuis un score
export function getEngagementDisplayFromScore(
  score: number,
  lang: 'fr' | 'en' = 'fr'
): EngagementLevelDisplay {
  const level = getEngagementLevel(score);
  return getEngagementLevelDisplay(level, lang);
}

// Helper: Calculer le score de réactivité
export function calculateResponsivenessScore(avgResponseMinutes: number): number {
  const { responseTimeExcellent, responseTimePoor } = ENGAGEMENT_ALGORITHM_CONFIG.thresholds;

  if (avgResponseMinutes <= responseTimeExcellent) {
    return 100;
  }
  if (avgResponseMinutes >= responseTimePoor) {
    return 0;
  }

  // Interpolation linéaire
  const range = responseTimePoor - responseTimeExcellent;
  const position = avgResponseMinutes - responseTimeExcellent;
  return Math.round(100 * (1 - position / range));
}

// Helper: Calculer le score d'activité
export function calculateActivityScore(
  daysActiveLastWeek: number,
  lastActiveHoursAgo: number
): number {
  // Base: jours actifs (0-70 points)
  const daysScore = Math.min(70, daysActiveLastWeek * 10);

  // Bonus: récence (0-30 points)
  let recencyScore = 0;
  if (lastActiveHoursAgo < 1) {
    recencyScore = 30;
  } else if (lastActiveHoursAgo < 6) {
    recencyScore = 25;
  } else if (lastActiveHoursAgo < 24) {
    recencyScore = 20;
  } else if (lastActiveHoursAgo < 48) {
    recencyScore = 10;
  }

  return Math.min(100, daysScore + recencyScore);
}
