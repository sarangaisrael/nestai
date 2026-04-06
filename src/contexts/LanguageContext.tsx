import { createContext, useContext, useEffect, ReactNode } from 'react';
import { translations, Translations } from '@/lib/translations';

interface LanguageContextType {
  language: 'he';
  setLanguage: (lang: string) => void;
  t: Translations;
  isRTL: boolean;
  dir: 'rtl';
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'he',
  setLanguage: () => {},
  t: translations['he'],
  isRTL: true,
  dir: 'rtl',
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'he';
  }, []);

  const value: LanguageContextType = {
    language: 'he',
    setLanguage: () => {},
    t: translations['he'],
    isRTL: true,
    dir: 'rtl',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  return useContext(LanguageContext);
};
