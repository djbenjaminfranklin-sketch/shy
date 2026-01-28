import { IntentionId } from '../constants/intentions';
import { AvailabilityId } from '../constants/availability';
import { HairColorId } from '../constants/hairColors';
import { GenderId } from '../constants/genders';
import { LanguageId } from '../constants/languages';
import { SearchRadius } from '../constants';

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
  searchRadius: SearchRadius;
  minAgeFilter: number;
  maxAgeFilter: number;
  genderFilter: GenderId[];

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
  searchRadius: SearchRadius;
  minAge: number;
  maxAge: number;
  genders: GenderId[];
  intentions: IntentionId[];
  hairColors: HairColorId[];
  languages: LanguageId[];
  interests: string[];
}
