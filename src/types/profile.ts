import { IntentionId } from '../constants/intentions';
import { AvailabilityId } from '../constants/availability';
import { HairColorId } from '../constants/hairColors';
import { GenderId } from '../constants/genders';
import { LanguageId } from '../constants/languages';

export interface Profile {
  id: string;
  displayName: string;
  birthDate: string;
  age: number;
  gender: GenderId;
  hairColor: HairColorId | null;
  bio: string | null;
  intention: IntentionId;
  availability: AvailabilityId | null;
  languages: LanguageId[];
  interests: string[];
  photos: string[];

  // Géolocalisation
  locationEnabled: boolean;
  latitude: number | null;
  longitude: number | null;
  locationUpdatedAt: string | null;

  // Filtres
  searchRadius: number;
  minAgeFilter: number;
  maxAgeFilter: number;
  genderFilter: GenderId[];

  // Score d'engagement (interne, non affiché aux utilisateurs)
  engagementScore?: number;
  isNewUser?: boolean;
  lastActiveAt?: string | null;

  // Préférences de notification
  notificationInvitations?: boolean;
  notificationMessages?: boolean;
  notificationSound?: boolean;

  // Push token pour les notifications Expo
  pushToken?: string | null;

  // Métadonnées
  createdAt: string;
  updatedAt: string;
}

export interface ProfilePhoto {
  id: string;
  userId: string;
  url: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProfileWithDistance extends Profile {
  distance: number | null;
}

export interface ProfileFilters {
  searchRadius: number;
  minAge: number;
  maxAge: number;
  genders: GenderId[];
  intentions: IntentionId[];
  hairColors: HairColorId[];
  languages: LanguageId[];
  interests: string[];
}
