import { supabase } from '../client';

/**
 * Récupérer les invitations reçues (personnes qui vous ont liké)
 */
export async function getReceivedLikes(userId: string): Promise<{ likes: Array<{
  id: string;
  fromUserId: string;
  type: string;
  createdAt: string;
  profile: Record<string, unknown> | null;
}>; error: string | null }> {
  try {
    // Récupérer les invitations en attente reçues
    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('id, sender_id, type, created_at')
      .eq('receiver_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      return { likes: [], error: error.message };
    }

    if (!invitations || invitations.length === 0) {
      return { likes: [], error: null };
    }

    // Récupérer les profils des utilisateurs
    const senderIds = invitations.map((inv) => inv.sender_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', senderIds);

    const profilesMap = new Map((profiles || []).map((p) => [p.id, p]));

    const result = invitations.map((invitation) => {
      const profileData = profilesMap.get(invitation.sender_id);

      return {
        id: invitation.id,
        fromUserId: invitation.sender_id,
        type: invitation.type,
        createdAt: invitation.created_at,
        profile: profileData ? {
          id: profileData.id,
          displayName: profileData.display_name,
          birthDate: profileData.birth_date,
          age: profileData.age,
          gender: profileData.gender,
          hairColor: profileData.hair_color,
          bio: profileData.bio,
          intention: profileData.intention,
          availability: profileData.availability,
          languages: profileData.languages || [],
          interests: profileData.interests || [],
          photos: profileData.photos || [],
          locationEnabled: profileData.location_enabled,
          latitude: profileData.latitude,
          longitude: profileData.longitude,
          locationUpdatedAt: profileData.location_updated_at,
          searchRadius: profileData.search_radius,
          minAgeFilter: profileData.min_age_filter,
          maxAgeFilter: profileData.max_age_filter,
          genderFilter: profileData.gender_filter || [],
          createdAt: profileData.created_at,
          updatedAt: profileData.updated_at,
        } : null,
      };
    }).filter((l) => l.profile !== null);

    return { likes: result, error: null };
  } catch (err) {
    return { likes: [], error: 'Une erreur inattendue est survenue' };
  }
}
