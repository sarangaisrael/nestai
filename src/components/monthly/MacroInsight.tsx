import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface MacroInsightProps {
  narrative: string;
}

const MacroInsight = ({ narrative }: MacroInsightProps) => {
  const { t } = useLanguage();

  if (!narrative) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="p-5 border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t.summary.macroInsight}</h3>
            <p className="text-xs text-muted-foreground">{t.summary.macroInsightDesc}</p>
          </div>
        </div>

        <p className="text-sm text-foreground/80 leading-relaxed italic">
          {narrative}
        </p>
      </Card>
    </motion.div>
  );
};

export default MacroInsight;
