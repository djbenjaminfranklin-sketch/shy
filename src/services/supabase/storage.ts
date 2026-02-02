import { supabase } from './client';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';

const BUCKET_NAME = 'profile-photos';
const VERIFICATION_BUCKET = 'verification-photos';
const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1080;
const QUALITY = 0.8;

// Moderation status types
export type ModerationStatus = 'pending' | 'approved' | 'rejected';

export interface ModerationResult {
  status: ModerationStatus;
  reason?: string;
  isNsfw?: boolean;
  confidence?: number;
}

// Likelihood levels from Google Cloud Vision SafeSearch
type SafeSearchLikelihood = 'UNKNOWN' | 'VERY_UNLIKELY' | 'UNLIKELY' | 'POSSIBLE' | 'LIKELY' | 'VERY_LIKELY';

interface SafeSearchAnnotation {
  adult: SafeSearchLikelihood;
  spoof: SafeSearchLikelihood;
  medical: SafeSearchLikelihood;
  violence: SafeSearchLikelihood;
  racy: SafeSearchLikelihood;
}

interface VisionApiResponse {
  responses: Array<{
    safeSearchAnnotation?: SafeSearchAnnotation;
    error?: { code: number; message: string };
  }>;
}

/**
 * Check image for inappropriate content using Google Cloud Vision SafeSearch API
 * https://cloud.google.com/vision/docs/detecting-safe-search
 */
async function moderateImage(base64Image: string): Promise<ModerationResult> {
  const visionApiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;

  // Si pas de clé API configurée, approuver par défaut (mode dev)
  if (!visionApiKey || visionApiKey === 'your_google_vision_api_key') {
    console.log('[Moderation] No Vision API key configured - skipping moderation (dev mode)');
    return {
      status: 'approved',
      isNsfw: false,
    };
  }

  try {
    console.log('[Moderation] Checking image with Google Cloud Vision SafeSearch...');

    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: base64Image },
            features: [{ type: 'SAFE_SEARCH_DETECTION' }],
          }],
        }),
      }
    );

    if (!response.ok) {
      console.error('[Moderation] Vision API HTTP error:', response.status);
      // En cas d'erreur API, on approuve pour ne pas bloquer l'utilisateur
      // mais on log pour review
      return { status: 'approved', isNsfw: false };
    }

    const data: VisionApiResponse = await response.json();

    // Vérifier si l'API a retourné une erreur
    if (data.responses[0]?.error) {
      console.error('[Moderation] Vision API error:', data.responses[0].error);
      return { status: 'approved', isNsfw: false };
    }

    const safeSearch = data.responses[0]?.safeSearchAnnotation;

    if (!safeSearch) {
      console.log('[Moderation] No SafeSearch annotation returned');
      return { status: 'approved', isNsfw: false };
    }

    console.log('[Moderation] SafeSearch results:', {
      adult: safeSearch.adult,
      violence: safeSearch.violence,
      racy: safeSearch.racy,
    });

    // Niveaux problématiques: LIKELY ou VERY_LIKELY
    const problematicLevels: SafeSearchLikelihood[] = ['LIKELY', 'VERY_LIKELY'];

    // Rejeter si contenu adulte ou violent
    if (problematicLevels.includes(safeSearch.adult)) {
      console.log('[Moderation] Image rejected: adult content detected');
      return {
        status: 'rejected',
        reason: 'Cette image contient du contenu pour adultes non autorisé.',
        isNsfw: true,
        confidence: safeSearch.adult === 'VERY_LIKELY' ? 0.95 : 0.75,
      };
    }

    if (problematicLevels.includes(safeSearch.violence)) {
      console.log('[Moderation] Image rejected: violent content detected');
      return {
        status: 'rejected',
        reason: 'Cette image contient du contenu violent non autorisé.',
        isNsfw: true,
        confidence: safeSearch.violence === 'VERY_LIKELY' ? 0.95 : 0.75,
      };
    }

    // Pour le contenu "racy" (suggestif), on est moins strict
    // On rejette seulement si VERY_LIKELY
    if (safeSearch.racy === 'VERY_LIKELY') {
      console.log('[Moderation] Image rejected: highly suggestive content detected');
      return {
        status: 'rejected',
        reason: 'Cette image est trop suggestive pour SHY.',
        isNsfw: true,
        confidence: 0.9,
      };
    }

    console.log('[Moderation] Image approved');
    return {
      status: 'approved',
      isNsfw: false,
    };

  } catch (error) {
    console.error('[Moderation] Error calling Vision API:', error);
    // En cas d'erreur, on approuve pour ne pas bloquer l'utilisateur
    return { status: 'approved', isNsfw: false };
  }
}

/**
 * Validate and moderate image before upload
 */
async function validateAndModerateImage(
  base64Image: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    // Basic validation: check if it's a valid base64 string
    if (!base64Image || base64Image.length === 0) {
      return { valid: false, error: 'Image invalide' };
    }

    // Check image size (max 10MB base64)
    if (base64Image.length > 10 * 1024 * 1024 * 1.37) {
      return { valid: false, error: 'Image trop volumineuse (max 10MB)' };
    }

    // Moderate image content
    const moderationResult = await moderateImage(base64Image);

    if (moderationResult.status === 'rejected') {
      return {
        valid: false,
        error: moderationResult.reason || 'Cette image n\'est pas autorisée sur SHY.',
      };
    }

    return { valid: true };
  } catch (error) {
    console.error('[Moderation] Error validating image:', error);
    // In case of error, allow the upload but log for review
    return { valid: true };
  }
}

export const storageService = {
  /**
   * Upload une image de profil - utilise base64 pour éviter les fichiers corrompus
   */
  async uploadProfilePhoto(
    userId: string,
    uri: string,
    index: number
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      console.log('[Storage] Starting upload for:', uri);

      // Compresser et redimensionner l'image
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_WIDTH, height: MAX_HEIGHT } }],
        { compress: QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      console.log('[Storage] Image manipulated, base64 length:', manipulated.base64?.length);

      if (!manipulated.base64) {
        return { url: null, error: 'Erreur: impossible de convertir l\'image en base64' };
      }

      // Valider et modérer l'image avant upload
      const validation = await validateAndModerateImage(manipulated.base64);
      if (!validation.valid) {
        console.log('[Storage] Image rejected by moderation:', validation.error);
        return { url: null, error: validation.error || 'Image non autorisée' };
      }

      // Générer un nom de fichier unique
      const fileName = `${userId}/${Date.now()}_${index}.jpg`;

      // Convertir base64 en ArrayBuffer
      const arrayBuffer = decode(manipulated.base64);

      console.log('[Storage] ArrayBuffer created, size:', arrayBuffer.byteLength);

      // Upload vers Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('[Storage] Upload error:', uploadError);
        return { url: null, error: uploadError.message };
      }

      console.log('[Storage] Upload success:', data);

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log('[Storage] Public URL:', urlData.publicUrl);

      return { url: urlData.publicUrl, error: null };
    } catch (err) {
      console.error('[Storage] Error uploading photo:', err);
      return { url: null, error: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` };
    }
  },

  /**
   * Upload une vidéo de profil - utilise fetch avec blob
   */
  async uploadProfileVideo(
    userId: string,
    uri: string
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      console.log('[Storage] Starting video upload for:', uri);

      // Générer un nom de fichier unique dans le sous-dossier videos
      const fileName = `${userId}/videos/${Date.now()}_profile.mp4`;

      // Récupérer l'URL et le token Supabase
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      console.log('[Storage] Supabase URL:', supabaseUrl);
      console.log('[Storage] Has access token:', !!accessToken);

      if (!supabaseUrl) {
        return { url: null, error: 'Configuration Supabase manquante' };
      }

      if (!accessToken) {
        return { url: null, error: 'Non authentifié' };
      }

      // Convertir l'URI en blob via fetch
      console.log('[Storage] Fetching video file as blob...');
      const videoResponse = await fetch(uri);
      const videoBlob = await videoResponse.blob();
      console.log('[Storage] Video blob size:', videoBlob.size, 'type:', videoBlob.type);

      // Vérifier la taille (max 50MB)
      const maxSize = 50 * 1024 * 1024;
      if (videoBlob.size > maxSize) {
        return { url: null, error: `Vidéo trop volumineuse (${Math.round(videoBlob.size / 1024 / 1024)}MB). Maximum: 50MB` };
      }

      // Upload direct via fetch
      const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET_NAME}/${fileName}`;
      console.log('[Storage] Uploading video to:', uploadUrl);

      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'video/mp4',
          'x-upsert': 'true',
        },
        body: videoBlob,
      });

      const responseText = await uploadResponse.text();
      console.log('[Storage] Upload response:', uploadResponse.status, responseText);

      if (!uploadResponse.ok) {
        console.error('[Storage] Video upload failed:', uploadResponse.status, responseText);
        return { url: null, error: `Erreur ${uploadResponse.status}: ${responseText}` };
      }

      console.log('[Storage] Video upload success');

      // Construire l'URL publique
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${fileName}`;
      console.log('[Storage] Video public URL:', publicUrl);

      return { url: publicUrl, error: null };
    } catch (err) {
      console.error('[Storage] Error uploading video:', err);
      return { url: null, error: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` };
    }
  },

  /**
   * Upload une photo de vérification faciale
   */
  async uploadVerificationPhoto(
    userId: string,
    uri: string,
    index: number
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      console.log('[Storage] Uploading verification photo:', uri);

      // Compresser et redimensionner l'image
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_WIDTH, height: MAX_HEIGHT } }],
        { compress: QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      if (!manipulated.base64) {
        return { url: null, error: 'Erreur: impossible de convertir l\'image en base64' };
      }

      // Générer un nom de fichier unique avec timestamp pour éviter le cache
      const fileName = `${userId}/verification_${Date.now()}_${index}.jpg`;

      // Convertir base64 en ArrayBuffer
      const arrayBuffer = decode(manipulated.base64);

      // Upload vers Supabase Storage (dans le bucket de vérification)
      const { data, error: uploadError } = await supabase.storage
        .from(VERIFICATION_BUCKET)
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('[Storage] Verification photo upload error:', uploadError);
        // Fallback: essayer avec le bucket principal si le bucket de vérification n'existe pas
        const { error: fallbackError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(`verification/${fileName}`, arrayBuffer, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (fallbackError) {
          return { url: null, error: fallbackError.message };
        }

        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(`verification/${fileName}`);

        return { url: urlData.publicUrl, error: null };
      }

      console.log('[Storage] Verification photo uploaded:', data);

      // Récupérer l'URL publique
      const { data: urlData } = supabase.storage
        .from(VERIFICATION_BUCKET)
        .getPublicUrl(fileName);

      return { url: urlData.publicUrl, error: null };
    } catch (err) {
      console.error('[Storage] Error uploading verification photo:', err);
      return { url: null, error: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` };
    }
  },

  /**
   * Supprimer une photo de profil
   */
  async deleteProfilePhoto(
    _userId: string,
    photoUrl: string
  ): Promise<{ error: string | null }> {
    try {
      // Extraire le chemin du fichier de l'URL
      const url = new URL(photoUrl);
      const pathParts = url.pathname.split('/');
      // Le chemin est généralement: /storage/v1/object/public/profile-photos/userId/filename.jpg
      const bucketIndex = pathParts.indexOf(BUCKET_NAME);
      if (bucketIndex === -1) {
        return { error: 'URL invalide' };
      }
      const filePath = pathParts.slice(bucketIndex + 1).join('/');

      console.log('[Storage] Deleting:', filePath);

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('[Storage] Delete error:', error);
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
      console.error('[Storage] Error deleting photo:', err);
      return { error: 'Erreur lors de la suppression de la photo' };
    }
  },

  /**
   * Upload multiple photos et retourne les URLs
   */
  async uploadMultiplePhotos(
    userId: string,
    uris: string[]
  ): Promise<{ urls: string[]; errors: string[] }> {
    const urls: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < uris.length; i++) {
      const { url, error } = await this.uploadProfilePhoto(userId, uris[i], i);
      if (url) {
        urls.push(url);
      }
      if (error) {
        errors.push(error);
      }
    }

    return { urls, errors };
  },

  /**
   * Remplacer les photos d'un utilisateur
   * Supprime les anciennes et upload les nouvelles
   */
  async replaceUserPhotos(
    userId: string,
    oldUrls: string[],
    newUris: string[]
  ): Promise<{ urls: string[]; error: string | null }> {
    try {
      console.log('[Storage] Replacing photos. Old:', oldUrls.length, 'New:', newUris.length);

      // Identifier les photos à supprimer (celles qui ne sont plus dans la liste)
      const photosToDelete = oldUrls.filter((url) => {
        return url.includes(BUCKET_NAME) && !newUris.includes(url);
      });

      // Supprimer les anciennes photos
      for (const url of photosToDelete) {
        console.log('[Storage] Deleting old photo:', url);
        await this.deleteProfilePhoto(userId, url);
      }

      // Upload les nouvelles photos (celles qui sont des URIs locales)
      const urls: string[] = [];
      let index = 0;

      for (const uri of newUris) {
        if (uri.startsWith('http')) {
          // C'est déjà une URL, la garder
          urls.push(uri);
          console.log('[Storage] Keeping existing URL:', uri);
        } else {
          // C'est une URI locale, l'uploader
          console.log('[Storage] Uploading new photo:', uri);
          const { url, error } = await this.uploadProfilePhoto(userId, uri, index);
          if (url) {
            urls.push(url);
          } else if (error) {
            console.error('[Storage] Error uploading:', error);
            return { urls: [], error };
          }
        }
        index++;
      }

      console.log('[Storage] Final URLs:', urls);
      return { urls, error: null };
    } catch (err) {
      console.error('[Storage] Error replacing photos:', err);
      return { urls: [], error: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` };
    }
  },
};

export default storageService;
