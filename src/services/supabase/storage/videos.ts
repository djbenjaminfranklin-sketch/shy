import { supabase } from '../client';
import { BUCKET_NAME } from './helpers';

/**
 * Upload une vidéo de profil - utilise fetch avec blob
 */
export async function uploadProfileVideo(
  userId: string,
  uri: string
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Générer un nom de fichier unique dans le sous-dossier videos
    const fileName = `${userId}/videos/${Date.now()}_profile.mp4`;

    // Récupérer l'URL et le token Supabase
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;

    if (!supabaseUrl) {
      return { url: null, error: 'Configuration Supabase manquante' };
    }

    if (!accessToken) {
      return { url: null, error: 'Non authentifié' };
    }

    // Convertir l'URI en blob via fetch
    const videoResponse = await fetch(uri);
    const videoBlob = await videoResponse.blob();

    // Vérifier la taille (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (videoBlob.size > maxSize) {
      return { url: null, error: `Vidéo trop volumineuse (${Math.round(videoBlob.size / 1024 / 1024)}MB). Maximum: 50MB` };
    }

    // Upload direct via fetch
    const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${fileName}`;

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'video/mp4',
        'x-upsert': 'true',
      },
      body: videoBlob,
    });

    if (!uploadResponse.ok) {
      const responseText = await uploadResponse.text();
      return { url: null, error: `Erreur ${uploadResponse.status}: ${responseText}` };
    }

    // Construire l'URL publique
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;

    return { url: publicUrl, error: null };
  } catch (err) {
    return { url: null, error: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` };
  }
}
