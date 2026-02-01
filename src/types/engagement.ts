/**
 * Types pour le système de score d'engagement (type ELO)
 *
 * Le score d'engagement est utilisé pour classer les profils lors de la découverte.
 * Les profils "populaires" sont montrés en priorité aux autres profils "populaires".
 *
 * IMPORTANT: Le score n'est JAMAIS affiché aux utilisateurs.
 */

/**
 * Métriques brutes d'engagement d'un utilisateur
 */
export interface EngagementMetrics {
  /** Nombre d'invitations reçues */
  invitationsReceived: number;
  /** Nombre d'invitations envoyées */
  invitationsSent: number;
  /** Nombre d'invitations acceptées (envoyées par cet utilisateur) */
  invitationsAccepted: number;
  /** Nombre d'invitations refusées (envoyées par cet utilisateur) */
  invitationsRefused: number;
  /** Taux d'acceptation des invitations envoyées (0-1) */
  acceptanceRate: number;
  /** Taux de réponse aux invitations reçues (0-1) */
  responseRate: number;
}

/**
 * Métriques de qualité du profil
 */
export interface ProfileQualityMetrics {
  /** Complétude du profil (0-1) */
  profileCompleteness: number;
  /** Nombre de photos */
  photoCount: number;
  /** Profil vérifié (selfie vidéo) */
  isVerified: boolean;
}

/**
 * Métriques d'activité
 */
export interface ActivityMetrics {
  /** Jours depuis la dernière activité */
  daysSinceLastActivity: number;
  /** Nombre de messages envoyés */
  messagesSentCount: number;
  /** Temps de réponse moyen en heures */
  averageResponseTimeHours: number;
}

/**
 * Scores calculés (0-100)
 */
export interface CalculatedScores {
  /** Score de désirabilité (invitations reçues, taux d'acceptation) */
  desirabilityScore: number;
  /** Score d'activité (dernière connexion, temps de réponse) */
  activityScore: number;
  /** Score de qualité (photos, bio, vérification) */
  qualityScore: number;
  /** Score d'engagement final (composite) */
  engagementScore: number;
}

/**
 * Informations sur le boost nouveau utilisateur
 */
export interface NewUserBoost {
  /** Est un nouvel utilisateur */
  isNewUser: boolean;
  /** Date d'expiration du boost */
  newUserBoostExpiresAt: string | null;
}

/**
 * Score d'engagement complet d'un profil
 */
export interface ProfileEngagementScore
  extends EngagementMetrics,
    ProfileQualityMetrics,
    ActivityMetrics,
    CalculatedScores,
    NewUserBoost {
  id: string;
  userId: string;
  lastCalculatedAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Poids des composantes du score
 * Total = 100%
 */
export const SCORE_WEIGHTS = {
  /** Poids de la désirabilité (invitations reçues) */
  DESIRABILITY: 0.4,
  /** Poids de l'activité (connexion récente) */
  ACTIVITY: 0.3,
  /** Poids de la qualité du profil */
  QUALITY: 0.3,
} as const;

/**
 * Modificateurs de score
 */
export const SCORE_MODIFIERS = {
  /** Boost pour les nouveaux utilisateurs (+30%) */
  NEW_USER_BOOST: 1.3,
  /** Durée du boost nouveau utilisateur en jours */
  NEW_USER_BOOST_DAYS: 7,
  /** Décroissance par jour d'inactivité (-2%) */
  INACTIVITY_DECAY_PER_DAY: 0.02,
  /** Décroissance maximum (-30%) */
  MAX_INACTIVITY_DECAY: 0.3,
  /** Score minimum garanti (jamais invisible) */
  MINIMUM_SCORE: 10,
  /** Score maximum */
  MAXIMUM_SCORE: 100,
  /** Score de départ pour les nouveaux utilisateurs */
  STARTING_SCORE: 50,
} as const;

/**
 * Mapper les données de la DB vers ProfileEngagementScore
 */
export function mapEngagementScoreFromDb(
  data: Record<string, unknown>
): ProfileEngagementScore {
  return {
    id: data.id as string,
    userId: data.user_id as string,

    // Métriques d'engagement
    invitationsReceived: (data.invitations_received as number) || 0,
    invitationsSent: (data.invitations_sent as number) || 0,
    invitationsAccepted: (data.invitations_accepted as number) || 0,
    invitationsRefused: (data.invitations_refused as number) || 0,
    acceptanceRate: (data.acceptance_rate as number) || 0.5,
    responseRate: (data.response_rate as number) || 0.5,

    // Métriques de qualité
    profileCompleteness: (data.profile_completeness as number) || 0,
    photoCount: (data.photo_count as number) || 0,
    isVerified: (data.is_verified as boolean) || false,

    // Métriques d'activité
    daysSinceLastActivity: (data.days_since_last_activity as number) || 0,
    messagesSentCount: (data.messages_sent_count as number) || 0,
    averageResponseTimeHours: (data.average_response_time_hours as number) || 24,

    // Scores calculés
    desirabilityScore: (data.desirability_score as number) || 50,
    activityScore: (data.activity_score as number) || 50,
    qualityScore: (data.quality_score as number) || 50,
    engagementScore: (data.engagement_score as number) || 50,

    // Boost nouveau utilisateur
    isNewUser: (data.is_new_user as boolean) || true,
    newUserBoostExpiresAt: data.new_user_boost_expires_at as string | null,

    // Métadonnées
    lastCalculatedAt: data.last_calculated_at as string,
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}
