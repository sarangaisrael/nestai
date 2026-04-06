import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface TopicShift {
  topic: string;
  direction: "fading" | "strengthening";
  change: number; // percentage change
}

interface TrendKPIsProps {
  stressChange: number; // percentage, positive = more stress
  topicShifts: TopicShift[];
}

const TrendKPIs = ({ stressChange, topicShifts }: TrendKPIsProps) => {
  const { t } = useLanguage();

  const stressDirection = Math.abs(stressChange) < 5 ? "neutral" : stressChange > 0 ? "up" : "down";
  // For stress, down is good
  const stressColor =
    stressDirection === "neutral"
      ? "text-muted-foreground"
      : stressDirection === "down"
        ? "text-emerald-500"
        : "text-rose-500";
  const stressBg =
    stressDirection === "neutral"
      ? "bg-muted/50"
      : stressDirection === "down"
        ? "bg-emerald-500/10"
        : "bg-rose-500/10";

  const fading = topicShifts.filter((s) => s.direction === "fading");
  const strengthening = topicShifts.filter((s) => s.direction === "strengthening");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="space-y-3"
    >
      {/* Stress change KPI */}
      <Card className="p-4 border border-border bg-card/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${stressBg}`}>
              <AlertTriangle className={`h-4 w-4 ${stressColor}`} />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{t.summary.stressChange}</p>
              <p className="text-[10px] text-muted-foreground">{t.summary.comparedToPrevious}</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${stressBg}`}>
            {stressDirection === "up" ? (
              <TrendingUp className={`h-3.5 w-3.5 ${stressColor}`} />
            ) : stressDirection === "down" ? (
              <TrendingDown className={`h-3.5 w-3.5 ${stressColor}`} />
            ) : (
              <Minus className={`h-3.5 w-3.5 ${stressColor}`} />
            )}
            <span className={`text-sm font-semibold ${stressColor}`}>
              {stressDirection === "neutral"
                ? t.summary.noChange
                : `${stressChange > 0 ? "+" : ""}${stressChange}%`}
            </span>
          </div>
        </div>
      </Card>

      {/* Topic shifts */}
      {(fading.length > 0 || strengthening.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Fading */}
          {fading.length > 0 && (
            <Card className="p-4 border border-border bg-card/80 space-y-2.5">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-blue-500" />
                <p className="text-xs font-semibold text-foreground">{t.summary.fadingTopics}</p>
              </div>
              <div className="space-y-1.5">
                {fading.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-foreground/80">{s.topic}</span>
                    <span className="text-[10px] text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full">
                      -{Math.abs(s.change)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">{t.summary.lessFrequent}</p>
            </Card>
          )}

          {/* Strengthening */}
          {strengthening.length > 0 && (
            <Card className="p-4 border border-border bg-card/80 space-y-2.5">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-semibold text-foreground">{t.summary.strengtheningTopics}</p>
              </div>
              <div className="space-y-1.5">
                {strengthening.map((s, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-foreground/80">{s.topic}</span>
                    <span className="text-[10px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full">
                      +{Math.abs(s.change)}%
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">{t.summary.moreFrequent}</p>
            </Card>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default TrendKPIs;
