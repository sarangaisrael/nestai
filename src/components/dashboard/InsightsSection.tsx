import { useLanguage } from "@/contexts/LanguageContext";
import { TrendingDown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface InsightsSectionProps {
  narrativeInsight?: string | null;
}

const InsightsSection = ({ narrativeInsight }: InsightsSectionProps) => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  const defaultInsight = isRTL
    ? "רמות הלחץ שלך ירדו ב-15% השבוע 🎉"
    : "Your stress levels decreased by 15% this week 🎉";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
    >
      <h3 className="text-base font-semibold text-foreground mb-3">
        {isRTL ? "מגמות אחרונות" : "Recent Trends"}
      </h3>
      <button
        onClick={() => navigate("/app/patterns")}
        className="w-full rounded-2xl p-4 shadow-card text-start transition-transform active:scale-[0.98]"
        style={{ backgroundColor: "hsl(350 50% 95%)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: "hsl(350 45% 88%)" }}
          >
            <TrendingDown className="h-4.5 w-4.5" style={{ color: "hsl(350 50% 45%)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground leading-relaxed">
              {narrativeInsight || defaultInsight}
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-2">
              {isRTL ? "צפה בתובנות" : "View insights"}
              <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </button>
    </motion.div>
  );
};

export default InsightsSection;
