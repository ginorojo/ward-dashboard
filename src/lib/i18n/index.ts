'use client';

import { useContext } from 'react';
import { LanguageContext, LanguageProvider } from '@/components/providers/language-provider';
import es from './locales/es.json';
import en from './locales/en.json';

const translations = { es, en };

export const useTranslation = () => {
  const { language } = useContext(LanguageContext);
  
  function t(key: string): string {
    const keys = key.split('.');
    let result: any = translations[language];
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        // Fallback to English if translation is not found
        let fallbackResult: any = translations['en'];
        for (const fk of keys) {
            fallbackResult = fallbackResult?.[fk];
        }
        return fallbackResult || key;
      }
    }
    return result || key;
  }

  return { t, language };
};

export { LanguageProvider };
