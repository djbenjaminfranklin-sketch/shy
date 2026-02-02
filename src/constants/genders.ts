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
  'homme-trans': {
    id: 'homme-trans',
    label: 'Homme trans',
    icon: 'male-outline',
  },
  'femme-trans': {
    id: 'femme-trans',
    label: 'Femme trans',
    icon: 'female-outline',
  },
  'non-binaire': {
    id: 'non-binaire',
    label: 'Non-binaire',
    icon: 'transgender-outline',
  },
  genderqueer: {
    id: 'genderqueer',
    label: 'Genderqueer',
    icon: 'transgender-outline',
  },
  'prefere-ne-pas-dire': {
    id: 'prefere-ne-pas-dire',
    label: 'Préfère ne pas dire',
    icon: 'person-outline',
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
