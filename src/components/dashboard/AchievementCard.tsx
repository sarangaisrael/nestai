import { Card } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface AchievementCardProps {
  totalWords: number;
  maxStreak: number;
  daysWritten: number;
}

const AchievementCard = ({ totalWords, maxStreak, daysWritten }: AchievementCardProps) => {
  const { t } = useLanguage();

  const achievement = totalWords >= 500
    ? { label: t.dashboard.totalWords.replace('{count}', totalWords.toLocaleString()), value: totalWords }
    : maxStreak >= 3
      ? { label: t.dashboard.maxStreak.replace('{count}', String(maxStreak)), value: maxStreak }
      : { label: t.dashboard.daysWritten.replace('{count}', String(daysWritten)), value: daysWritten };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
    >
      <Card className="relative overflow-hidden p-5 border-0 rounded-3xl glass-card tech-border shadow-card bg-gradient-to-br from-primary/10 via-transparent to-secondary/10">
        <div className="absolute top-0 right-0 w-28 h-28 bg-primary/5 rounded-full -translate-y-10 translate-x-10 blur-xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-secondary/5 rounded-full translate-y-8 -translate-x-8 blur-xl" />
        <div className="relative flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 shadow-sm">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {t.dashboard.highlight}
            </p>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {achievement.label}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default AchievementCard;
