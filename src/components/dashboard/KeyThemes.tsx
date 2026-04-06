import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { categorizeIntoThemes, type ThemeResult } from "@/lib/themeCategories";

interface KeyThemesProps {
  messages: string[];
}

const THEME_COLORS = [
  { bg: 'hsl(var(--primary) / 0.08)', border: 'hsl(var(--primary) / 0.2)', text: 'hsl(var(--primary))' },
  { bg: 'hsl(var(--secondary) / 0.08)', border: 'hsl(var(--secondary) / 0.2)', text: 'hsl(var(--secondary))' },
  { bg: 'hsl(var(--accent) / 0.08)', border: 'hsl(var(--accent) / 0.2)', text: 'hsl(var(--accent))' },
  { bg: 'hsl(var(--emotion-calm) / 0.08)', border: 'hsl(var(--emotion-calm) / 0.2)', text: 'hsl(var(--emotion-calm))' },
  { bg: 'hsl(var(--emotion-love) / 0.08)', border: 'hsl(var(--emotion-love) / 0.2)', text: 'hsl(var(--emotion-love))' },
  { bg: 'hsl(var(--emotion-happy) / 0.08)', border: 'hsl(var(--emotion-happy) / 0.2)', text: 'hsl(var(--emotion-happy))' },
  { bg: 'hsl(var(--emotion-anxious) / 0.08)', border: 'hsl(var(--emotion-anxious) / 0.2)', text: 'hsl(var(--emotion-anxious))' },
];

const KeyThemes = ({ messages }: KeyThemesProps) => {
  const { t, isRTL } = useLanguage();

  const themes = useMemo(() => {
    if (!messages || messages.length === 0) return [];
    return categorizeIntoThemes(messages, isRTL, 7);
  }, [messages, isRTL]);

  if (themes.length === 0) return null;

  const maxCount = Math.max(...themes.map(th => th.count));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="space-y-3 pt-2"
    >
      <h2 className="text-h2 font-medium">{t.dashboard.keyThemes}</h2>
      <div className="flex flex-wrap gap-2">
        {themes.map((theme, idx) => {
          const color = THEME_COLORS[idx % THEME_COLORS.length];
          const ratio = theme.count / maxCount;
          const size = 0.8 + ratio * 0.25;

          return (
            <motion.span
              key={theme.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + idx * 0.05 }}
              className="px-3 py-1.5 rounded-full font-medium border transition-transform hover:scale-105"
              style={{
                backgroundColor: color.bg,
                borderColor: color.border,
                color: color.text,
                fontSize: `${size}rem`,
              }}
            >
              {theme.icon} {theme.label}
            </motion.span>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {isRTL ? "נושאים מרכזיים מתוך הכתיבה שלך" : "Key themes from your writing"}
      </p>
    </motion.div>
  );
};

export default KeyThemes;
