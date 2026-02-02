import { getLocales } from 'expo-localization';
import { fr, en, es, it, de, he, TranslationKeys } from './translations';

// Supported languages
export type SupportedLanguage = 'fr' | 'en' | 'es' | 'it' | 'de' | 'he';

const translations: Record<SupportedLanguage, TranslationKeys> = {
  fr,
  en,
  es,
  it,
  de,
  he,
};

// Get device language
export const getDeviceLanguage = (): SupportedLanguage => {
  const locales = getLocales();
  const deviceLang = locales[0]?.languageCode || 'fr';

  // Return supported language or default to French
  if (deviceLang in translations) {
    return deviceLang as SupportedLanguage;
  }

  // Default to French for unsupported languages
  return 'fr';
};

// Current language state
let currentLanguage: SupportedLanguage = getDeviceLanguage();

// Get current language
export const getCurrentLanguage = (): SupportedLanguage => currentLanguage;

// Set language manually
export const setLanguage = (lang: SupportedLanguage): void => {
  currentLanguage = lang;
};

// Get translations for current language
export const getTranslations = (): TranslationKeys => {
  return translations[currentLanguage];
};

// Helper function to get a translation by path
// Usage: t('welcome.tagline') or t('common.cancel')
type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? `${K}.${NestedKeyOf<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

type TranslationPath = NestedKeyOf<TranslationKeys> | string;

export const t = (path: TranslationPath): string => {
  const keys = path.split('.');
  let value: any = translations[currentLanguage];

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      // Fallback to French if key not found
      value = translations.fr;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          return path; // Return path if not found
        }
      }
      break;
    }
  }

  return typeof value === 'string' ? value : path;
};

// Helper function with parameter interpolation
export const tWithParams = (path: TranslationPath, params: Record<string, string | number>): string => {
  let text = t(path);
  // Support named params: {count}, {name}, etc.
  Object.entries(params).forEach(([key, value]) => {
    text = text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
  });
  // Support indexed params: {0}, {1}, etc.
  Object.values(params).forEach((value, index) => {
    text = text.replace(new RegExp(`\\{${index}\\}`, 'g'), String(value));
  });
  return text;
};

// Export translations for direct access
export { fr, en, es, it, de, he, TranslationKeys };
