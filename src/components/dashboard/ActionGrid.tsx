import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, TrendingUp, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const ActionGrid = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const tiles = [
    {
      label: isRTL ? "היומן שלי" : "My Journal",
      icon: BookOpen,
      bg: "hsl(150 40% 92%)",
      iconColor: "hsl(150 45% 40%)",
      path: "/app/journal",
    },
    {
      label: isRTL ? "סיכומים שבועיים" : "Weekly Summaries",
      icon: FileText,
      bg: "hsl(45 70% 90%)",
      iconColor: "hsl(40 60% 40%)",
      path: "/app/summary",
    },
    {
      label: isRTL ? "מגמות חודשיות" : "Monthly Trends",
      icon: TrendingUp,
      bg: "hsl(200 50% 92%)",
      iconColor: "hsl(200 55% 40%)",
      path: "/app/monthly-summary",
    },
    {
      label: isRTL ? "כלים טיפוליים" : "Therapeutic Tools",
      icon: Sparkles,
      bg: "hsl(270 40% 92%)",
      iconColor: "hsl(270 45% 45%)",
      path: "/app/meditation",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {tiles.map((tile, i) => (
        <motion.button
          key={tile.path}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 + i * 0.05 }}
          onClick={() => navigate(tile.path)}
          className="flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl shadow-card transition-transform active:scale-[0.97]"
          style={{ backgroundColor: tile.bg }}
        >
          <tile.icon className="h-7 w-7" style={{ color: tile.iconColor }} />
          <span className="text-sm font-medium text-foreground">{tile.label}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default ActionGrid;
