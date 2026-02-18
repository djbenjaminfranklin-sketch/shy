import { supabase } from '../client';
import type { Profile } from '../../../types/profile';
import type { IntentionId } from '../../../constants/intentions';
import type { AvailabilityId } from '../../../constants/availability';
import type { GenderId } from '../../../constants/genders';
import type { HairColorId } from '../../../constants/hairColors';
import type { LanguageId } from '../../../constants/languages';
import type { DrinkingId, SmokingId, ChildrenId, ProfilePromptAnswer } from '../../../constants/lifestyle';
import { mapProfileFromDb } from './helpers';

export interface CreateProfileData {
  displayName: string;
  birthDate: string;
  gender: GenderId;
  hairColor?: HairColorId;
  bio?: string;
  intention: IntentionId;
  languages?: LanguageId[];
  interests?: string[];
  photos?: string[];
  videoUrl?: string | null;
  height?: number | null;
  drinking?: DrinkingId | null;
  smoking?: SmokingId | null;
  children?: ChildrenId | null;
  prompts?: ProfilePromptAnswer[];
  genderFilter?: GenderId[];
  locationEnabled?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  isVerified?: boolean;
}

export interface UpdateProfileData {
  displayName?: string;
  hairColor?: HairColorId | null;
  bio?: string | null;
  intention?: IntentionId;
  availability?: AvailabilityId | null;
  languages?: LanguageId[];
  interests?: string[];
  photos?: string[];
  videoUrl?: string | null;
  // Lifestyle
  height?: number | null;
  drinking?: DrinkingId | null;
  smoking?: SmokingId | null;
  children?: ChildrenId | null;
  prompts?: ProfilePromptAnswer[];
  // Localisation
  locationEnabled?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  searchRadius?: number;
  minAgeFilter?: number;
  maxAgeFilter?: number;
  genderFilter?: GenderId[];
  // Préférences de notification
  notificationInvitations?: boolean;
  notificationMessages?: boolean;
  notificationSound?: boolean;
}

/**
 * Créer ou mettre à jour un profil (upsert)
 * Utilise upsert pour gérer le cas où le profil existe déjà
 */
export async function createProfile(userId: string, data: CreateProfileData): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    // Vérifier que la session est active
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return { profile: null, error: 'Session non valide. Veuillez vous reconnecter.' };
    }

    // Vérifier que l'utilisateur de la session correspond
    if (sessionData.session.user.id !== userId) {
      return { profile: null, error: 'Utilisateur non autorisé' };
    }

    // VALIDATION AGE OBLIGATOIRE - Vérifier que l'utilisateur a au moins 18 ans
    const birthDate = new Date(data.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 18) {
      return { profile: null, error: 'Vous devez avoir au moins 18 ans pour utiliser cette application.' };
    }

    // Validation de date de naissance réaliste (pas dans le futur, pas trop ancien)
    if (birthDate > today) {
      return { profile: null, error: 'Date de naissance invalide.' };
    }
    if (age > 120) {
      return { profile: null, error: 'Date de naissance invalide.' };
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        display_name: data.displayName,
        birth_date: data.birthDate,
        gender: data.gender,
        hair_color: data.hairColor || null,
        bio: data.bio || null,
        intention: data.intention,
        languages: data.languages || [],
        interests: data.interests || [],
        photos: data.photos || [],
        video_url: data.videoUrl || null,
        height: data.height || null,
        drinking: data.drinking || null,
        smoking: data.smoking || null,
        children: data.children || null,
        prompts: data.prompts || [],
        gender_filter: data.genderFilter || [],
        location_enabled: data.locationEnabled || false,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        location_updated_at: data.locationEnabled ? new Date().toISOString() : null,
        is_verified: data.isVerified || false,
      }, {
        onConflict: 'id',
      })
      .select()
      .single();

    if (error) {
      return { profile: null, error: error.message };
    }

    return { profile: mapProfileFromDb(profile), error: null };
  } catch (err) {
    return { profile: null, error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Récupérer un profil par ID
 */
export async function getProfile(userId: string): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { profile: null, error: null }; // Profil non trouvé
      }
      return { profile: null, error: error.message };
    }

    return { profile: mapProfileFromDb(profile), error: null };
  } catch (err) {
    return { profile: null, error: 'Une erreur inattendue est survenue' };
  }
}

/**
 * Mettre à jour un profil
 */
export async function updateProfile(userId: string, data: UpdateProfileData): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    const updateData: Record<string, unknown> = {};

    if (data.displayName !== undefined) updateData.display_name = data.displayName;
    if (data.hairColor !== undefined) updateData.hair_color = data.hairColor;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.intention !== undefined) updateData.intention = data.intention;
    if (data.availability !== undefined) updateData.availability = data.availability;
    if (data.languages !== undefined) updateData.languages = data.languages;
    if (data.interests !== undefined) updateData.interests = data.interests;
    if (data.photos !== undefined) updateData.photos = data.photos;
    if (data.videoUrl !== undefined) updateData.video_url = data.videoUrl;
    // Lifestyle
    if (data.height !== undefined) updateData.height = data.height;
    if (data.drinking !== undefined) updateData.drinking = data.drinking;
    if (data.smoking !== undefined) updateData.smoking = data.smoking;
    if (data.children !== undefined) updateData.children = data.children;
    if (data.prompts !== undefined) updateData.prompts = data.prompts;
    if (data.locationEnabled !== undefined) updateData.location_enabled = data.locationEnabled;
    if (data.latitude !== undefined) updateData.latitude = data.latitude;
    if (data.longitude !== undefined) updateData.longitude = data.longitude;
    if (data.searchRadius !== undefined) updateData.search_radius = data.searchRadius;
    if (data.minAgeFilter !== undefined) updateData.min_age_filter = data.minAgeFilter;
    if (data.maxAgeFilter !== undefined) updateData.max_age_filter = data.maxAgeFilter;
    if (data.genderFilter !== undefined) updateData.gender_filter = data.genderFilter;
    // Préférences de notification
    if (data.notificationInvitations !== undefined) updateData.notification_invitations = data.notificationInvitations;
    if (data.notificationMessages !== undefined) updateData.notification_messages = data.notificationMessages;
    if (data.notificationSound !== undefined) updateData.notification_sound = data.notificationSound;

    updateData.updated_at = new Date().toISOString();

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return { profile: null, error: error.message };
    }

    return { profile: mapProfileFromDb(profile), error: null };
  } catch (err) {
    return { profile: null, error: 'Une erreur inattendue est survenue' };
  }
}

