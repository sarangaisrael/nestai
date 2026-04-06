import { Card } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface SelfReflectionIndexProps {
  depthScore?: number; // 0-100
  previousDepthScore?: number;
}

const SelfReflectionIndex = ({ depthScore = 72, previousDepthScore = 55 }: SelfReflectionIndexProps) => {
  const { t } = useLanguage();

  const improvement = depthScore - previousDepthScore;
  const isImproved = improvement > 0;

  // Map score to descriptive level
  const getLevel = (score: number) => {
    if (score >= 75) return { label: t.dashboard.depthDeep, color: 'hsl(var(--secondary))' };
    if (score >= 50) return { label: t.dashboard.depthModerate, color: 'hsl(var(--primary))' };
    return { label: t.dashboard.depthSurface, color: 'hsl(var(--muted-foreground))' };
  };

  const level = getLevel(depthScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="relative overflow-hidden p-5 border-0 rounded-3xl glass-card tech-border shadow-card">
        <div className="absolute -bottom-10 -right-10 w-28 h-28 rounded-full bg-secondary/5 blur-2xl" />

        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-secondary/10">
              <Eye className="h-5 w-5 text-secondary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {t.dashboard.reflectionTitle}
            </h3>
          </div>

          {/* Depth Meter */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t.dashboard.depthSurface}</span>
              <span className="text-xs font-medium" style={{ color: level.color }}>
                {level.label}
              </span>
              <span className="text-xs text-muted-foreground">{t.dashboard.depthDeep}</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, hsl(var(--muted-foreground) / 0.3), hsl(var(--primary)), hsl(var(--secondary)))`,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${depthScore}%` }}
                transition={{ duration: 1.2, delay: 0.4 }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">{depthScore}%</span>
              {isImproved && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                  +{improvement}% {t.dashboard.fromLastWeek}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.dashboard.reflectionInsight}
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default SelfReflectionIndex;
