// Service de traduction pour les messages du chat
// Utilise Google Cloud Translation API

const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2';
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  error?: string;
}

/**
 * Traduit un texte vers la langue cible avec Google Cloud Translation
 * @param text - Texte à traduire
 * @param targetLang - Code de la langue cible (fr, en, es, etc.)
 * @param sourceLang - Code de la langue source (optionnel, détection auto si non fourni)
 */
export async function translateText(
  text: string,
  targetLang: string,
  sourceLang?: string
): Promise<TranslationResult> {
  try {
    // Si le texte est vide ou très court, ne pas traduire
    if (!text || text.trim().length < 2) {
      return { translatedText: text };
    }

    // Vérifier que l'API est configurée
    if (!GOOGLE_API_KEY || GOOGLE_API_KEY.length < 10) {
      console.warn('Google Translation API key not configured');
      return { translatedText: text, error: 'API non configurée' };
    }

    const params: Record<string, string> = {
      q: text,
      target: targetLang,
      key: GOOGLE_API_KEY,
      format: 'text',
    };

    if (sourceLang) {
      params.source = sourceLang;
    }

    const response = await fetch(GOOGLE_TRANSLATE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(params).toString(),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Google Translation error:', data.error);
      return {
        translatedText: text,
        error: data.error.message || 'Erreur de traduction',
      };
    }

    if (data.data?.translations?.[0]) {
      const translation = data.data.translations[0];
      return {
        translatedText: translation.translatedText,
        detectedLanguage: translation.detectedSourceLanguage,
      };
    }

    return {
      translatedText: text,
      error: 'Réponse inattendue de l\'API',
    };
  } catch (error) {
    console.error('Translation error:', error);
    return {
      translatedText: text,
      error: 'Impossible de traduire le message',
    };
  }
}

/**
 * Détecte la langue d'un texte
 * @param text - Texte à analyser
 */
export async function detectLanguage(text: string): Promise<string | null> {
  try {
    if (!text || text.trim().length < 3) {
      return null;
    }

    if (!GOOGLE_API_KEY || GOOGLE_API_KEY.length < 10) {
      return null;
    }

    const response = await fetch(
      `https://translation.googleapis.com/language/translate/v2/detect?key=${GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          q: text.slice(0, 100),
        }).toString(),
      }
    );

    const data = await response.json();

    if (data.data?.detections?.[0]?.[0]) {
      return data.data.detections[0][0].language;
    }

    return null;
  } catch (error) {
    console.error('Language detection error:', error);
    return null;
  }
}

export default {
  translateText,
  detectLanguage,
};
