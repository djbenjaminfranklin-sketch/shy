export const LANGUAGES = {
  fr: { id: 'fr', label: 'Français', flag: '🇫🇷' },
  en: { id: 'en', label: 'English', flag: '🇬🇧' },
  es: { id: 'es', label: 'Español', flag: '🇪🇸' },
  de: { id: 'de', label: 'Deutsch', flag: '🇩🇪' },
  it: { id: 'it', label: 'Italiano', flag: '🇮🇹' },
  pt: { id: 'pt', label: 'Português', flag: '🇵🇹' },
  ar: { id: 'ar', label: 'العربية', flag: '🇸🇦' },
  zh: { id: 'zh', label: '中文', flag: '🇨🇳' },
  ja: { id: 'ja', label: '日本語', flag: '🇯🇵' },
  ko: { id: 'ko', label: '한국어', flag: '🇰🇷' },
  ru: { id: 'ru', label: 'Русский', flag: '🇷🇺' },
  nl: { id: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  pl: { id: 'pl', label: 'Polski', flag: '🇵🇱' },
  tr: { id: 'tr', label: 'Türkçe', flag: '🇹🇷' },
} as const;

export type LanguageId = keyof typeof LANGUAGES;
export type Language = typeof LANGUAGES[LanguageId];

export const LANGUAGE_LIST = Object.values(LANGUAGES);
