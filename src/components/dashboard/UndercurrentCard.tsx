import { Card } from "@/components/ui/card";
import { Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface UndercurrentCardProps {
  text: string;
}

const UndercurrentCard = ({ text }: UndercurrentCardProps) => {
  const { isRTL } = useLanguage();

  if (!text) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
    >
      <Card className="relative overflow-hidden p-5 border-0 rounded-3xl bg-muted/30 shadow-none">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {isRTL ? "מתחת לפני השטח" : "Beneath the Surface"}
            </h3>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed italic">
            "{text}"
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default UndercurrentCard;
