// Service de traduction pour les messages du chat
// Utilise l'API MyMemory (gratuite, pas de clé requise)

const MYMEMORY_API_URL = 'https://api.mymemory.translated.net/get';

export interface TranslationResult {
  translatedText: string;
  detectedLanguage?: string;
  error?: string;
}

/**
 * Traduit un texte vers la langue cible
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

    // Construire le paramètre langpair
    const langPair = sourceLang
      ? `${sourceLang}|${targetLang}`
      : `autodetect|${targetLang}`;

    const url = `${MYMEMORY_API_URL}?q=${encodeURIComponent(text)}&langpair=${langPair}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return {
        translatedText: data.responseData.translatedText,
        detectedLanguage: data.responseData.detectedLanguage,
      };
    }

    // Erreur de l'API
    return {
      translatedText: text,
      error: data.responseDetails || 'Erreur de traduction',
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

    // Utiliser l'API avec autodetect vers l'anglais juste pour détecter
    const url = `${MYMEMORY_API_URL}?q=${encodeURIComponent(text.slice(0, 100))}&langpair=autodetect|en`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseData?.detectedLanguage) {
      return data.responseData.detectedLanguage;
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
