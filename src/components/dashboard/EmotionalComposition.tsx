import { Card } from "@/components/ui/card";
import { Layers } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Area, AreaChart, ResponsiveContainer, XAxis, Tooltip } from "recharts";

interface EmotionalCompositionProps {
  emotions: { emotion: string; count: number }[];
}

const EMOTION_HSL: Record<string, string> = {
  'חרדה': 'var(--emotion-anxious)', 'לחץ': 'var(--emotion-anxious)',
  'שמחה': 'var(--emotion-happy)', 'אושר': 'var(--emotion-happy)',
  'עצב': 'var(--emotion-sad)', 'עצוב': 'var(--emotion-sad)',
  'עייפות': 'var(--emotion-tired)', 'עייף': 'var(--emotion-tired)',
  'כעס': 'var(--emotion-angry)',
  'רוגע': 'var(--emotion-calm)', 'רגוע': 'var(--emotion-calm)',
  'אהבה': 'var(--emotion-love)',
  'פחד': 'var(--emotion-fear)',
  'anxiety': 'var(--emotion-anxious)', 'stress': 'var(--emotion-anxious)',
  'happy': 'var(--emotion-happy)', 'joy': 'var(--emotion-happy)',
  'sad': 'var(--emotion-sad)', 'sadness': 'var(--emotion-sad)',
  'tired': 'var(--emotion-tired)', 'fatigue': 'var(--emotion-tired)',
  'angry': 'var(--emotion-angry)', 'anger': 'var(--emotion-angry)',
  'calm': 'var(--emotion-calm)', 'peaceful': 'var(--emotion-calm)',
  'love': 'var(--emotion-love)',
  'fear': 'var(--emotion-fear)',
};

const FALLBACK_COLORS = [
  '210 60% 35%', '175 60% 50%', '260 55% 60%', '160 45% 50%', '45 90% 55%', '340 60% 60%',
];

const getColor = (emotion: string, idx: number): string => {
  const key = emotion.toLowerCase().trim();
  const v = EMOTION_HSL[key];
  return v ? v : FALLBACK_COLORS[idx % FALLBACK_COLORS.length];
};

const EmotionalComposition = ({ emotions }: EmotionalCompositionProps) => {
  const { t, isRTL } = useLanguage();

  if (!emotions || emotions.length === 0) return null;

  const total = emotions.reduce((s, e) => s + e.count, 0);
  const top = emotions.slice(0, 5);

  // Build stacked area data (simulate weekly distribution)
  const weeks = isRTL ? ['שבוע 1', 'שבוע 2', 'שבוע 3', 'שבוע 4'] : ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
  const chartData = weeks.map((w, wi) => {
    const row: Record<string, any> = { week: w };
    top.forEach((e) => {
      // Create organic variation
      const base = e.count;
      const variation = Math.round(base * (0.6 + Math.random() * 0.8));
      row[e.emotion] = variation;
    });
    return row;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
    >
      <Card className="relative overflow-hidden p-5 border-0 rounded-3xl glass-card tech-border shadow-card">
        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-accent/5 blur-2xl" />

        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-accent/10">
              <Layers className="h-5 w-5 text-accent" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {t.dashboard.emotionalMix}
            </h3>
          </div>

          {/* Stacked Area Chart */}
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  {top.map((e, i) => {
                    const colorVar = getColor(e.emotion, i);
                    return (
                      <linearGradient key={e.emotion} id={`ec-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={`hsl(${colorVar})`} stopOpacity={0.6} />
                        <stop offset="100%" stopColor={`hsl(${colorVar})`} stopOpacity={0.1} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                {top.map((e, i) => {
                  const colorVar = getColor(e.emotion, i);
                  return (
                    <Area
                      key={e.emotion}
                      type="monotone"
                      dataKey={e.emotion}
                      stackId="1"
                      stroke={`hsl(${colorVar})`}
                      fill={`url(#ec-${i})`}
                      strokeWidth={1.5}
                    />
                  );
                })}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Emotion bubbles */}
          <div className="flex flex-wrap gap-2">
            {top.map((e, i) => {
              const colorVar = getColor(e.emotion, i);
              const pct = Math.round((e.count / total) * 100);
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{
                    backgroundColor: `hsl(${colorVar} / 0.1)`,
                    borderColor: `hsl(${colorVar} / 0.2)`,
                    color: `hsl(${colorVar})`,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: `hsl(${colorVar})` }} />
                  {e.emotion} {pct}%
                </span>
              );
            })}
          </div>

          {/* Subsurface insight */}
          <div className="p-3 rounded-2xl bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed italic">
              {t.dashboard.subsurfaceInsight}
            </p>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default EmotionalComposition;
