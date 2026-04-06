import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface StreakProgressCardProps {
  daysWritten: number;
  maxStreak: number;
  avgWordsPerDay: number;
  totalWords: number;
}

const StreakProgressCard = ({ daysWritten, maxStreak, avgWordsPerDay, totalWords }: StreakProgressCardProps) => {
  const { t } = useLanguage();

  const streakGoal = maxStreak + 2;
  const streakProgress = Math.min((maxStreak / streakGoal) * 100, 100);
  const daysToNewRecord = streakGoal - maxStreak;
  const isNewRecord = daysToNewRecord <= 0;

  const baseline = 50;
  const trend = avgWordsPerDay > baseline ? 'up' : avgWordsPerDay < baseline ? 'down' : 'neutral';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.55 }}
    >
      <div className="grid grid-cols-1 gap-3">
        <Card className="p-4 border-0 glass-card tech-border shadow-card rounded-3xl">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-secondary/10">
              <Calendar className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {t.dashboard.daysWritten.replace('{count}', String(daysWritten))}
              </p>
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {t.dashboard.maxStreak.replace('{count}', String(maxStreak))}
                  </p>
                  <p className="text-xs font-medium text-secondary">
                    {isNewRecord
                      ? t.dashboard.newRecord
                      : t.dashboard.streakProgress.replace('{count}', String(daysToNewRecord))}
                  </p>
                </div>
                <Progress value={streakProgress} className="h-2 bg-secondary/10" />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-0 glass-card tech-border shadow-card rounded-3xl">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-2xl bg-accent/10">
              {trend === 'up' ? (
                <TrendingUp className="h-5 w-5 text-secondary" />
              ) : trend === 'down' ? (
                <TrendingDown className="h-5 w-5 text-destructive" />
              ) : (
                <Minus className="h-5 w-5 text-accent" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {t.dashboard.totalWords.replace('{count}', totalWords.toLocaleString())}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <p className="text-xs text-muted-foreground">
                  {t.dashboard.avgWordsPerDay.replace('{count}', String(avgWordsPerDay))}
                </p>
                {trend !== 'neutral' && (
                  <span className={`text-xs font-medium ${trend === 'up' ? 'text-secondary' : 'text-destructive'}`}>
                    • {trend === 'up' ? t.dashboard.trendUp : t.dashboard.trendDown}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};

export default StreakProgressCard;
