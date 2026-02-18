/**
 * Calculer l'âge à partir de la date de naissance
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
 * Transforme les donnees brutes du profil Supabase en format Profile
 */
export function mapProfileData(profileData: Record<string, unknown>) {
  const birthDate = profileData.birth_date as string;
  return {
    id: profileData.id as string,
    displayName: profileData.display_name as string,
    birthDate: birthDate,
    age: calculateAge(birthDate),
    gender: profileData.gender as string,
    hairColor: profileData.hair_color as string | null,
    bio: profileData.bio as string | null,
    intention: profileData.intention as string,
    availability: profileData.availability as string | null,
    languages: (profileData.languages as string[]) || [],
    interests: (profileData.interests as string[]) || [],
    photos: (profileData.photos as string[]) || [],
    locationEnabled: profileData.location_enabled as boolean,
    latitude: profileData.latitude as number | null,
    longitude: profileData.longitude as number | null,
    locationUpdatedAt: profileData.location_updated_at as string | null,
    searchRadius: profileData.search_radius as number,
    minAgeFilter: profileData.min_age_filter as number,
    maxAgeFilter: profileData.max_age_filter as number,
    genderFilter: (profileData.gender_filter as string[]) || [],
    createdAt: profileData.created_at as string,
    updatedAt: profileData.updated_at as string,
  };
}
