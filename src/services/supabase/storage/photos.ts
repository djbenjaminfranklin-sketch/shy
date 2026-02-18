import { supabase } from '../client';
import * as ImageManipulator from 'expo-image-manipulator';
import { decode } from 'base64-arraybuffer';
import { BUCKET_NAME, VERIFICATION_BUCKET, MAX_WIDTH, MAX_HEIGHT, QUALITY, validateAndModerateImage } from './helpers';

/**
 * Upload une image de profil - utilise base64 pour éviter les fichiers corrompus
 */
export async function uploadProfilePhoto(
  userId: string,
  uri: string,
  index: number
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Compresser et redimensionner l'image
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: MAX_WIDTH, height: MAX_HEIGHT } }],
      { compress: QUALITY, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    if (!manipulated.base64) {
      return { url: null, error: 'Erreur: impossible de convertir l\'image en base64' };
    }

    // Valider et modérer l'image avant upload
    const validation = await validateAndModerateImage(manipulated.base64);
    if (!validation.valid) {
      return { url: null, error: validation.error || 'Image non autorisée' };
    }

    // Générer un nom de fichier unique
    const fileName = `${userId}/${Date.now()}_${index}.jpg`;

    // Convertir base64 en ArrayBuffer
    const arrayBuffer = decode(manipulated.base64);

    // Upload vers Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
      return { url: null, error: uploadError.message };
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` };
  }
}

/**
 * Upload une photo de vérification faciale
 */
export async function uploadVerificationPhoto(
  userId: string,
  uri: string,
  index: number
): Promise<{ url: string | null; error: string | null }> {
  try {
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
    const { error: uploadError } = await supabase.storage
      .from(VERIFICATION_BUCKET)
      .upload(fileName, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (uploadError) {
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

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(VERIFICATION_BUCKET)
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl, error: null };
  } catch (err) {
    return { url: null, error: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` };
  }
}

/**
 * Supprimer une photo de profil
 */
export async function deleteProfilePhoto(
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

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (err) {
    return { error: 'Erreur lors de la suppression de la photo' };
  }
}

/**
 * Upload multiple photos et retourne les URLs
 */
export async function uploadMultiplePhotos(
  userId: string,
  uris: string[]
): Promise<{ urls: string[]; errors: string[] }> {
  const urls: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < uris.length; i++) {
    const { url, error } = await uploadProfilePhoto(userId, uris[i], i);
    if (url) {
      urls.push(url);
    }
    if (error) {
      errors.push(error);
    }
  }

  return { urls, errors };
}

/**
 * Remplacer les photos d'un utilisateur
 * Supprime les anciennes et upload les nouvelles
 */
export async function replaceUserPhotos(
  userId: string,
  oldUrls: string[],
  newUris: string[]
): Promise<{ urls: string[]; error: string | null }> {
  try {
    // Identifier les photos à supprimer (celles qui ne sont plus dans la liste)
    const photosToDelete = oldUrls.filter((url) => {
      return url.includes(BUCKET_NAME) && !newUris.includes(url);
    });

    // Supprimer les anciennes photos
    for (const url of photosToDelete) {
      await deleteProfilePhoto(userId, url);
    }

    // Upload les nouvelles photos (celles qui sont des URIs locales)
    const urls: string[] = [];
    let index = 0;

    for (const uri of newUris) {
      if (uri.startsWith('http')) {
        // C'est déjà une URL, la garder
        urls.push(uri);
      } else {
        // C'est une URI locale, l'uploader
        const { url, error } = await uploadProfilePhoto(userId, uri, index);
        if (url) {
          urls.push(url);
        } else if (error) {
          return { urls: [], error };
        }
      }
      index++;
    }

    return { urls, error: null };
  } catch (err) {
    return { urls: [], error: `Erreur: ${err instanceof Error ? err.message : 'Inconnue'}` };
  }
}
