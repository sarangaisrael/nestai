import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export type Timeframe = 1 | 2 | 3;

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (v: Timeframe) => void;
}

const TimeframeSelector = ({ value, onChange }: TimeframeSelectorProps) => {
  const { t } = useLanguage();

  const options: { label: string; value: Timeframe }[] = [
    { label: t.summary.timeframe1Month, value: 1 },
    { label: t.summary.timeframe2Months, value: 2 },
    { label: t.summary.timeframe3Months, value: 3 },
  ];

  return (
    <div className="flex items-center justify-center">
      <div className="relative inline-flex items-center gap-1 p-1 rounded-2xl bg-muted/60 border border-border/40">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="relative z-10 px-4 py-2 rounded-xl text-xs font-medium transition-colors duration-200"
            style={{
              color: value === opt.value
                ? 'hsl(var(--primary-foreground))'
                : 'hsl(var(--muted-foreground))',
            }}
          >
            {value === opt.value && (
              <motion.div
                layoutId="timeframe-pill"
                className="absolute inset-0 rounded-xl bg-primary shadow-sm"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeframeSelector;
