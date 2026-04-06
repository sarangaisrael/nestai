import { Card } from "@/components/ui/card";
import { BarChart3, MessageSquare, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface SideBySideProps {
  currentMonth: {
    label: string;
    moodAvg: number;
    topWords: string[];
    sessionCount: number;
  };
  previousMonth: {
    label: string;
    moodAvg: number;
    topWords: string[];
    sessionCount: number;
  };
}

const MetricRow = ({
  label,
  icon: Icon,
  current,
  previous,
  renderValue,
  higherIsBetter = true,
}: {
  label: string;
  icon: any;
  current: number;
  previous: number;
  renderValue: (v: number) => string;
  higherIsBetter?: boolean;
}) => {
  const diff = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
  const direction = Math.abs(diff) < 5 ? "neutral" : diff > 0 ? "up" : "down";
  const isPositive = direction === "up" ? higherIsBetter : !higherIsBetter;
  const color =
    direction === "neutral"
      ? "text-muted-foreground"
      : isPositive
        ? "text-emerald-500"
        : "text-rose-500";

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
      <Icon className="h-4 w-4 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-base font-bold text-foreground">{renderValue(current)}</span>
          <span className="text-[10px] text-muted-foreground">vs {renderValue(previous)}</span>
        </div>
      </div>
      <div className="flex items-center gap-1">
        {direction === "up" ? (
          <TrendingUp className={`h-3.5 w-3.5 ${color}`} />
        ) : direction === "down" ? (
          <TrendingDown className={`h-3.5 w-3.5 ${color}`} />
        ) : (
          <Minus className={`h-3.5 w-3.5 ${color}`} />
        )}
        {direction !== "neutral" && (
          <span className={`text-xs font-medium ${color}`}>
            {diff > 0 ? "+" : ""}{diff}%
          </span>
        )}
      </div>
    </div>
  );
};

const SideBySideComparison = ({ currentMonth, previousMonth }: SideBySideProps) => {
  const { t, isRTL } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
    >
      <Card className="p-5 border border-border bg-card/80 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t.summary.sideBySide}</h3>
            <p className="text-xs text-muted-foreground">
              {currentMonth.label} vs {previousMonth.label}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <MetricRow
            label={t.summary.mood}
            icon={TrendingUp}
            current={currentMonth.moodAvg}
            previous={previousMonth.moodAvg}
            renderValue={(v) => `${v}/5`}
            higherIsBetter={true}
          />
          <MetricRow
            label={t.summary.sessionFrequency}
            icon={MessageSquare}
            current={currentMonth.sessionCount}
            previous={previousMonth.sessionCount}
            renderValue={(v) => `${v} ${t.summary.sessions}`}
            higherIsBetter={true}
          />
        </div>

        {/* Top words comparison */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground">{t.summary.currentMonth}</p>
            <div className="flex flex-wrap gap-1">
              {currentMonth.topWords.slice(0, 5).map((w, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-primary/10 text-primary font-medium">
                  {w}
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <p className="text-[10px] font-medium text-muted-foreground">{t.summary.previousMonth}</p>
            <div className="flex flex-wrap gap-1">
              {previousMonth.topWords.slice(0, 5).map((w, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-[10px] bg-muted text-muted-foreground font-medium">
                  {w}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default SideBySideComparison;
