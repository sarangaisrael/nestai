import { Card } from "@/components/ui/card";
import { Compass } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface NarrativeShiftProps {
  from: string;
  to: string;
  story: string;
}

const NarrativeShiftCard = ({ from, to, story }: NarrativeShiftProps) => {
  const { isRTL } = useLanguage();

  if (!story) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <Card className="relative overflow-hidden p-5 border-0 rounded-3xl bg-card shadow-sm">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-secondary/10">
              <Compass className="h-4 w-4 text-secondary-foreground" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {isRTL ? "שינוי מגמה" : "Narrative Shift"}
            </h3>
          </div>

          {/* From → To pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
              {from}
            </span>
            <span className="text-muted-foreground text-xs">
              {isRTL ? "←" : "→"}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
              {to}
            </span>
          </div>

          {/* Narrative story */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {story}
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default NarrativeShiftCard;
