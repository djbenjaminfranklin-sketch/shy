import { supabase } from './client';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const BUCKET_NAME = 'profile-photos';
const VERIFICATION_BUCKET = 'verification-photos';
const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1080;
const QUALITY = 0.8;

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
        const { data: fallbackData, error: fallbackError } = await supabase.storage
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
