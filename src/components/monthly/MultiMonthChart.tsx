import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
} from "recharts";

interface MonthLine {
  label: string;
  data: { weekLabel: string; score: number }[];
}

interface MultiMonthChartProps {
  months: MonthLine[];
}

const MONTH_COLORS = [
  { stroke: "hsl(175, 55%, 45%)", fill: "hsl(175, 55%, 45%)" },
  { stroke: "hsl(260, 55%, 60%)", fill: "hsl(260, 55%, 60%)" },
  { stroke: "hsl(340, 60%, 60%)", fill: "hsl(340, 60%, 60%)" },
];

const MultiMonthChart = ({ months }: MultiMonthChartProps) => {
  const { t, isRTL } = useLanguage();

  if (months.length === 0) return null;

  // Merge data: weeks as x axis, one key per month
  const maxWeeks = Math.max(...months.map((m) => m.data.length));
  const chartData = Array.from({ length: maxWeeks }, (_, wi) => {
    const row: Record<string, any> = {
      name: `${isRTL ? "שבוע" : "Week"} ${wi + 1}`,
    };
    months.forEach((m, mi) => {
      row[m.label] = m.data[wi]?.score ?? null;
    });
    return row;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-5 border border-border bg-card/80 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t.summary.compareMonths}</h3>
            <p className="text-xs text-muted-foreground">{t.summary.quickGlanceDesc}</p>
          </div>
        </div>

        <div className="w-full h-48 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
              <defs>
                {months.map((m, i) => (
                  <linearGradient key={m.label} id={`mmg-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={MONTH_COLORS[i % MONTH_COLORS.length].fill} stopOpacity={0.3 - i * 0.08} />
                    <stop offset="100%" stopColor={MONTH_COLORS[i % MONTH_COLORS.length].fill} stopOpacity={0.03} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[1, 5]}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                }}
                formatter={(value: number, name: string) => [`${value} / 5`, name]}
              />
              {months.map((m, i) => (
                <Area
                  key={m.label}
                  type="monotone"
                  dataKey={m.label}
                  stroke={MONTH_COLORS[i % MONTH_COLORS.length].stroke}
                  strokeWidth={i === 0 ? 2.5 : 1.5}
                  strokeDasharray={i > 0 ? "5 3" : undefined}
                  fill={`url(#mmg-${i})`}
                  dot={{ fill: MONTH_COLORS[i % MONTH_COLORS.length].stroke, r: i === 0 ? 4 : 3, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: MONTH_COLORS[i % MONTH_COLORS.length].stroke }}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground flex-wrap">
          {months.map((m, i) => (
            <div key={m.label} className="flex items-center gap-1.5">
              <span
                className="w-3 h-0.5 rounded-full"
                style={{
                  backgroundColor: MONTH_COLORS[i % MONTH_COLORS.length].stroke,
                  ...(i > 0 ? { borderBottom: "1px dashed", opacity: 0.7 } : {}),
                }}
              />
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default MultiMonthChart;
