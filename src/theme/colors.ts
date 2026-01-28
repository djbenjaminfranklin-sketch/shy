export const colors = {
  // Background - DARK
  background: '#0D0D0D',
  backgroundSecondary: '#1A1A1A',
  card: '#1A1A1A',
  cardHover: '#252525',
  surface: '#2A2A2A',

  // Actions FLASHY
  like: '#00FF88',        // Vert neon - coeur
  likeGlow: 'rgba(0, 255, 136, 0.3)',

  dislike: '#FF006E',     // Rose magenta - X
  dislikeGlow: 'rgba(255, 0, 110, 0.3)',

  superLike: '#00D4FF',   // Bleu electrique - etoile
  superLikeGlow: 'rgba(0, 212, 255, 0.3)',

  boost: '#8B5CF6',       // Violet - eclair
  boostGlow: 'rgba(139, 92, 246, 0.3)',

  // Premium / Subscription
  premium: '#FFD700',     // Or - premium
  premiumGlow: 'rgba(255, 215, 0, 0.3)',
  plus: '#8B5CF6',        // Violet - plus

  rewind: '#FF9500',      // Orange - rewind
  rewindGlow: 'rgba(255, 149, 0, 0.3)',

  send: '#00D4FF',        // Bleu - envoyer message

  // Primary gradient (pour boutons principaux)
  primary: '#FF006E',
  primaryLight: '#FF4D94',
  primaryDark: '#CC0058',
  gradientStart: '#FF006E',
  gradientEnd: '#FF4D94',

  // Secondary
  secondary: '#00D4FF',
  secondaryLight: '#4DE4FF',
  secondaryDark: '#00A8CC',

  // Accent
  accent: '#8B5CF6',
  accentLight: '#A78BFA',
  accentDark: '#7C3AED',

  // Status
  online: '#00FF88',
  offline: '#666666',
  verified: '#00D4FF',
  available: '#00FF88',
  unavailable: '#666666',

  // Texte
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textTertiary: '#666666',
  textMuted: '#4A4A4A',
  textLight: '#FFFFFF',
  textLightSecondary: '#E8E8E8',

  // Intentions (badges colores)
  intentionSocial: '#00D4FF',
  intentionDating: '#FF006E',
  intentionAmical: '#00FF88',
  intentionLocal: '#FF9500',

  // Invitations
  invitationPending: '#FF9500',
  invitationAccepted: '#00FF88',
  invitationExpired: '#666666',

  // Etats
  success: '#00FF88',
  successLight: '#4DFFAA',
  error: '#FF4757',
  errorLight: '#FF6B7A',
  warning: '#FF9500',
  warningLight: '#FFB04D',
  info: '#00D4FF',
  infoLight: '#4DE4FF',

  // Bordures
  border: '#333333',
  borderLight: '#2A2A2A',
  borderDark: '#404040',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.8)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',
  overlayDark: 'rgba(0, 0, 0, 0.9)',

  // Basiques
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Shadows (glow effects)
  shadow: 'rgba(255, 0, 110, 0.2)',
  shadowDark: 'rgba(0, 0, 0, 0.5)',
  shadowPink: 'rgba(255, 0, 110, 0.4)',
  shadowBlue: 'rgba(0, 212, 255, 0.4)',
  shadowGreen: 'rgba(0, 255, 136, 0.4)',
  shadowPurple: 'rgba(139, 92, 246, 0.4)',
  shadowOrange: 'rgba(255, 149, 0, 0.4)',

  // Gradients colors
  gradientPinkStart: '#FF006E',
  gradientPinkEnd: '#FF4D94',
  gradientBlueStart: '#00D4FF',
  gradientBlueEnd: '#4DE4FF',
  gradientGreenStart: '#00FF88',
  gradientGreenEnd: '#4DFFAA',
  gradientPurpleStart: '#8B5CF6',
  gradientPurpleEnd: '#A78BFA',
  gradientOrangeStart: '#FF9500',
  gradientOrangeEnd: '#FFB04D',

  // Boutons
  buttonGradientStart: '#FF006E',
  buttonGradientEnd: '#FF4D94',

  // Tab Bar Dark Style
  tabBarDark: '#0D0D0D',
  tabBarActive: '#FF006E',
  tabBarInactive: '#666666',

  // Compatibilite legacy
  backgroundDark: '#0D0D0D',
  cardDark: '#1A1A1A',
  surfaceDark: '#2A2A2A',
  backgroundWarm: '#1A1A1A',
  gradientWarmStart: '#1A1A1A',
  gradientWarmEnd: '#0D0D0D',
  primaryGradientStart: '#FF006E',
  primaryGradientEnd: '#FF4D94',
  textWarm: '#B0B0B0',
} as const;

export type ColorKey = keyof typeof colors;
