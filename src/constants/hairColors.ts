export const HAIR_COLORS = {
  noir: {
    id: 'noir',
    label: 'Noir',
    color: '#1A1A1A',
  },
  brun: {
    id: 'brun',
    label: 'Brun',
    color: '#4A3728',
  },
  chatain: {
    id: 'chatain',
    label: 'Châtain',
    color: '#8B5A2B',
  },
  roux: {
    id: 'roux',
    label: 'Roux',
    color: '#B55239',
  },
  blond: {
    id: 'blond',
    label: 'Blond',
    color: '#E0C68B',
  },
  blanc: {
    id: 'blanc',
    label: 'Blanc / Gris',
    color: '#C0C0C0',
  },
  colore: {
    id: 'colore',
    label: 'Coloré',
    color: '#FF69B4',
  },
  chauve: {
    id: 'chauve',
    label: 'Chauve',
    color: '#F5E6D3',
  },
} as const;

export type HairColorId = keyof typeof HAIR_COLORS;
export type HairColor = typeof HAIR_COLORS[HairColorId];

export const HAIR_COLOR_LIST = Object.values(HAIR_COLORS);
