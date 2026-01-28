import { supabase } from './client';
import type { Profile, ProfileFilters, ProfileWithDistance } from '../../types/profile';
import type { IntentionId } from '../../constants/intentions';
import type { AvailabilityId } from '../../constants/availability';
import type { GenderId } from '../../constants/genders';
import type { HairColorId } from '../../constants/hairColors';
import type { LanguageId } from '../../constants/languages';
import { DEFAULT_SEARCH_RADIUS } from '../../constants';

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
  searchRadius?: number;
  minAgeFilter?: number;
  maxAgeFilter?: number;
  genderFilter?: GenderId[];
  // Préférences de notification
  notificationInvitations?: boolean;
  notificationMessages?: boolean;
  notificationSound?: boolean;
}

export const profilesService = {
  /**
   * Créer ou mettre à jour un profil (upsert)
   * Utilise upsert pour gérer le cas où le profil existe déjà
   */
  async createProfile(userId: string, data: CreateProfileData): Promise<{ profile: Profile | null; error: string | null }> {
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
        console.error('[profilesService.createProfile] Error:', error);
        return { profile: null, error: error.message };
      }

      return { profile: mapProfileFromDb(profile), error: null };
    } catch (err) {
      console.error('[profilesService.createProfile] Unexpected error:', err);
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
   * Triés par score composite (engagement + proximité)
   */
  async getDiscoverProfiles(
    userId: string,
    filters: ProfileFilters,
    userLat?: number,
    userLng?: number
  ): Promise<{ profiles: ProfileWithDistance[]; error: string | null }> {
    try {
      // Récupérer le score d'engagement de l'utilisateur courant
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('engagement_score')
        .eq('id', userId)
        .single();

      const userEngagementScore = (currentUserProfile?.engagement_score as number) || 50;

      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', userId);

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

      // Exclure les utilisateurs avec invitation déjà envoyée
      const { data: invitations } = await supabase
        .from('invitations')
        .select('receiver_id')
        .eq('sender_id', userId);

      if (invitations && invitations.length > 0) {
        const invitedIds = invitations.map((i) => i.receiver_id);
        query = query.not('id', 'in', `(${invitedIds.join(',')})`);
      }

      // Trier par score d'engagement (les profils "populaires" en premier)
      // puis limiter à 100 pour le calcul côté client
      const { data: profiles, error } = await query
        .order('engagement_score', { ascending: false })
        .limit(100);

      if (error) {
        return { profiles: [], error: error.message };
      }

      // Calculer les distances et scores composites
      let result: ProfileWithDistance[] = (profiles || []).map((p) => {
        const profile = mapProfileFromDb(p);
        let distance: number | null = null;

        if (userLat && userLng && profile.latitude && profile.longitude && profile.locationEnabled) {
          distance = calculateDistance(userLat, userLng, profile.latitude, profile.longitude);
        }

        return { ...profile, distance };
      });

      // Filtrer par âge (calculé côté client)
      result = result.filter((p) => p.age >= filters.minAge && p.age <= filters.maxAge);

      // Filtrer par rayon si l'utilisateur a une position
      if (userLat && userLng) {
        result = result.filter((p) => {
          if (p.distance === null) return true; // Inclure ceux sans position
          return p.distance <= filters.searchRadius;
        });
      }

      // Trier par score composite (engagement + proximité)
      result.sort((a, b) => {
        const scoreA = calculateCompositeScore(a, userEngagementScore, filters.searchRadius);
        const scoreB = calculateCompositeScore(b, userEngagementScore, filters.searchRadius);
        return scoreB - scoreA; // Plus haut score en premier
      });

      return { profiles: result, error: null };
    } catch (err) {
      return { profiles: [], error: 'Une erreur inattendue est survenue' };
    }
  },

  /**
   * Mettre à jour le dernier moment d'activité
   */
  async updateLastActive(userId: string): Promise<void> {
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', userId);
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
 * Calculer l'âge à partir de la date de naissance
 */
function calculateAge(birthDate: string): number {
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
function mapProfileFromDb(data: Record<string, unknown>): Profile {
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
 * Calculer le score composite pour le tri des profils
 * Combine engagement (60%) et proximité (40%)
 *
 * Le système favorise les profils de même "niveau" d'engagement
 * pour un matching plus équilibré
 */
function calculateCompositeScore(
  profile: ProfileWithDistance,
  userEngagementScore: number,
  maxDistance: number
): number {
  const profileEngagement = profile.engagementScore || 50;

  // Score d'engagement (0-100)
  // Bonus si le profil est dans la même "tranche" de score que l'utilisateur
  // Cela favorise le matching entre profils de popularité similaire
  const engagementDiff = Math.abs(profileEngagement - userEngagementScore);
  const similarityBonus = Math.max(0, 20 - engagementDiff); // Bonus jusqu'à 20 points si même niveau

  // Score normalisé d'engagement avec bonus de similarité
  const engagementScore = Math.min(100, profileEngagement + similarityBonus);

  // Score de proximité (0-100)
  let proximityScore = 50; // Score par défaut si pas de distance
  if (profile.distance !== null) {
    // Plus la distance est faible, plus le score est élevé
    // À 0 km = 100, à maxDistance = 0
    proximityScore = Math.max(0, 100 - (profile.distance / maxDistance) * 100);
  }

  // Score composite: 60% engagement + 40% proximité
  const compositeScore = engagementScore * 0.6 + proximityScore * 0.4;

  // Bonus pour les nouveaux utilisateurs (déjà inclus dans engagement_score via SQL)
  // mais on peut ajouter un petit bonus supplémentaire côté client
  if (profile.isNewUser) {
    return Math.min(100, compositeScore * 1.1);
  }

  return compositeScore;
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
