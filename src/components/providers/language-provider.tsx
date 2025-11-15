'use client';

import React, { createContext, useState, ReactNode, useEffect } from 'react';

type Language = 'es' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const LanguageContext = createContext<LanguageContextType>({
  language: 'es',
  setLanguage: () => {},
});

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang && ['en', 'es'].includes(storedLang)) {
      setLanguage(storedLang);
    }
  }, []);

  const value = {
    language,
    setLanguage: (lang: Language) => {
      localStorage.setItem('language', lang);
      setLanguage(lang);
    },
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
