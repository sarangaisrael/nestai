/**
 * Maps Hebrew words to psychological/situational thematic categories.
 * Used in monthly reports to surface meaningful themes instead of raw words.
 */

export interface ThemeCategory {
  id: string;
  labelHe: string;
  labelEn: string;
  keywords: string[];
  icon: string;
}

export const THEME_CATEGORIES: ThemeCategory[] = [
  {
    id: "work",
    labelHe: "עבודה וקריירה",
    labelEn: "Work & Career",
    icon: "💼",
    keywords: [
      "עבודה", "עובד", "עובדת", "בוס", "מנהל", "מנהלת", "משרד", "פרויקט",
      "לחץ", "עומס", "משימה", "משימות", "קולגה", "צוות", "ישיבה", "ישיבות",
      "שכר", "משכורת", "קידום", "פיטורין", "קריירה", "מקצוע", "עסק",
      "לקוח", "לקוחות", "דדליין", "תפקיד", "ראיון", "מכירות",
    ],
  },
  {
    id: "relationships",
    labelHe: "מערכות יחסים",
    labelEn: "Relationships",
    icon: "❤️",
    keywords: [
      "זוגיות", "בעל", "אישה", "חבר", "חברה", "אהבה", "פרידה", "גירושין",
      "נישואין", "חתונה", "רומנטי", "דייט", "יחסים", "קשר", "אינטימיות",
      "בגידה", "אמון", "ריב", "מריבה", "פשרה", "תקשורת", "קרבה",
      "בדידות", "געגוע", "געגועים", "שותף", "שותפה", "בן זוג",
    ],
  },
  {
    id: "family",
    labelHe: "משפחה",
    labelEn: "Family",
    icon: "👨‍👩‍👧",
    keywords: [
      "משפחה", "אמא", "אבא", "אח", "אחות", "ילד", "ילדה", "ילדים",
      "הורים", "הורות", "תינוק", "סבא", "סבתא", "דוד", "דודה",
      "בית", "גידול", "חינוך", "אחריות", "ירושה", "שורשים",
    ],
  },
  {
    id: "health",
    labelHe: "בריאות וגוף",
    labelEn: "Health & Body",
    icon: "🏥",
    keywords: [
      "בריאות", "כאב", "כאבים", "רופא", "רופאה", "בדיקה", "תרופה", "תרופות",
      "שינה", "עייפות", "אנרגיה", "ספורט", "אימון", "תזונה", "דיאטה",
      "מחלה", "חולה", "ניתוח", "בית חולים", "גוף", "משקל", "מנוחה",
      "ראש", "בטן", "גב", "מיגרנה",
    ],
  },
  {
    id: "anxiety",
    labelHe: "חרדה ופחדים",
    labelEn: "Anxiety & Fears",
    icon: "😰",
    keywords: [
      "חרדה", "חרד", "חרדת", "פחד", "מפחד", "מפחדת", "דאגה", "מודאג",
      "מודאגת", "פאניקה", "התקף", "מתח", "מתוח", "מתוחה", "עצבנות",
      "אי שקט", "לחוץ", "לחוצה", "חשש", "טריגר", "סימפטום",
    ],
  },
  {
    id: "mood",
    labelHe: "מצב רוח ורגשות",
    labelEn: "Mood & Emotions",
    icon: "🎭",
    keywords: [
      "עצוב", "עצובה", "עצב", "דיכאון", "מדוכא", "מדוכאת", "שמח", "שמחה",
      "אושר", "כעס", "כועס", "כועסת", "תסכול", "מתוסכל", "בכי", "דמעות",
      "אשמה", "בושה", "גאווה", "קנאה", "תקווה", "אופטימי", "ייאוש",
      "ריקנות", "חוסר", "מרירות", "הקלה", "שמחה", "רגש", "רגשות",
    ],
  },
  {
    id: "selfworth",
    labelHe: "דימוי עצמי וערך",
    labelEn: "Self-Worth & Identity",
    icon: "🪞",
    keywords: [
      "ביטחון", "ערך", "דימוי", "הערכה", "ביקורת", "עצמי", "זהות",
      "השוואה", "מושלם", "כישלון", "הצלחה", "יכולת", "חוזק", "חולשה",
      "גבולות", "אמונה", "ספק", "פרפקציוניזם", "קבלה", "אני",
    ],
  },
  {
    id: "social",
    labelHe: "חברתי וחיים חברתיים",
    labelEn: "Social Life",
    icon: "👥",
    keywords: [
      "חברים", "חברות", "חברתי", "בודד", "בודדה", "מפגש", "אירוע",
      "מסיבה", "שייכות", "קבוצה", "קהילה", "שכנים", "תמיכה",
      "סביבה", "ניכור", "דחייה", "קבלה", "פופולרי",
    ],
  },
  {
    id: "growth",
    labelHe: "צמיחה והתפתחות",
    labelEn: "Growth & Development",
    icon: "🌱",
    keywords: [
      "צמיחה", "התפתחות", "למידה", "שינוי", "התקדמות", "מטרה", "מטרות",
      "חלום", "חלומות", "השראה", "מוטיבציה", "אתגר", "הישג",
      "יעד", "תהליך", "מסע", "תובנה", "תובנות", "מודעות",
    ],
  },
  {
    id: "coping",
    labelHe: "התמודדות ומשאבים",
    labelEn: "Coping & Resources",
    icon: "🛡️",
    keywords: [
      "התמודדות", "מתמודד", "מתמודדת", "כלים", "אסטרטגיה", "טיפול",
      "מטפל", "מטפלת", "תרגול", "מדיטציה", "נשימה", "הרגעה",
      "תמיכה", "עזרה", "משאב", "חוסן", "גמישות", "סבלנות",
    ],
  },
];

/**
 * Extended Hebrew stop-words for filtering before theme analysis.
 */
const HEBREW_STOP_WORDS = new Set([
  "את", "של", "על", "עם", "זה", "אני", "היא", "הוא", "הם", "הן",
  "לא", "כן", "גם", "רק", "אבל", "או", "כי", "אם", "מה", "מי",
  "איך", "למה", "כמה", "היום", "אתמול", "עכשיו", "אחרי", "לפני",
  "בין", "כל", "עוד", "יותר", "פחות", "הרבה", "קצת", "כזה", "כזו",
  "משהו", "שום", "כלום", "פשוט", "ממש", "מאוד", "אז", "ואז", "היה",
  "הייתי", "היינו", "להיות", "שלי", "שלו", "שלה", "שלנו", "ב", "ל",
  "מ", "ה", "ו", "ש", "כ", "ך", "ן", "ם", "לי", "לו", "לה", "לנו",
  "בו", "בה", "בי", "בנו", "אותי", "אותו", "אותה", "אותנו", "יש",
  "אין", "צריך", "צריכה", "רוצה", "יכול", "יכולה", "חושב", "חושבת",
  "the", "a", "is", "to", "and", "of", "in", "it", "i", "that",
  "was", "for", "on", "are", "but", "not", "you", "all", "can",
  "her", "had", "one", "our", "out", "day", "had", "has", "his",
  "how", "its", "let", "may", "new", "now", "old", "see", "way",
  "who", "did", "get", "got", "him", "just", "know", "like", "been",
  "really", "very", "about", "after", "also", "back", "because",
  "being", "before", "between", "come", "could", "even", "feel",
  "from", "going", "good", "have", "here", "into", "just", "keep",
  "last", "long", "look", "make", "many", "more", "much", "need",
  "only", "over", "some", "such", "take", "tell", "than", "them",
  "then", "these", "they", "this", "time", "want", "well", "went",
  "what", "when", "will", "with", "would", "your",
  // Hebrew filler / connector words
  "אפילו", "בעצם", "בטח", "נראה", "לגמרי", "בדיוק", "כאילו", "סתם",
  "ככה", "ככל", "שוב", "לפעמים", "תמיד", "אולי", "עדיין", "כבר",
  "קודם", "אחר", "אחרת", "כמו", "ביחד", "לבד", "דרך", "מול",
  "בגלל", "למרות", "בשביל", "כדי", "עד", "מתי", "לאן", "מאיפה",
]);

export interface ThemeResult {
  id: string;
  label: string;
  count: number;
  icon: string;
}

/**
 * Analyzes messages and returns the top thematic categories by relevance.
 */
export function categorizeIntoThemes(
  messages: string[],
  isRTL: boolean,
  maxThemes = 5
): ThemeResult[] {
  const allText = messages.join(" ");
  const words = allText.split(/\s+/).map(w =>
    w.replace(/[^\u0590-\u05FFa-zA-Z]/g, "").toLowerCase()
  ).filter(w => w.length > 2 && !HEBREW_STOP_WORDS.has(w));

  const themeCounts: Record<string, number> = {};

  for (const word of words) {
    for (const cat of THEME_CATEGORIES) {
      if (cat.keywords.some(kw => word.includes(kw) || kw.includes(word))) {
        themeCounts[cat.id] = (themeCounts[cat.id] || 0) + 1;
        break; // Each word maps to one category only
      }
    }
  }

  return Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxThemes)
    .map(([id, count]) => {
      const cat = THEME_CATEGORIES.find(c => c.id === id)!;
      return {
        id,
        label: isRTL ? cat.labelHe : cat.labelEn,
        count,
        icon: cat.icon,
      };
    });
}

/**
 * Returns just the theme labels (for use in PDF export, macro narrative, etc.)
 */
export function getThemeLabels(messages: string[], isRTL: boolean, maxThemes = 5): string[] {
  return categorizeIntoThemes(messages, isRTL, maxThemes).map(t => `${t.icon} ${t.label}`);
}
