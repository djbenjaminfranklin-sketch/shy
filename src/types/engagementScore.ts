/**
 * Types pour le système Score d'Engagement
 * Algorithme de classement basé sur l'engagement réel
 */

// Composantes du score d'engagement
export interface EngagementMetrics {
  // Réactivité (0-100)
  responsivenessScore: number;
  avgResponseTimeMinutes: number;
  responseRate: number; // % de messages auxquels l'utilisateur répond

  // Continuité des conversations (0-100)
  conversationScore: number;
  avgConversationLength: number; // nombre de messages par conversation
  conversationsStarted: number;
  conversationsContinued: number; // conversations avec 5+ messages

  // Initiative de rencontre (0-100)
  meetingScore: number;
  meetingsProposed: number;
  meetingsAccepted: number;
  meetingsDeclined: number;

  // Activité (0-100)
  activityScore: number;
  daysActiveLastWeek: number;
  avgSessionsPerDay: number;
  lastActiveAt: string;

  // Score total pondéré (0-100)
  totalScore: number;

  // Métadonnées
  calculatedAt: string;
  dataPoints: number; // nombre d'interactions analysées
}

// Niveau d'engagement affiché à l'utilisateur
export type EngagementLevel =
  | 'very_active'    // 80-100
  | 'active'         // 60-79
  | 'moderate'       // 40-59
  | 'casual'         // 20-39
  | 'new';           // < 20 ou nouveau profil

// Configuration d'affichage pour chaque niveau
export interface EngagementLevelDisplay {
  level: EngagementLevel;
  label: string;
  description: string;
  icon: string;
  color: string;
  badgeVisible: boolean; // Afficher le badge sur le profil
}

// Facteurs de boost temporaires
export interface EngagementBoost {
  id: string;
  userId: string;
  boostType: 'new_user' | 'returning' | 'high_response' | 'meeting_accepted';
  multiplier: number; // ex: 1.5 = +50%
  expiresAt: string;
}

// Paramètres de l'algorithme
export interface EngagementAlgorithmConfig {
  // Poids des composantes (total = 100)
  weights: {
    responsiveness: number;  // 30
    conversation: number;    // 30
    meeting: number;         // 20
    activity: number;        // 20
  };

  // Seuils
  thresholds: {
    minDataPoints: number;          // Minimum d'interactions pour un score valide
    responseTimeExcellent: number;  // Minutes pour score max
    responseTimePoor: number;       // Minutes pour score min
    conversationGood: number;       // Messages pour conversation "bonne"
  };

  // Anti-manipulation
  safeguards: {
    maxScoreChangePerDay: number;   // Limite de variation quotidienne
    minTimeBetweenMessages: number; // Secondes minimum entre messages (anti-spam)
    decayRate: number;              // Taux de décroissance si inactif (% par jour)
  };
}

// Résultat du classement pour discover
export interface RankedProfile {
  profileId: string;
  engagementScore: number;
  engagementLevel: EngagementLevel;
  boostMultiplier: number;
  finalRank: number;
  // Autres facteurs de matching (distance, préférences, etc.)
  matchScore: number;
}
