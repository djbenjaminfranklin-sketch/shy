// Subscription plans and pricing for SHY
// Positionnement : disponibilité et timing, pas likes/boosts

export type PlanType = 'free' | 'plus' | 'premium';
export type PlanDuration = 'week' | 'month' | '3months' | '6months' | 'year';
export type SubscriptionPlanId = PlanType; // Alias for backwards compatibility

export interface PlanPrice {
  duration: PlanDuration;
  price: number;
  pricePerMonth?: number;
  savings?: number; // percentage
  popular?: boolean;
  bestValue?: boolean;
  productId?: string; // App Store / Play Store product ID
}

export interface SubscriptionPlan {
  id: PlanType;
  name: string;
  title: string; // Titre affiché
  tagline?: string; // Phrase d'accroche
  description?: string; // Description longue
  icon: string;
  color: string;
  features: PlanFeatures;
  featuresList: string[];
  prices: PlanPrice[];
  priceLabel?: string; // Starting price label
}

export interface PlanFeatures {
  // Core features (internal, not displayed)
  invitationsPerDay: number;
  superLikesPerDay: number;
  rewindPerDay: number; // -1 = unlimited
  boostsPerWeek: number;
  seeWhoLikedYou: boolean;
  allFilters: boolean;
  invisibleMode: boolean;
  rewind: boolean; // @deprecated - use rewindPerDay
  premiumBadge: boolean;
  prioritySupport: boolean;
  // Availability mode features (KEY SELLING POINT)
  availabilityModeActivationsPerWeek: number; // -1 = unlimited
  availabilityMode72h: boolean;
  priorityVisibility: boolean; // Visibilité prioritaire
  advancedNotifications: boolean; // Notifications avancées
  // Connection Rhythm features
  connectionRhythmDetailedInsights: boolean;
  // Comfort Level features
  comfortLevelEnabled: boolean;
  // Quick Meet features
  quickMeetProposalsPerDay: number;
  quickMeetPriority: boolean;
  // Engagement Score features
  engagementScoreVisible: boolean;
  engagementScoreDetailedBreakdown: boolean;
  // Travel Mode (International)
  travelModeEnabled: boolean;
  // Internal aliases
  dailyLikes?: number;
  dailyMessages?: number;
  canSeeWhoLikedYou?: boolean;
  canBoostProfile?: boolean;
  canUseFilters?: boolean;
  canSetAutoReply?: boolean;
  canSeeReadReceipts?: boolean;
}

// Plan features
export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    invitationsPerDay: 10,
    superLikesPerDay: 1, // 1 gratuit/jour - standard du marché
    rewindPerDay: 1, // 1 gratuit/jour
    boostsPerWeek: 0,
    seeWhoLikedYou: false,
    allFilters: false,
    invisibleMode: false,
    rewind: false, // @deprecated
    premiumBadge: false,
    prioritySupport: false,
    // Availability mode - LIMITED
    availabilityModeActivationsPerWeek: 1,
    availabilityMode72h: false,
    priorityVisibility: false,
    advancedNotifications: false,
    // Connection Rhythm
    connectionRhythmDetailedInsights: false,
    // Comfort Level
    comfortLevelEnabled: true,
    // Quick Meet
    quickMeetProposalsPerDay: 1, // 1 gratuit/jour - levier différenciant
    quickMeetPriority: false,
    // Engagement Score
    engagementScoreVisible: true,
    engagementScoreDetailedBreakdown: false,
    // Travel Mode
    travelModeEnabled: false,
    // Internal aliases
    dailyLikes: 20, // 20/jour gratuits - pas brutal, message doux
    dailyMessages: -1,
    canSeeWhoLikedYou: false,
    canBoostProfile: false,
    canUseFilters: false,
    canSetAutoReply: false,
    canSeeReadReceipts: false,
  },
  plus: {
    invitationsPerDay: -1,
    superLikesPerDay: 5, // 5/jour pour Plus
    rewindPerDay: -1, // Illimité
    boostsPerWeek: 0,
    seeWhoLikedYou: false,
    allFilters: true,
    invisibleMode: true,
    rewind: true, // @deprecated
    premiumBadge: false,
    prioritySupport: false,
    // Availability mode - UNLIMITED 24h
    availabilityModeActivationsPerWeek: -1,
    availabilityMode72h: false, // Only 24h for Plus
    priorityVisibility: false,
    advancedNotifications: true,
    // Connection Rhythm
    connectionRhythmDetailedInsights: true,
    // Comfort Level
    comfortLevelEnabled: true,
    // Quick Meet
    quickMeetProposalsPerDay: -1, // Illimité
    quickMeetPriority: true,
    // Engagement Score
    engagementScoreVisible: true,
    engagementScoreDetailedBreakdown: true,
    // Travel Mode
    travelModeEnabled: false,
    // Internal aliases
    dailyLikes: -1, // Illimité
    dailyMessages: -1,
    canSeeWhoLikedYou: false,
    canBoostProfile: false,
    canUseFilters: true,
    canSetAutoReply: true,
    canSeeReadReceipts: true,
  },
  premium: {
    invitationsPerDay: -1,
    superLikesPerDay: -1, // Illimité pour Premium
    rewindPerDay: -1, // Illimité
    boostsPerWeek: 0,
    seeWhoLikedYou: false,
    allFilters: true,
    invisibleMode: true,
    rewind: true, // @deprecated
    premiumBadge: true,
    prioritySupport: true,
    // Availability mode - FULL CONTROL
    availabilityModeActivationsPerWeek: -1,
    availabilityMode72h: true, // 24h OR 72h
    priorityVisibility: true, // Visibilité prioritaire
    advancedNotifications: true,
    // Connection Rhythm
    connectionRhythmDetailedInsights: true,
    // Comfort Level
    comfortLevelEnabled: true,
    // Quick Meet
    quickMeetProposalsPerDay: -1, // Illimité
    quickMeetPriority: true,
    // Engagement Score
    engagementScoreVisible: true,
    engagementScoreDetailedBreakdown: true,
    // Travel Mode
    travelModeEnabled: true, // PREMIUM ONLY
    // Internal aliases
    dailyLikes: -1, // Illimité
    dailyMessages: -1,
    canSeeWhoLikedYou: false,
    canBoostProfile: false,
    canUseFilters: true,
    canSetAutoReply: true,
    canSeeReadReceipts: true,
  },
};

// Subscription plans with NEW positioning
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    title: 'Accès essentiel',
    description: 'Découvrez Shy et explorez les profils disponibles autour de vous.',
    icon: '👤',
    color: '#888888',
    features: PLAN_FEATURES.free,
    featuresList: [
      'Accès aux profils confirmés',
      'Activation limitée des modes de disponibilité',
      'Visibilité standard',
      'Messages avec profils compatibles',
    ],
    prices: [
      { duration: 'month', price: 0, productId: 'free' },
    ],
    priceLabel: 'Gratuit',
  },
  {
    id: 'plus',
    name: 'SHY+',
    title: 'Disponible maintenant',
    tagline: 'Pour celles et ceux qui souhaitent se rendre visibles quand ils le décident.',
    description: 'Activez librement vos moments de disponibilité et échangez avec des personnes présentes au même moment.',
    icon: '⭐',
    color: '#FFD700',
    features: PLAN_FEATURES.plus,
    featuresList: [
      'Activations illimitées des modes de disponibilité',
      'Modes d\'une durée de 24 heures',
      'Indicateur discret de disponibilité sur votre profil',
      'Notifications liées à vos périodes actives',
      'Accès aux profils correspondant à votre mode',
    ],
    prices: [
      { duration: 'week', price: 4.99, productId: 'shy_plus_week' },
      { duration: 'month', price: 9.99, popular: true, productId: 'shy_plus_month' },
      { duration: '3months', price: 24.99, pricePerMonth: 8.33, savings: 17, productId: 'shy_plus_3months' },
      { duration: '6months', price: 44.99, pricePerMonth: 7.50, savings: 25, productId: 'shy_plus_6months' },
      { duration: 'year', price: 69.99, pricePerMonth: 5.83, savings: 42, bestValue: true, productId: 'shy_plus_year' },
    ],
    priceLabel: 'À partir de 4,99 €',
  },
  {
    id: 'premium',
    name: 'Premium',
    title: 'Maîtrise du timing',
    tagline: 'Pour celles et ceux qui veulent plus de flexibilité et de confort.',
    description: 'Ajustez votre présence selon votre rythme et bénéficiez d\'une visibilité étendue pendant vos moments actifs.',
    icon: '💎',
    color: '#007AFF',
    features: PLAN_FEATURES.premium,
    featuresList: [
      'Modes de disponibilité 24h ou 72h',
      'Visibilité prioritaire pendant les périodes actives',
      'Notifications avancées liées aux nouveaux profils compatibles',
      'Mode Voyage - Explorez une ville avant d\'y arriver',
      'Contrôle étendu de votre visibilité',
    ],
    prices: [
      { duration: 'week', price: 7.99, productId: 'shy_premium_week' },
      { duration: 'month', price: 19.99, popular: true, productId: 'shy_premium_month' },
      { duration: '3months', price: 49.99, pricePerMonth: 16.66, savings: 17, productId: 'shy_premium_3months' },
      { duration: '6months', price: 89.99, pricePerMonth: 15.00, savings: 25, productId: 'shy_premium_6months' },
      { duration: 'year', price: 139.99, pricePerMonth: 11.67, savings: 42, bestValue: true, productId: 'shy_premium_year' },
    ],
    priceLabel: 'À partir de 7,99 €',
  },
];

// Create a record version for easy lookup by id
export const SUBSCRIPTION_PLANS_BY_ID: Record<PlanType, SubscriptionPlan> = SUBSCRIPTION_PLANS.reduce((acc, plan) => {
  acc[plan.id] = plan;
  return acc;
}, {} as Record<PlanType, SubscriptionPlan>);

// Duration labels (multilingual)
import { SupportedLanguage } from '../i18n';

type DurationLabelEntry = Record<SupportedLanguage, string> & { short: Record<SupportedLanguage, string> };

export const DURATION_LABELS: Record<PlanDuration, DurationLabelEntry> = {
  week: {
    fr: '1 semaine', en: '1 week', es: '1 semana', it: '1 settimana', de: '1 Woche', he: 'שבוע 1', pt: '1 semana',
    short: { fr: '1 sem.', en: '1 wk', es: '1 sem.', it: '1 sett.', de: '1 Wo.', he: '1 שב.', pt: '1 sem.' }
  },
  month: {
    fr: '1 mois', en: '1 month', es: '1 mes', it: '1 mese', de: '1 Monat', he: 'חודש 1', pt: '1 mes',
    short: { fr: '1 mois', en: '1 mo', es: '1 mes', it: '1 mese', de: '1 Mo.', he: '1 חו.', pt: '1 mes' }
  },
  '3months': {
    fr: '3 mois', en: '3 months', es: '3 meses', it: '3 mesi', de: '3 Monate', he: '3 חודשים', pt: '3 meses',
    short: { fr: '3 mois', en: '3 mo', es: '3 mes', it: '3 mesi', de: '3 Mo.', he: '3 חו.', pt: '3 mes' }
  },
  '6months': {
    fr: '6 mois', en: '6 months', es: '6 meses', it: '6 mesi', de: '6 Monate', he: '6 חודשים', pt: '6 meses',
    short: { fr: '6 mois', en: '6 mo', es: '6 mes', it: '6 mesi', de: '6 Mo.', he: '6 חו.', pt: '6 mes' }
  },
  year: {
    fr: '1 an', en: '1 year', es: '1 año', it: '1 anno', de: '1 Jahr', he: 'שנה 1', pt: '1 ano',
    short: { fr: '1 an', en: '1 yr', es: '1 año', it: '1 anno', de: '1 Jr.', he: '1 שנה', pt: '1 ano' }
  },
};

// Helper functions
export const getPlanById = (id: PlanType): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === id);
};

export const getPlanPrice = (planId: PlanType, duration: PlanDuration): PlanPrice | undefined => {
  const plan = getPlanById(planId);
  return plan?.prices.find(p => p.duration === duration);
};

export const formatPrice = (price: number, currency: string = '€'): string => {
  if (price === 0) return 'Gratuit';
  return `${price.toFixed(2).replace('.', ',')} ${currency}`;
};

// Free trial
export const FREE_TRIAL = {
  enabled: false, // Disabled for new positioning
  days: 7,
  plans: ['plus', 'premium'] as PlanType[],
};

// Legacy exports for backwards compatibility
export const SUBSCRIPTION_PLAN_LIST = SUBSCRIPTION_PLANS;
export const PAID_PLANS = SUBSCRIPTION_PLANS.filter((p) => p.id !== 'free');

// Reassurance text (for display at bottom of subscription screen)
export const REASSURANCE_TEXT = {
  fr: 'Chez Shy, chaque profil correspond à une personne réelle. Une courte vérification permet de garantir des échanges authentiques et sereins.',
  en: 'At Shy, every profile is a real person. A quick verification ensures authentic and peaceful interactions.',
};

// Auto-reply templates
export const AUTO_REPLY_TEMPLATES = [
  { id: 'busy', label: 'Occupé(e)', message: 'Merci pour ton message ! Je suis actuellement occupé(e), je te répondrai dès que possible.' },
  { id: 'driving', label: 'En déplacement', message: 'Je suis en déplacement, je te répondrai quand je serai disponible !' },
  { id: 'night', label: 'Nuit', message: 'Je dors probablement en ce moment, je te répondrai demain matin !' },
  { id: 'work', label: 'Au travail', message: 'Je suis au travail, je te répondrai pendant ma pause ou ce soir.' },
  { id: 'custom', label: 'Personnalisé', message: '' },
] as const;

export type AutoReplyTemplateId = typeof AUTO_REPLY_TEMPLATES[number]['id'];

// ============ BOOST PRODUCTS (Legacy) ============

import { BoostProduct } from '../types/boost';

export const BOOST_DURATION_MINUTES = 30;

export const BOOST_PRODUCTS: BoostProduct[] = [
  {
    id: 'boost_1',
    productId: 'shy_boost_1x',
    quantity: 1,
    price: 3.99,
    priceLabel: '3,99 €',
  },
  {
    id: 'boost_3',
    productId: 'shy_boost_3x',
    quantity: 3,
    price: 8.99,
    priceLabel: '8,99 €',
    popular: true,
  },
  {
    id: 'boost_10',
    productId: 'shy_boost_10x',
    quantity: 10,
    price: 24.99,
    priceLabel: '24,99 €',
    bestValue: true,
  },
];

// ============ ICE BREAKER PRODUCTS ============
// Ice Breaker: Envoie automatiquement des messages personnalisés à des profils compatibles

import { IceBreakerProduct } from '../types/icebreaker';

export const ICEBREAKER_PROFILES_PER_USE = 5; // Nombre de profils contactés par Ice Breaker

export const ICEBREAKER_PRODUCTS: IceBreakerProduct[] = [
  {
    id: 'icebreaker_1',
    productId: 'shy_boost_1x',  // Réutilise les IDs Boost existants
    quantity: 1,
    price: 4.99,
    priceLabel: '4,99 €',
  },
  {
    id: 'icebreaker_3',
    productId: 'shy_boost_3x',
    quantity: 3,
    price: 12.99,
    priceLabel: '12,99 €',
    popular: true,
  },
  {
    id: 'icebreaker_10',
    productId: 'shy_boost_10x',
    quantity: 10,
    price: 34.99,
    priceLabel: '34,99 €',
    bestValue: true,
  },
];
