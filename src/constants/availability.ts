export const AVAILABILITY_OPTIONS = {
  aujourdhui: {
    id: 'aujourdhui',
    label: 'Disponible aujourd\'hui',
    labelShort: 'Aujourd\'hui',
    icon: 'sunny-outline',
  },
  'apres-midi': {
    id: 'apres-midi',
    label: 'Disponible cet après-midi',
    labelShort: 'Après-midi',
    icon: 'partly-sunny-outline',
  },
  'ce-soir': {
    id: 'ce-soir',
    label: 'Disponible ce soir',
    labelShort: 'Ce soir',
    icon: 'moon-outline',
  },
  weekend: {
    id: 'weekend',
    label: 'Disponible ce week-end',
    labelShort: 'Week-end',
    icon: 'calendar-outline',
  },
} as const;

export type AvailabilityId = keyof typeof AVAILABILITY_OPTIONS;
export type Availability = typeof AVAILABILITY_OPTIONS[AvailabilityId];

export const AVAILABILITY_LIST = Object.values(AVAILABILITY_OPTIONS);
