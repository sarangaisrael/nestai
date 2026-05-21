import { useMemo } from "react";
import { CheckCircle, Circle } from "lucide-react";

interface SessionReadinessScoreProps {
  hasQuestionnaire: boolean;
  hasWriting: boolean;
  hasEmotionRating: boolean;
  writingCount: number;
  isRTL?: boolean;
}

export const SessionReadinessScore = ({
  hasQuestionnaire,
  hasWriting,
  hasEmotionRating,
  writingCount,
  isRTL = false,
}: SessionReadinessScoreProps) => {
  const { score, items } = useMemo(() => {
    const checkItems = [
      { 
        label: isRTL ? "כתיבה ביומן" : "Journal writing", 
        completed: hasWriting 
      },
      { 
        label: isRTL ? "דירוג רגשות" : "Emotion rating", 
        completed: hasEmotionRating 
      },
      { 
        label: isRTL ? "3+ רשומות השבוע" : "3+ entries this week", 
        completed: writingCount >= 3 
      },
    ];

    const completedCount = checkItems.filter(item => item.completed).length;
    const scorePercent = Math.round((completedCount / checkItems.length) * 100);

    return { score: scorePercent, items: checkItems };
  }, [hasWriting, hasEmotionRating, writingCount, isRTL]);

  const getScoreColor = () => {
    if (score >= 75) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getScoreLabel = () => {
    if (score >= 75) return isRTL ? 'מוכן/ה למפגש!' : 'Ready for session!';
    if (score >= 50) return isRTL ? 'בדרך הנכונה' : 'On the right track';
    return isRTL ? 'עוד קצת ותגיע' : 'Almost there';
  };

  return (
    <div className="space-y-4">
      {/* Score Circle */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative w-24 h-24">
          {/* Background circle */}
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${score * 2.51} 251`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${getScoreColor()}`}>{score}%</span>
          </div>
        </div>
        <span className={`text-sm font-medium ${getScoreColor()}`}>{getScoreLabel()}</span>
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            {item.completed ? (
              <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SessionReadinessScore;
