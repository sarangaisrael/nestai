import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations, Translations, Language, isRTL as isRTLFn } from '@/lib/translations';

const STORAGE_KEY = 'nestai_lang';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
}

const defaultLang: Language = 'he';

const LanguageContext = createContext<LanguageContextType>({
  language: defaultLang,
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: translations[defaultLang],
  isRTL: true,
  dir: 'rtl',
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return (saved === 'he' || saved === 'en') ? saved : defaultLang;
  });

  useEffect(() => {
    const rtl = isRTLFn(language);
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const setLanguage = (lang: Language) => setLanguageState(lang);
  const toggleLanguage = () => setLanguageState(prev => prev === 'he' ? 'en' : 'he');

  const rtl = isRTLFn(language);

  const value: LanguageContextType = {
    language,
    setLanguage,
    toggleLanguage,
    t: translations[language],
    isRTL: rtl,
    dir: rtl ? 'rtl' : 'ltr',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => useContext(LanguageContext);
