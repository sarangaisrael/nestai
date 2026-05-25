export type Language = 'he' | 'en';

export const isRTL = (lang: Language) => lang === 'he';

export interface Translations {
  greeting_morning: string;
  greeting_evening: string;
  greeting_afternoon: string;
  write_label: string;
  write_question: string;
  write_placeholder: string;
  nav_home: string;
  nav_journal: string;
  nav_settings: string;
  summaries: string;
  journal: string;
  tools: string;
  trends: string;
  toolbox: string;
  support: string;
  login: string;
  signup: string;
  email: string;
  password: string;
}

export const translations: Record<Language, Translations> = {
  he: {
    greeting_morning: 'בוקר טוב',
    greeting_evening: 'ערב טוב',
    greeting_afternoon: 'צהריים טובים',
    write_label: 'רגע של הקשבה',
    write_question: 'איך את/ה מרגיש/ה עכשיו?',
    write_placeholder: 'התחל לכתוב...',
    nav_home: 'בית',
    nav_journal: 'יומן',
    nav_settings: 'הגדרות',
    summaries: 'סיכומים שבועיים',
    journal: 'היומן שלי',
    tools: 'כלים טיפוליים',
    trends: 'מגמות חודשיות',
    toolbox: 'ארגז הכלים שלי',
    support: 'תמיכה במוצר',
    login: 'התחברות',
    signup: 'הרשמה',
    email: 'אימייל',
    password: 'סיסמה',
  },
  en: {
    greeting_morning: 'Good morning',
    greeting_evening: 'Good evening',
    greeting_afternoon: 'Good afternoon',
    write_label: 'A moment of reflection',
    write_question: 'How are you feeling right now?',
    write_placeholder: 'Start writing...',
    nav_home: 'Home',
    nav_journal: 'Journal',
    nav_settings: 'Settings',
    summaries: 'Weekly summaries',
    journal: 'My journal',
    tools: 'Therapeutic tools',
    trends: 'Monthly trends',
    toolbox: 'My toolbox',
    support: 'Support',
    login: 'Sign in',
    signup: 'Sign up',
    email: 'Email',
    password: 'Password',
  }
};
