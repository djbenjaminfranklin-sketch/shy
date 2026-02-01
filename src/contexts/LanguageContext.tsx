import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SupportedLanguage,
  getDeviceLanguage,
  setLanguage as setGlobalLanguage,
  getTranslations,
  TranslationKeys,
} from '../i18n';

const LANGUAGE_STORAGE_KEY = '@shy_language';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (path: string, params?: Record<string, string | number>) => string;
  translations: TranslationKeys;
  // Force re-render key - increments when language changes
  languageVersion: number;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(getDeviceLanguage());
  const [translations, setTranslations] = useState<TranslationKeys>(getTranslations());
  // Version counter to force re-renders when language changes
  const [languageVersion, setLanguageVersion] = useState(0);

  // Load saved language preference on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLang && (savedLang === 'fr' || savedLang === 'en')) {
          setLanguageState(savedLang as SupportedLanguage);
          setGlobalLanguage(savedLang as SupportedLanguage);
          setTranslations(getTranslations());
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };
    loadLanguage();
  }, []);

  // Set language and persist
  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setGlobalLanguage(lang);
      setLanguageState(lang);
      setTranslations(getTranslations());
      // Increment version to force re-render of all consumers
      setLanguageVersion(v => v + 1);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  }, []);

  // Translation function - memoized based on language version
  const t = useCallback((path: string, params?: Record<string, string | number>): string => {
    const keys = path.split('.');
    let value: unknown = translations;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key];
      } else {
        // Return the path if key not found
        return path;
      }
    }

    let result = typeof value === 'string' ? value : path;

    // Interpolate parameters: replace {key} with value
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramValue));
      });
    }

    return result;
  }, [translations]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    translations,
    languageVersion,
  }), [language, setLanguage, t, translations, languageVersion]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Simple hook for translations only
export const useTranslations = () => {
  const { t, translations } = useLanguage();
  return { t, translations };
};
