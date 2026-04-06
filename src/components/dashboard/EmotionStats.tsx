import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3 } from "lucide-react";

interface EmotionItem {
  emotion: string;
  percent: number;
  color: string;
}

interface EmotionStatsProps {
  breakdown: EmotionItem[];
}

const EmotionStats = ({ breakdown }: EmotionStatsProps) => {
  const { isRTL } = useLanguage();

  if (!breakdown || breakdown.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-3"
    >
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            {isRTL ? "מפת רגשות" : "Emotion Map"}
          </h3>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {isRTL ? "מהשבוע האחרון" : "Past week"}
        </span>
      </div>

      {/* Emotion Breakdown Bars */}
      {breakdown && breakdown.length > 0 && (
        <Card className="p-4 border-0 rounded-2xl bg-card shadow-sm">
          <div className="space-y-3">
            {breakdown.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: isRTL ? 12 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.08 }}
                className="space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-foreground">{item.emotion}</span>
                  <span className="text-xs font-semibold text-muted-foreground">{item.percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percent}%` }}
                    transition={{ duration: 0.8, delay: 0.4 + idx * 0.1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

    </motion.div>
  );
};

export default EmotionStats;
