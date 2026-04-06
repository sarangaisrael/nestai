import { useLanguage } from "@/contexts/LanguageContext";

interface EmotionCloudProps {
  emotions: { emotion: string; count: number }[];
}

// Map common emotions to HSL color vars
const EMOTION_COLORS: Record<string, string> = {
  // Hebrew
  'חרדה': 'var(--emotion-anxious)',
  'חרד': 'var(--emotion-anxious)',
  'לחץ': 'var(--emotion-anxious)',
  'שמחה': 'var(--emotion-happy)',
  'שמח': 'var(--emotion-happy)',
  'אושר': 'var(--emotion-happy)',
  'עצב': 'var(--emotion-sad)',
  'עצוב': 'var(--emotion-sad)',
  'עייפות': 'var(--emotion-tired)',
  'עייף': 'var(--emotion-tired)',
  'כעס': 'var(--emotion-angry)',
  'כועס': 'var(--emotion-angry)',
  'רוגע': 'var(--emotion-calm)',
  'רגוע': 'var(--emotion-calm)',
  'אהבה': 'var(--emotion-love)',
  'פחד': 'var(--emotion-fear)',
  // English
  'anxiety': 'var(--emotion-anxious)',
  'anxious': 'var(--emotion-anxious)',
  'stress': 'var(--emotion-anxious)',
  'happy': 'var(--emotion-happy)',
  'happiness': 'var(--emotion-happy)',
  'joy': 'var(--emotion-happy)',
  'sad': 'var(--emotion-sad)',
  'sadness': 'var(--emotion-sad)',
  'tired': 'var(--emotion-tired)',
  'fatigue': 'var(--emotion-tired)',
  'angry': 'var(--emotion-angry)',
  'anger': 'var(--emotion-angry)',
  'calm': 'var(--emotion-calm)',
  'peaceful': 'var(--emotion-calm)',
  'love': 'var(--emotion-love)',
  'fear': 'var(--emotion-fear)',
};

const FALLBACK_COLORS = [
  'var(--primary)',
  'var(--secondary)',
  'var(--accent)',
  'var(--emotion-calm)',
  'var(--emotion-happy)',
];

const getEmotionColor = (emotion: string, index: number): string => {
  const lower = emotion.toLowerCase().trim();
  return EMOTION_COLORS[lower] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
};

const EmotionCloud = ({ emotions }: EmotionCloudProps) => {
  const { t, isRTL } = useLanguage();

  if (!emotions || emotions.length === 0) return null;

  const maxCount = Math.max(...emotions.map(e => e.count));
  const topTwo = emotions.slice(0, 2).map(e => e.emotion).join(isRTL ? " ו" : " and ");

  return (
    <div className="space-y-3 pt-2">
      <h2 className="text-h2 font-medium">{t.dashboard.recentEmotions}</h2>
      <div className="flex flex-wrap gap-2">
        {emotions.slice(0, 6).map((item, idx) => {
          const colorVar = getEmotionColor(item.emotion, idx);
          const ratio = item.count / maxCount;
          const size = 0.85 + ratio * 0.35; // scale from 0.85 to 1.2

          return (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-transform hover:scale-105"
              style={{
                backgroundColor: `hsl(${colorVar} / 0.12)`,
                borderColor: `hsl(${colorVar} / 0.25)`,
                color: `hsl(${colorVar})`,
                fontSize: `${size}rem`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: `hsl(${colorVar})` }}
              />
              {item.emotion}
            </span>
          );
        })}
      </div>
      {topTwo && (
        <p className="text-xs text-muted-foreground">
          {t.dashboard.emotionsInLast30Days.replace('{emotions}', topTwo)}
        </p>
      )}
    </div>
  );
};

export default EmotionCloud;
