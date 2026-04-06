import { he } from './he';
import { en } from './en';

export type Language = 'he' | 'en';
export type Translations = typeof he;

export const translations: Record<Language, Translations> = {
  he,
  en,
};

export const languageNames: Record<Language, string> = {
  he: 'עברית',
  en: 'English',
};

export const isRTL = (lang: Language): boolean => lang === 'he';

export { he, en };