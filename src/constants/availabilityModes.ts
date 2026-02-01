/**
 * Configuration des modes de disponibilité temporaire
 */
import type { AvailabilityModeType, ModeDuration } from '../types/availabilityMode';

export interface AvailabilityModeConfig {
  id: AvailabilityModeType;
  emoji: string;
  labelFr: string;
  labelEn: string;
  badgeFr: string;
  badgeEn: string;
  descriptionFr: string;
  descriptionEn: string;
  color: string;
  backgroundColor: string;
}

export const AVAILABILITY_MODES: Record<AvailabilityModeType, AvailabilityModeConfig> = {
  relaxed: {
    id: 'relaxed',
    emoji: '🌿',
    labelFr: 'Détendu',
    labelEn: 'Relaxed',
    badgeFr: 'Disponible aujourd\'hui',
    badgeEn: 'Available today',
    descriptionFr: 'Prenez le temps de discuter tranquillement',
    descriptionEn: 'Take your time to chat calmly',
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  spontaneous: {
    id: 'spontaneous',
    emoji: '⚡',
    labelFr: 'Spontané',
    labelEn: 'Spontaneous',
    badgeFr: 'Disponible maintenant',
    badgeEn: 'Available now',
    descriptionFr: 'Prêt(e) à faire des rencontres rapidement',
    descriptionEn: 'Ready to meet people quickly',
    color: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
  },
  explorer: {
    id: 'explorer',
    emoji: '🧭',
    labelFr: 'Explorateur',
    labelEn: 'Explorer',
    badgeFr: 'Ouvert cette semaine',
    badgeEn: 'Open this week',
    descriptionFr: 'Curieux de découvrir de nouvelles personnes',
    descriptionEn: 'Curious to discover new people',
    color: '#2196F3',
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
  },
};

export const MODE_DURATIONS: ModeDuration[] = [24, 72];

export const DURATION_LABELS: Record<ModeDuration, { fr: string; en: string }> = {
  24: { fr: '24 heures', en: '24 hours' },
  72: { fr: '72 heures', en: '72 hours' },
};

// Limites par plan
export const MODE_LIMITS = {
  free: {
    activationsPerWeek: 1,
    maxDuration: 24 as ModeDuration,
  },
  plus: {
    activationsPerWeek: -1, // unlimited
    maxDuration: 72 as ModeDuration,
  },
  premium: {
    activationsPerWeek: -1, // unlimited
    maxDuration: 72 as ModeDuration,
  },
};

// Notifications timing (en minutes)
export const MODE_NOTIFICATION_TIMING = {
  expirationWarning: 30, // Notification 30 min avant expiration
};

// Helper pour obtenir la config d'un mode
export const getModeConfig = (modeType: AvailabilityModeType): AvailabilityModeConfig => {
  return AVAILABILITY_MODES[modeType];
};

// Helper pour obtenir le label selon la langue
export const getModeLabel = (modeType: AvailabilityModeType, lang: 'fr' | 'en' = 'fr'): string => {
  const config = AVAILABILITY_MODES[modeType];
  return lang === 'fr' ? config.labelFr : config.labelEn;
};

// Helper pour obtenir le badge selon la langue
export const getModeBadge = (modeType: AvailabilityModeType, lang: 'fr' | 'en' = 'fr'): string => {
  const config = AVAILABILITY_MODES[modeType];
  return lang === 'fr' ? config.badgeFr : config.badgeEn;
};

// Helper pour obtenir la description selon la langue
export const getModeDescription = (modeType: AvailabilityModeType, lang: 'fr' | 'en' = 'fr'): string => {
  const config = AVAILABILITY_MODES[modeType];
  return lang === 'fr' ? config.descriptionFr : config.descriptionEn;
};

// Helper pour obtenir le label de durée selon la langue
export const getDurationLabel = (duration: ModeDuration, lang: 'fr' | 'en' = 'fr'): string => {
  return DURATION_LABELS[duration][lang];
};

// Liste des modes pour l'affichage
export const AVAILABILITY_MODES_LIST = Object.values(AVAILABILITY_MODES);
