import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface ActionableStepProps {
  customText?: string;
}

const ActionableStep = ({ customText }: ActionableStepProps) => {
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
    >
      <Card className="relative overflow-hidden border-0 rounded-3xl glass-card tech-border shadow-card bg-gradient-to-br from-primary/8 via-transparent to-secondary/8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-3xl pointer-events-none" />
        <div className="relative p-5">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-primary/15 shrink-0 mt-0.5">
              <Lightbulb className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-foreground">
                {t.dashboard.actionableTitle}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {customText || t.dashboard.actionableInsight}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ActionableStep;
