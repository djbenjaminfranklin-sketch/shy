import type { Profile } from '../../../types/profile';
import type { IntentionId } from '../../../constants/intentions';
import type { AvailabilityId } from '../../../constants/availability';
import type { GenderId } from '../../../constants/genders';
import type { HairColorId } from '../../../constants/hairColors';
import type { LanguageId } from '../../../constants/languages';
import type { DrinkingId, SmokingId, ChildrenId, ProfilePromptAnswer } from '../../../constants/lifestyle';
import { DEFAULT_SEARCH_RADIUS } from '../../../constants';

/**
 * Calculer l'age a partir de la date de naissance
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Mapper les données de la DB vers le type Profile
 */
export function mapProfileFromDb(data: Record<string, unknown>): Profile {
  const birthDate = data.birth_date as string;
  return {
    id: data.id as string,
    displayName: data.display_name as string,
    birthDate: birthDate,
    age: calculateAge(birthDate),
    gender: data.gender as GenderId,
    hairColor: data.hair_color as HairColorId | null,
    bio: data.bio as string | null,
    intention: data.intention as IntentionId,
    availability: data.availability as AvailabilityId | null,
    languages: (data.languages as LanguageId[]) || [],
    interests: (data.interests as string[]) || [],
    photos: (data.photos as string[]) || [],
    videoUrl: (data.video_url as string) || null,
    height: (data.height as number) || null,
    drinking: (data.drinking as DrinkingId) || null,
    smoking: (data.smoking as SmokingId) || null,
    children: (data.children as ChildrenId) || null,
    prompts: (data.prompts as ProfilePromptAnswer[]) || [],
    locationEnabled: data.location_enabled as boolean,
    latitude: data.latitude as number | null,
    longitude: data.longitude as number | null,
    locationUpdatedAt: data.location_updated_at as string | null,
    searchRadius: (data.search_radius as number) || DEFAULT_SEARCH_RADIUS,
    minAgeFilter: (data.min_age_filter as number) || 18,
    maxAgeFilter: (data.max_age_filter as number) || 99,
    genderFilter: (data.gender_filter as GenderId[]) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
    // Champs d'engagement (internes, non affichés aux utilisateurs)
    engagementScore: (data.engagement_score as number) || 50,
    isNewUser: (data.is_new_user as boolean) || false,
    lastActiveAt: data.last_active_at as string | null,
    // Préférences de notification
    notificationInvitations: data.notification_invitations as boolean ?? true,
    notificationMessages: data.notification_messages as boolean ?? true,
    notificationSound: data.notification_sound as boolean ?? true,
    // Push token
    pushToken: data.push_token as string | null,
  };
}

/**
 * Calculer la distance entre deux points (formule de Haversine)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
