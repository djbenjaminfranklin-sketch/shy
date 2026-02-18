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
export async function moderateImage(base64Image: string): Promise<ModerationResult> {
  const visionApiKey = process.env.EXPO_PUBLIC_GOOGLE_VISION_API_KEY;

  // Si pas de clé API configurée, approuver par défaut (mode dev)
  if (!visionApiKey || visionApiKey === 'your_google_vision_api_key') {
    return {
      status: 'approved',
      isNsfw: false,
    };
  }

  try {
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
      // En cas d'erreur API, on approuve pour ne pas bloquer l'utilisateur
      return { status: 'approved', isNsfw: false };
    }

    const data: VisionApiResponse = await response.json();

    // Vérifier si l'API a retourné une erreur
    if (data.responses[0]?.error) {
      return { status: 'approved', isNsfw: false };
    }

    const safeSearch = data.responses[0]?.safeSearchAnnotation;

    if (!safeSearch) {
      return { status: 'approved', isNsfw: false };
    }

    // Niveaux problématiques: LIKELY ou VERY_LIKELY
    const problematicLevels: SafeSearchLikelihood[] = ['LIKELY', 'VERY_LIKELY'];

    // Rejeter si contenu adulte ou violent
    if (problematicLevels.includes(safeSearch.adult)) {
      return {
        status: 'rejected',
        reason: 'Cette image contient du contenu pour adultes non autorisé.',
        isNsfw: true,
        confidence: safeSearch.adult === 'VERY_LIKELY' ? 0.95 : 0.75,
      };
    }

    if (problematicLevels.includes(safeSearch.violence)) {
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
      return {
        status: 'rejected',
        reason: 'Cette image est trop suggestive pour SHY.',
        isNsfw: true,
        confidence: 0.9,
      };
    }

    return {
      status: 'approved',
      isNsfw: false,
    };

  } catch (error) {
    // En cas d'erreur, on approuve pour ne pas bloquer l'utilisateur
    return { status: 'approved', isNsfw: false };
  }
}

/**
 * Validate and moderate image before upload
 */
export async function validateAndModerateImage(
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
    // In case of error, allow the upload
    return { valid: true };
  }
}

// Bucket constants
export const BUCKET_NAME = 'profile-photos';
export const VERIFICATION_BUCKET = 'verification-photos';
export const MAX_WIDTH = 1080;
export const MAX_HEIGHT = 1080;
export const QUALITY = 0.8;
