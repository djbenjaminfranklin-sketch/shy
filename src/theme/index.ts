import { colors } from './colors';
import { typography } from './typography';
import { spacing, borderRadius } from './spacing';

export { colors } from './colors';
export type { ColorKey } from './colors';

export { spacing, borderRadius } from './spacing';
export type { SpacingKey, BorderRadiusKey } from './spacing';

export { typography } from './typography';
export type { TypographyKey } from './typography';

export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,

  // Shadows avec glow effects - DARK MODE
  shadows: {
    small: {
      shadowColor: colors.shadowDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: colors.shadowDark,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 1,
      shadowRadius: 12,
      elevation: 4,
    },
    large: {
      shadowColor: colors.shadowDark,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 8,
    },
    subtle: {
      shadowColor: colors.shadowDark,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 2,
    },
    // Glow effects pour boutons d'action
    glowPink: {
      shadowColor: colors.shadowPink,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 8,
    },
    glowBlue: {
      shadowColor: colors.shadowBlue,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 8,
    },
    glowGreen: {
      shadowColor: colors.shadowGreen,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 8,
    },
    glowPurple: {
      shadowColor: colors.shadowPurple,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 8,
    },
    glowOrange: {
      shadowColor: colors.shadowOrange,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 16,
      elevation: 8,
    },
    // Action button shadows
    like: {
      shadowColor: colors.likeGlow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 10,
    },
    dislike: {
      shadowColor: colors.dislikeGlow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 10,
    },
    superLike: {
      shadowColor: colors.superLikeGlow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 10,
    },
    boost: {
      shadowColor: colors.boostGlow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 10,
    },
    rewind: {
      shadowColor: colors.rewindGlow,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 20,
      elevation: 10,
    },
  },

  // Gradients flashy - DARK MODE
  gradients: {
    // Primary pink gradient
    primary: [colors.gradientPinkStart, colors.gradientPinkEnd],
    button: [colors.buttonGradientStart, colors.buttonGradientEnd],

    // Action gradients
    like: [colors.gradientGreenStart, colors.gradientGreenEnd],
    dislike: [colors.gradientPinkStart, colors.gradientPinkEnd],
    superLike: [colors.gradientBlueStart, colors.gradientBlueEnd],
    boost: [colors.gradientPurpleStart, colors.gradientPurpleEnd],
    rewind: [colors.gradientOrangeStart, colors.gradientOrangeEnd],

    // Background gradients
    dark: [colors.background, colors.backgroundSecondary],
    card: [colors.card, colors.cardHover],

    // Flashy multi-color gradients
    rainbow: ['#FF006E', '#8B5CF6', '#00D4FF', '#00FF88'],
    sunset: ['#FF006E', '#FF9500'],
    ocean: ['#00D4FF', '#8B5CF6'],
    neon: ['#00FF88', '#00D4FF'],
    fire: ['#FF006E', '#FF9500', '#FFB04D'],

    // Premium gradients
    gold: ['#FFD700', '#FFA500', '#FF8C00'],
    platinum: ['#E5E4E2', '#A0A0A0', '#808080'],

    // Overlay gradients (for cards)
    overlayBottom: ['transparent', 'rgba(0, 0, 0, 0.8)'],
    overlayFull: ['rgba(0, 0, 0, 0.3)', 'rgba(0, 0, 0, 0.9)'],

    // Legacy compatibility
    warm: [colors.gradientWarmStart, colors.gradientWarmEnd],
    softPink: [colors.gradientPinkStart, colors.gradientPinkEnd],
  },

  // Animations timing
  animation: {
    fast: 150,
    normal: 300,
    slow: 500,
    bounce: 600,
  },

  // Glow intensities pour differents etats
  glowIntensity: {
    idle: 0.3,
    hover: 0.5,
    active: 0.8,
    pulse: 1.0,
  },
} as const;

export default theme;
