// Types pour le Mode Voyage / International

export interface TravelLocation {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface TravelMode {
  id: string;
  userId: string;
  destination: TravelLocation;
  arrivalDate: string; // ISO date string
  departureDate?: string; // ISO date string (optional)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TravelModeFormData {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  arrivalDate: Date;
  departureDate?: Date;
}

// Villes populaires pour suggestion rapide
export const POPULAR_CITIES: TravelLocation[] = [
  // France
  { city: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
  { city: 'Lyon', country: 'France', latitude: 45.7640, longitude: 4.8357 },
  { city: 'Marseille', country: 'France', latitude: 43.2965, longitude: 5.3698 },
  { city: 'Nice', country: 'France', latitude: 43.7102, longitude: 7.2620 },
  { city: 'Bordeaux', country: 'France', latitude: 44.8378, longitude: -0.5792 },
  { city: 'Toulouse', country: 'France', latitude: 43.6047, longitude: 1.4442 },
  // Espagne
  { city: 'Barcelone', country: 'Espagne', latitude: 41.3851, longitude: 2.1734 },
  { city: 'Madrid', country: 'Espagne', latitude: 40.4168, longitude: -3.7038 },
  { city: 'Marbella', country: 'Espagne', latitude: 36.5099, longitude: -4.8862 },
  { city: 'Ibiza', country: 'Espagne', latitude: 38.9067, longitude: 1.4206 },
  { city: 'Malaga', country: 'Espagne', latitude: 36.7213, longitude: -4.4214 },
  { city: 'Valence', country: 'Espagne', latitude: 39.4699, longitude: -0.3763 },
  { city: 'Séville', country: 'Espagne', latitude: 37.3891, longitude: -5.9845 },
  // Europe
  { city: 'Londres', country: 'Royaume-Uni', latitude: 51.5074, longitude: -0.1278 },
  { city: 'Amsterdam', country: 'Pays-Bas', latitude: 52.3676, longitude: 4.9041 },
  { city: 'Berlin', country: 'Allemagne', latitude: 52.5200, longitude: 13.4050 },
  { city: 'Rome', country: 'Italie', latitude: 41.9028, longitude: 12.4964 },
  { city: 'Milan', country: 'Italie', latitude: 45.4642, longitude: 9.1900 },
  { city: 'Lisbonne', country: 'Portugal', latitude: 38.7223, longitude: -9.1393 },
  { city: 'Porto', country: 'Portugal', latitude: 41.1579, longitude: -8.6291 },
  { city: 'Bruxelles', country: 'Belgique', latitude: 50.8503, longitude: 4.3517 },
  { city: 'Genève', country: 'Suisse', latitude: 46.2044, longitude: 6.1432 },
  { city: 'Zurich', country: 'Suisse', latitude: 47.3769, longitude: 8.5417 },
  { city: 'Vienne', country: 'Autriche', latitude: 48.2082, longitude: 16.3738 },
  { city: 'Prague', country: 'Tchéquie', latitude: 50.0755, longitude: 14.4378 },
  { city: 'Athènes', country: 'Grèce', latitude: 37.9838, longitude: 23.7275 },
  { city: 'Mykonos', country: 'Grèce', latitude: 37.4467, longitude: 25.3289 },
  // Monde
  { city: 'New York', country: 'États-Unis', latitude: 40.7128, longitude: -74.0060 },
  { city: 'Los Angeles', country: 'États-Unis', latitude: 34.0522, longitude: -118.2437 },
  { city: 'Miami', country: 'États-Unis', latitude: 25.7617, longitude: -80.1918 },
  { city: 'Las Vegas', country: 'États-Unis', latitude: 36.1699, longitude: -115.1398 },
  { city: 'Montréal', country: 'Canada', latitude: 45.5017, longitude: -73.5673 },
  { city: 'Dubai', country: 'Émirats arabes unis', latitude: 25.2048, longitude: 55.2708 },
  { city: 'Tokyo', country: 'Japon', latitude: 35.6762, longitude: 139.6503 },
  { city: 'Sydney', country: 'Australie', latitude: -33.8688, longitude: 151.2093 },
  { city: 'Bali', country: 'Indonésie', latitude: -8.3405, longitude: 115.0920 },
  { city: 'Bangkok', country: 'Thaïlande', latitude: 13.7563, longitude: 100.5018 },
  { city: 'Singapour', country: 'Singapour', latitude: 1.3521, longitude: 103.8198 },
  { city: 'Marrakech', country: 'Maroc', latitude: 31.6295, longitude: -7.9811 },
  { city: 'Le Caire', country: 'Égypte', latitude: 30.0444, longitude: 31.2357 },
  { city: 'Rio de Janeiro', country: 'Brésil', latitude: -22.9068, longitude: -43.1729 },
  { city: 'Mexico', country: 'Mexique', latitude: 19.4326, longitude: -99.1332 },
  { city: 'Cancún', country: 'Mexique', latitude: 21.1619, longitude: -86.8515 },
];
