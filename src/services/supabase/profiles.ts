import { supabase } from './client';
import type { Profile, ProfileFilters, ProfileWithDistance } from '../../types/profile';
import type { IntentionId } from '../../constants/intentions';
import type { AvailabilityId } from '../../constants/availability';
import type { GenderId } from '../../constants/genders';
import type { HairColorId } from '../../constants/hairColors';
import type { LanguageId } from '../../constants/languages';
import { SearchRadius } from '../../constants';

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
  locationEnabled?: boolean;
  latitude?: number | null;
  longitude?: number | null;
  searchRadius?: SearchRadius;
  minAgeFilter?: number;
  maxAgeFilter?: number;
  genderFilter?: GenderId[];
}

export const profilesService = {
  /**
   * Créer un nouveau profil
   */
  async createProfile(userId: string, data: CreateProfileData): Promise<{ profile: Profile | null; error: string | null }> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
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
          location_enabled: data.locationEnabled || false,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          location_updated_at: data.locationEnabled ? new Date().toISOString() : null,
          is_verified: data.isVerified || false,
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
  },

  /**
   * Récupérer un profil par ID
   */
  async getProfile(userId: string): Promise<{ profile: Profile | null; error: string | null }> {
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
  },

  /**
   * Mettre à jour un profil
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<{ profile: Profile | null; error: string | null }> {
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
      if (data.locationEnabled !== undefined) updateData.location_enabled = data.locationEnabled;
      if (data.latitude !== undefined) updateData.latitude = data.latitude;
      if (data.longitude !== undefined) updateData.longitude = data.longitude;
      if (data.searchRadius !== undefined) updateData.search_radius = data.searchRadius;
      if (data.minAgeFilter !== undefined) updateData.min_age_filter = data.minAgeFilter;
      if (data.maxAgeFilter !== undefined) updateData.max_age_filter = data.maxAgeFilter;
      if (data.genderFilter !== undefined) updateData.gender_filter = data.genderFilter;

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
  },

  /**
   * Mettre à jour la position
   */
  async updateLocation(userId: string, latitude: number, longitude: number): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          latitude,
          longitude,
          location_enabled: true,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Masquer la position
   */
  async hideLocation(userId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          location_enabled: false,
        })
        .eq('id', userId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Récupérer les profils à découvrir
   */
  async getDiscoverProfiles(
    userId: string,
    filters: ProfileFilters,
    userLat?: number,
    userLng?: number
  ): Promise<{ profiles: ProfileWithDistance[]; error: string | null }> {
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .gte('age', filters.minAge)
        .lte('age', filters.maxAge);

      // Filtrer par genre
      if (filters.genders.length > 0) {
        query = query.in('gender', filters.genders);
      }

      // Filtrer par intention
      if (filters.intentions.length > 0) {
        query = query.in('intention', filters.intentions);
      }

      // Exclure les utilisateurs bloqués
      const { data: blocks } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', userId);

      if (blocks && blocks.length > 0) {
        const blockedIds = blocks.map((b) => b.blocked_id);
        query = query.not('id', 'in', `(${blockedIds.join(',')})`);
      }

      // Exclure les utilisateurs déjà likés/passés
      const { data: likes } = await supabase
        .from('likes')
        .select('to_user_id')
        .eq('from_user_id', userId);

      if (likes && likes.length > 0) {
        const likedIds = likes.map((l) => l.to_user_id);
        query = query.not('id', 'in', `(${likedIds.join(',')})`);
      }

      const { data: profiles, error } = await query.limit(50);

      if (error) {
        return { profiles: [], error: error.message };
      }

      // Calculer les distances et filtrer par rayon
      let result: ProfileWithDistance[] = (profiles || []).map((p) => {
        const profile = mapProfileFromDb(p);
        let distance: number | null = null;

        if (userLat && userLng && profile.latitude && profile.longitude && profile.locationEnabled) {
          distance = calculateDistance(userLat, userLng, profile.latitude, profile.longitude);
        }

        return { ...profile, distance };
      });

      // Filtrer par rayon si l'utilisateur a une position
      if (userLat && userLng) {
        result = result.filter((p) => {
          if (p.distance === null) return true; // Inclure ceux sans position
          return p.distance <= filters.searchRadius;
        });
      }

      // Trier par distance (les plus proches en premier)
      result.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      return { profiles: result, error: null };
    } catch (err) {
      return { profiles: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Supprimer le profil (GDPR)
   */
  async deleteProfile(userId: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      return { error: 'Une erreur inattendue est survenue' };
    }
  },
};

/**
 * Mapper les données de la DB vers le type Profile
 */
function mapProfileFromDb(data: Record<string, unknown>): Profile {
  return {
    id: data.id as string,
    displayName: data.display_name as string,
    birthDate: data.birth_date as string,
    age: data.age as number,
    gender: data.gender as GenderId,
    hairColor: data.hair_color as HairColorId | null,
    bio: data.bio as string | null,
    intention: data.intention as IntentionId,
    availability: data.availability as AvailabilityId | null,
    languages: (data.languages as LanguageId[]) || [],
    interests: (data.interests as string[]) || [],
    photos: (data.photos as string[]) || [],
    locationEnabled: data.location_enabled as boolean,
    latitude: data.latitude as number | null,
    longitude: data.longitude as number | null,
    locationUpdatedAt: data.location_updated_at as string | null,
    searchRadius: (data.search_radius as SearchRadius) || 25,
    minAgeFilter: (data.min_age_filter as number) || 18,
    maxAgeFilter: (data.max_age_filter as number) || 99,
    genderFilter: (data.gender_filter as GenderId[]) || [],
    createdAt: data.created_at as string,
    updatedAt: data.updated_at as string,
  };
}

/**
 * Calculer la distance entre deux points (formule de Haversine)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export default profilesService;
