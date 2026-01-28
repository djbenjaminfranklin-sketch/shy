export const INTEREST_CATEGORIES = {
  music: {
    id: 'music',
    label: 'Musique',
    icon: 'musical-notes-outline',
    interests: [
      'Pop', 'Rock', 'Hip-Hop', 'Jazz', 'Électro', 'Classique', 'R&B', 'Reggae',
      'Metal', 'Folk', 'Country', 'Latino', 'Afro', 'K-Pop',
    ],
  },
  sport: {
    id: 'sport',
    label: 'Sport',
    icon: 'fitness-outline',
    interests: [
      'Fitness', 'Running', 'Yoga', 'Football', 'Basketball', 'Tennis',
      'Natation', 'Vélo', 'Randonnée', 'Escalade', 'Danse', 'Arts martiaux',
    ],
  },
  culture: {
    id: 'culture',
    label: 'Culture',
    icon: 'book-outline',
    interests: [
      'Cinéma', 'Lecture', 'Théâtre', 'Musées', 'Photographie', 'Art',
      'Histoire', 'Voyages', 'Langues',
    ],
  },
  lifestyle: {
    id: 'lifestyle',
    label: 'Lifestyle',
    icon: 'cafe-outline',
    interests: [
      'Cuisine', 'Gastronomie', 'Vin', 'Café', 'Mode', 'Shopping',
      'Jardinage', 'Animaux', 'Nature', 'Méditation',
    ],
  },
  tech: {
    id: 'tech',
    label: 'Tech & Jeux',
    icon: 'game-controller-outline',
    interests: [
      'Jeux vidéo', 'Tech', 'Startups', 'Gaming', 'Esport',
      'Podcasts', 'Séries', 'Anime', 'Comics',
    ],
  },
  social: {
    id: 'social',
    label: 'Social',
    icon: 'people-outline',
    interests: [
      'Sorties', 'Bars', 'Clubs', 'Concerts', 'Festivals',
      'Brunchs', 'Apéros', 'Soirées',
    ],
  },
} as const;

export type InterestCategoryId = keyof typeof INTEREST_CATEGORIES;
export type InterestCategory = typeof INTEREST_CATEGORIES[InterestCategoryId];

export const ALL_INTERESTS = Object.values(INTEREST_CATEGORIES).flatMap(
  (category) => category.interests
);
