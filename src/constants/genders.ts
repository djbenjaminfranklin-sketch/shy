export const GENDERS = {
  homme: {
    id: 'homme',
    label: 'Homme',
    icon: 'male-outline',
  },
  femme: {
    id: 'femme',
    label: 'Femme',
    icon: 'female-outline',
  },
  'non-binaire': {
    id: 'non-binaire',
    label: 'Non-binaire',
    icon: 'transgender-outline',
  },
  autre: {
    id: 'autre',
    label: 'Autre',
    icon: 'person-outline',
  },
} as const;

export type GenderId = keyof typeof GENDERS;
export type Gender = typeof GENDERS[GenderId];

export const GENDER_LIST = Object.values(GENDERS);
