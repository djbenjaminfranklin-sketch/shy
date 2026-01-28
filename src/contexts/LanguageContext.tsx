import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SupportedLanguage,
  getDeviceLanguage,
  setLanguage as setGlobalLanguage,
  getTranslations,
  t as translate,
  TranslationKeys,
} from '../i18n';

const LANGUAGE_STORAGE_KEY = '@shy_language';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (path: string) => string;
  translations: TranslationKeys;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(getDeviceLanguage());
  const [translations, setTranslations] = useState<TranslationKeys>(getTranslations());

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
  const setLanguage = async (lang: SupportedLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      setLanguageState(lang);
      setGlobalLanguage(lang);
      setTranslations(getTranslations());
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Translation function
  const t = (path: string): string => {
    return translate(path);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        translations,
      }}
    >
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
