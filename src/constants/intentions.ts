import { colors } from '../theme/colors';

export const INTENTIONS = {
  social: {
    id: 'social',
    label: 'Social / Discuter',
    labelShort: 'Social',
    icon: 'chatbubbles-outline',
    color: colors.intentionSocial,
    description: 'Discuter et échanger avec de nouvelles personnes',
  },
  dating: {
    id: 'dating',
    label: 'Dating',
    labelShort: 'Dating',
    icon: 'heart-outline',
    color: colors.intentionDating,
    description: 'Rencontrer quelqu\'un de spécial',
  },
  amical: {
    id: 'amical',
    label: 'Rencontres amicales',
    labelShort: 'Amical',
    icon: 'people-outline',
    color: colors.intentionAmical,
    description: 'Se faire de nouveaux amis',
  },
  local: {
    id: 'local',
    label: 'Découvrir des gens localement',
    labelShort: 'Local',
    icon: 'location-outline',
    color: colors.intentionLocal,
    description: 'Rencontrer des personnes de votre quartier',
  },
} as const;

export type IntentionId = keyof typeof INTENTIONS;
export type Intention = typeof INTENTIONS[IntentionId];

export const INTENTION_LIST = Object.values(INTENTIONS);
