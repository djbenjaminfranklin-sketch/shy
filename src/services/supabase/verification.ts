import { supabase } from './client';
import { storageService } from './storage';

export interface VerificationResult {
  verified: boolean;
  confidence: number;
  matchedPhotos: number;
  totalPhotos: number;
  error?: string;
}

export const verificationService = {
  /**
   * Upload verification photos and verify face against profile photo
   * @param userId - The user's ID
   * @param profilePhotoUrl - URL or local URI of the profile photo to compare against
   * @param verificationPhotoUris - Local URIs of captured verification photos
   * @returns Verification result
   */
  async verifyFace(
    userId: string,
    profilePhotoUrl: string,
    verificationPhotoUris: string[]
  ): Promise<VerificationResult> {
    try {
      // 1. Upload profile photo if it's a local URI (not already a remote URL)
      let profilePhotoPublicUrl = profilePhotoUrl;
      if (!profilePhotoUrl.startsWith('http')) {
        const { url, error } = await storageService.uploadVerificationPhoto(userId, profilePhotoUrl, 999);
        if (error || !url) {
          throw new Error('Erreur lors de l\'upload de la photo de profil');
        }
        profilePhotoPublicUrl = url;
      }

      // 2. Upload verification photos to storage
      const uploadedUrls: string[] = [];

      for (let i = 0; i < verificationPhotoUris.length; i++) {
        const uri = verificationPhotoUris[i];
        const { url, error } = await storageService.uploadVerificationPhoto(userId, uri, i);

        if (error || !url) {
          throw new Error(`Erreur lors de l'upload de la photo ${i + 1}`);
        }

        uploadedUrls.push(url);
      }

      // 3. Call the Edge Function for face comparison
      const { data, error } = await supabase.functions.invoke('verify-face', {
        body: {
          profilePhotoUrl: profilePhotoPublicUrl,
          verificationPhotoUrls: uploadedUrls,
          userId,
        },
      });

      if (error) {
        throw new Error('Erreur lors de la vérification faciale');
      }

      // 4. Clean up verification photos from storage (optional, for privacy)
      // We keep them for now in case of disputes/moderation

      return {
        verified: data.verified,
        confidence: data.confidence,
        matchedPhotos: data.matchedPhotos,
        totalPhotos: data.totalPhotos,
        error: data.error,
      };
    } catch (err) {
      return {
        verified: false,
        confidence: 0,
        matchedPhotos: 0,
        totalPhotos: 0,
        error: err instanceof Error ? err.message : 'Une erreur est survenue',
      };
    }
  },

  /**
   * Check if a user is verified
   */
  async isUserVerified(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('id', userId)
        .single();

      if (error) {
        return false;
      }

      return data?.is_verified || false;
    } catch (err) {
      return false;
    }
  },
};

export default verificationService;
