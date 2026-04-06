import { Card } from "@/components/ui/card";
import { TrendingDown, TrendingUp, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface ShiftCardProps {
  previousTopTheme?: string;
  currentTopTheme?: string;
  stressChange?: number; // percentage, negative = decrease
  sparklineData?: number[];
}

const ShiftCard = ({ previousTopTheme, currentTopTheme, stressChange = -15, sparklineData }: ShiftCardProps) => {
  const { t, isRTL } = useLanguage();

  const defaultSparkline = [65, 60, 72, 55, 48, 52, 45];
  const data = (sparklineData || defaultSparkline).map((v, i) => ({ value: v, index: i }));

  const isDecrease = stressChange <= 0;
  const absChange = Math.abs(stressChange);

  const previousTheme = previousTopTheme || (isRTL ? 'קריירה' : 'Career');
  const currentTheme = currentTopTheme || (isRTL ? 'זוגיות' : 'Relationship');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      <Card className="relative overflow-hidden p-5 border-0 rounded-3xl glass-card tech-border shadow-card">
        {/* Glassmorphism decorative elements */}
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary/5 blur-2xl" />
        <div className="absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-secondary/5 blur-2xl" />

        <div className="relative space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-primary/10">
              {isDecrease ? (
                <TrendingDown className="h-5 w-5 text-primary" />
              ) : (
                <TrendingUp className="h-5 w-5 text-destructive" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {t.dashboard.shiftTitle}
            </h3>
          </div>

          {/* Theme shift */}
          <div className="flex items-center gap-2 text-sm">
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground font-medium">
              {previousTheme}
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {currentTheme}
            </span>
          </div>

          {/* Insight text */}
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t.dashboard.shiftInsight
              .replace('{previousTheme}', previousTheme)
              .replace('{currentTheme}', currentTheme)
              .replace('{change}', String(absChange))
              .replace('{direction}', isDecrease ? t.dashboard.decreased : t.dashboard.increased)
            }
          </p>

          {/* Sparkline */}
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="shiftGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#shiftGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default ShiftCard;
