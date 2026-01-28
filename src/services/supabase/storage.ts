import { supabase } from './client';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

const BUCKET_NAME = 'profile-photos';
const MAX_WIDTH = 1080;
const MAX_HEIGHT = 1080;
const QUALITY = 0.8;

export const storageService = {
  /**
   * Upload une image de profil
   */
  async uploadProfilePhoto(
    userId: string,
    uri: string,
    index: number
  ): Promise<{ url: string | null; error: string | null }> {
    try {
      // Compresser et redimensionner l'image
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_WIDTH, height: MAX_HEIGHT } }],
        { compress: QUALITY, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Lire le fichier comme base64
      const base64 = await FileSystem.readAsStringAsync(manipulated.uri, {
        encoding: 'base64',
      });

      // Convertir en ArrayBuffer
      const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

      // Générer un nom de fichier unique
      const fileName = `${userId}/${Date.now()}_${index}.jpg`;

      // Upload vers Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, byteArray, {
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
      console.error('Error uploading photo:', err);
      return { url: null, error: 'Erreur lors de l\'upload de la photo' };
    }
  },

  /**
   * Supprimer une photo de profil
   */
  async deleteProfilePhoto(
    userId: string,
    photoUrl: string
  ): Promise<{ error: string | null }> {
    try {
      // Extraire le nom du fichier de l'URL
      const urlParts = photoUrl.split('/');
      const fileName = `${userId}/${urlParts[urlParts.length - 1]}`;

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err) {
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
      // Identifier les photos à supprimer (celles qui ne sont pas dans les nouvelles)
      const photosToDelete = oldUrls.filter((url) => {
        // Si c'est une URL Supabase et pas dans les nouvelles URIs
        return url.includes(BUCKET_NAME) && !newUris.includes(url);
      });

      // Supprimer les anciennes photos
      for (const url of photosToDelete) {
        await this.deleteProfilePhoto(userId, url);
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
          const { url, error } = await this.uploadProfilePhoto(userId, uri, index);
          if (url) {
            urls.push(url);
          } else if (error) {
            console.error('Error uploading photo:', error);
          }
        }
        index++;
      }

      return { urls, error: null };
    } catch (err) {
      return { urls: [], error: 'Erreur lors de la mise à jour des photos' };
    }
  },
};

export default storageService;
