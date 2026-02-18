import { supabase } from '../client';

/**
 * Mettre à jour la position
 */
export async function updateLocation(userId: string, latitude: number, longitude: number): Promise<{ error: string | null }> {
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
}

/**
 * Masquer la position
 */
export async function hideLocation(userId: string): Promise<{ error: string | null }> {
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
}

/**
 * Mettre à jour le dernier moment d'activité
 */
export async function updateLastActive(userId: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ last_active_at: new Date().toISOString() })
    .eq('id', userId);
}

/**
 * Supprimer le profil (GDPR)
 */
export async function deleteProfile(userId: string): Promise<{ error: string | null }> {
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
}
