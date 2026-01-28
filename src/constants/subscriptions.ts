// Subscription plans and pricing for SHY
// 30% moins cher que la concurrence !

export type PlanType = 'free' | 'plus' | 'premium';
export type PlanDuration = 'week' | 'month' | '3months' | '6months' | 'year';

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
  icon: string;
  color: string;
  features: PlanFeatures;
  featuresList: string[];
  prices: PlanPrice[];
}

export interface PlanFeatures {
  invitationsPerDay: number; // -1 = unlimited
  superLikesPerDay: number;
  boostsPerWeek: number;
  seeWhoLikedYou: boolean;
  allFilters: boolean;
  invisibleMode: boolean;
  rewind: boolean;
  premiumBadge: boolean;
  prioritySupport: boolean;
}

// Plan features
export const PLAN_FEATURES: Record<PlanType, PlanFeatures> = {
  free: {
    invitationsPerDay: 10,
    superLikesPerDay: 0,
    boostsPerWeek: 0,
    seeWhoLikedYou: false,
    allFilters: false,
    invisibleMode: false,
    rewind: false,
    premiumBadge: false,
    prioritySupport: false,
  },
  plus: {
    invitationsPerDay: 40,
    superLikesPerDay: 1,
    boostsPerWeek: 0,
    seeWhoLikedYou: true,
    allFilters: true,
    invisibleMode: true,
    rewind: true,
    premiumBadge: false,
    prioritySupport: false,
  },
  premium: {
    invitationsPerDay: -1, // unlimited
    superLikesPerDay: 5,
    boostsPerWeek: 1,
    seeWhoLikedYou: true,
    allFilters: true,
    invisibleMode: true,
    rewind: true,
    premiumBadge: true,
    prioritySupport: true,
  },
};

// Subscription plans with pricing
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    icon: '🆓',
    color: '#888888',
    features: PLAN_FEATURES.free,
    featuresList: [
      '10 invitations/jour',
      'Chat illimité après connexion',
      'Filtres basiques',
    ],
    prices: [
      { duration: 'month', price: 0, productId: 'free' },
    ],
  },
  {
    id: 'plus',
    name: 'SHY+',
    icon: '⭐',
    color: '#FFD700',
    features: PLAN_FEATURES.plus,
    featuresList: [
      '40 invitations/jour',
      'Voir qui t\'a liké',
      '1 Super Like/jour',
      'Tous les filtres',
      'Mode invisible',
      'Retour arrière illimité',
    ],
    prices: [
      { duration: 'week', price: 4.99, productId: 'shy_plus_week' },
      { duration: 'month', price: 9.99, popular: true, productId: 'shy_plus_month' },
      { duration: '3months', price: 24.99, pricePerMonth: 8.33, savings: 17, productId: 'shy_plus_quarterly' },
      { duration: '6months', price: 39.99, pricePerMonth: 6.66, savings: 33, productId: 'shy_plus_6months' },
      { duration: 'year', price: 59.99, pricePerMonth: 5.00, savings: 50, bestValue: true, productId: 'shy_plus_year' },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    icon: '💎',
    color: '#FF006E',
    features: PLAN_FEATURES.premium,
    featuresList: [
      'Invitations illimitées',
      'Voir qui t\'a liké',
      '5 Super Likes/jour',
      '1 Boost/semaine',
      'Tous les filtres',
      'Mode invisible',
      'Retour arrière illimité',
      'Badge Premium ✨',
      'Support prioritaire',
    ],
    prices: [
      { duration: 'week', price: 7.99, productId: 'shy_premium_week' },
      { duration: 'month', price: 19.99, popular: true, productId: 'shy_premium_month' },
      { duration: '3months', price: 44.99, pricePerMonth: 15.00, savings: 25, productId: 'shy_plus_3months' },
      { duration: '6months', price: 74.99, pricePerMonth: 12.50, savings: 38, productId: 'shy_premium_6months' },
      { duration: 'year', price: 99.99, pricePerMonth: 8.33, savings: 58, bestValue: true, productId: 'shy_premium_year' },
    ],
  },
];

// In-app purchases (à la carte)
export const IN_APP_PURCHASES = [
  { id: 'super_likes_5', name: '5 Super Likes', price: 2.99, icon: '⭐', productId: 'shy_super_likes_5' },
  { id: 'boost_1', name: '1 Boost (30 min)', price: 3.99, icon: '🚀', productId: 'shy_boost_1' },
  { id: 'mega_boost_1', name: '1 Mega Boost (3h)', price: 7.99, icon: '⚡', productId: 'shy_mega_boost_1' },
  { id: 'invitations_20', name: '20 Invitations', price: 3.99, icon: '💌', productId: 'shy_invitations_20' },
] as const;

// Duration labels (multilingual)
export const DURATION_LABELS: Record<PlanDuration, { fr: string; en: string; short: { fr: string; en: string } }> = {
  week: { fr: '1 semaine', en: '1 week', short: { fr: '1 sem.', en: '1 wk' } },
  month: { fr: '1 mois', en: '1 month', short: { fr: '1 mois', en: '1 mo' } },
  '3months': { fr: '3 mois', en: '3 months', short: { fr: '3 mois', en: '3 mo' } },
  '6months': { fr: '6 mois', en: '6 months', short: { fr: '6 mois', en: '6 mo' } },
  year: { fr: '1 an', en: '1 year', short: { fr: '1 an', en: '1 yr' } },
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
  enabled: true,
  days: 30, // 1 mois gratuit
  plans: ['plus', 'premium'] as PlanType[],
};

// Legacy exports for backwards compatibility
export const SUBSCRIPTION_PLAN_LIST = SUBSCRIPTION_PLANS;
export const PAID_PLANS = SUBSCRIPTION_PLANS.filter((p) => p.id !== 'free');

// Free limits
export const FREE_LIMITS = {
  DAILY_INVITATIONS: 10,
  DAILY_SUPER_LIKES: 0,
  WEEKLY_BOOSTS: 0,
};
