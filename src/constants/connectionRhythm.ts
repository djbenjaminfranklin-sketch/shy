/**
 * Configuration du système Rythme de Connexion
 */
import type { RhythmLabel, RhythmScoreDisplay } from '../types/connectionRhythm';

// Score ranges and their labels
export const RHYTHM_SCORE_RANGES: Array<{
  min: number;
  max: number;
  label: RhythmLabel;
}> = [
  { min: 85, max: 100, label: 'perfect_harmony' },
  { min: 70, max: 84, label: 'great_connection' },
  { min: 55, max: 69, label: 'good_compatibility' },
  { min: 40, max: 54, label: 'building' },
  { min: 0, max: 39, label: 'developing' },
];

// Display configuration for each label
export const RHYTHM_DISPLAY_CONFIG: Record<RhythmLabel, Omit<RhythmScoreDisplay, 'label'>> = {
  perfect_harmony: {
    labelText: 'Parfaite harmonie',
    description: 'Vous êtes sur la même longueur d\'onde',
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    icon: '✨',
  },
  great_connection: {
    labelText: 'Très bonne connexion',
    description: 'Votre communication est fluide',
    color: '#8BC34A',
    backgroundColor: 'rgba(139, 195, 74, 0.15)',
    icon: '💬',
  },
  good_compatibility: {
    labelText: 'Bonne compatibilité',
    description: 'Vous apprenez à vous connaître',
    color: '#FFC107',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    icon: '👍',
  },
  building: {
    labelText: 'En construction',
    description: 'Votre rythme s\'ajuste',
    color: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    icon: '🌱',
  },
  developing: {
    labelText: 'À développer',
    description: 'Continuez à échanger',
    color: '#9E9E9E',
    backgroundColor: 'rgba(158, 158, 158, 0.15)',
    icon: '—',
  },
};

// English translations
export const RHYTHM_DISPLAY_CONFIG_EN: Record<RhythmLabel, Omit<RhythmScoreDisplay, 'label'>> = {
  perfect_harmony: {
    labelText: 'Perfect harmony',
    description: 'You\'re on the same wavelength',
    color: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    icon: '✨',
  },
  great_connection: {
    labelText: 'Great connection',
    description: 'Your communication is flowing',
    color: '#8BC34A',
    backgroundColor: 'rgba(139, 195, 74, 0.15)',
    icon: '💬',
  },
  good_compatibility: {
    labelText: 'Good compatibility',
    description: 'You\'re getting to know each other',
    color: '#FFC107',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    icon: '👍',
  },
  building: {
    labelText: 'Building',
    description: 'Your rhythm is adjusting',
    color: '#FF9800',
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    icon: '🌱',
  },
  developing: {
    labelText: 'Developing',
    description: 'Keep exchanging',
    color: '#9E9E9E',
    backgroundColor: 'rgba(158, 158, 158, 0.15)',
    icon: '—',
  },
};

// Trend display
export const TREND_DISPLAY = {
  up: { icon: '↑', labelFr: 'Votre connexion s\'améliore', labelEn: 'Your connection is improving' },
  down: { icon: '↓', labelFr: 'Échangez plus régulièrement', labelEn: 'Exchange more regularly' },
  stable: { icon: '→', labelFr: 'Votre rythme est constant', labelEn: 'Your rhythm is steady' },
};

// Minimum messages required
export const MIN_MESSAGES_FOR_SCORE = 5;

// Helper: Get label from score
export function getRhythmLabel(score: number): RhythmLabel {
  for (const range of RHYTHM_SCORE_RANGES) {
    if (score >= range.min && score <= range.max) {
      return range.label;
    }
  }
  return 'developing';
}

// Helper: Get full display config for a score
export function getRhythmDisplay(score: number, lang: 'fr' | 'en' = 'fr'): RhythmScoreDisplay {
  const label = getRhythmLabel(score);
  const config = lang === 'fr' ? RHYTHM_DISPLAY_CONFIG[label] : RHYTHM_DISPLAY_CONFIG_EN[label];
  return { label, ...config };
}

// Helper: Get trend display
export function getTrendDisplay(trend: 'up' | 'down' | 'stable', lang: 'fr' | 'en' = 'fr') {
  const display = TREND_DISPLAY[trend];
  return {
    icon: display.icon,
    label: lang === 'fr' ? display.labelFr : display.labelEn,
  };
}
