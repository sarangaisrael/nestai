import { Card } from "@/components/ui/card";
import { Quote } from "lucide-react";
import { motion } from "framer-motion";

interface KeyInsightQuoteProps {
  insight: string;
}

const KeyInsightQuote = ({ insight }: KeyInsightQuoteProps) => {
  if (!insight) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
    >
      <Card className="relative overflow-hidden p-6 border-0 rounded-3xl bg-primary/[0.04] shadow-none">
        <div className="absolute top-4 right-5 opacity-10">
          <Quote className="h-10 w-10 text-primary" />
        </div>
        <div className="relative space-y-3">
          <p className="text-base font-medium text-foreground leading-relaxed pr-8">
            {insight}
          </p>
          <div className="w-10 h-0.5 rounded-full bg-primary/30" />
        </div>
      </Card>
    </motion.div>
  );
};

export default KeyInsightQuote;
