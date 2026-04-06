import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowRight, Copy, Sparkles, ChevronDown, ChevronUp,
  Heart, Brain, Shield, Lightbulb, Flame, Quote, Share2, CheckCircle2, Activity,
  TrendingUp, RefreshCw, MessageCircleQuestion, FileDown, Loader2, Search,
} from "lucide-react";
import AddToHomeBanner from "@/components/AddToHomeBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/AppHeader";
import BackButton from "@/components/BackButton";

import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar,
} from "recharts";
import TimeframeSelector, { type Timeframe } from "@/components/monthly/TimeframeSelector";
import TrendKPIs from "@/components/monthly/TrendKPIs";
import MacroInsight from "@/components/monthly/MacroInsight";
import SideBySideComparison from "@/components/monthly/SideBySideComparison";
import MultiMonthChart from "@/components/monthly/MultiMonthChart";
import { AnimatePresence, motion } from "framer-motion";
import { generateTherapistPdf } from "@/lib/generateTherapistPdf";
import { getThemeLabels, categorizeIntoThemes } from "@/lib/themeCategories";


// ─── Types ───────────────────────────────────────────────────

interface MonthlySummaryData {
  id: string;
  month_start: string;
  month_end: string;
  summary_text: string;
  created_at: string;
  viewed_at: string | null;
}

interface EmotionRating {
  rating: number;
  created_at: string;
  week_start: string;
}

interface WritingMessage {
  text: string;
  created_at: string;
}

// Hebrew sentiment keywords for writing-based mood analysis
const POSITIVE_KEYWORDS = [
  "שמח", "שמחה", "אושר", "מאושר", "טוב", "נהדר", "מצוין", "תקווה", "אופטימי",
  "רגוע", "רגועה", "שלווה", "נינוח", "הצלחה", "גאה", "אהבה", "חיובי", "כיף",
  "מרגיש טוב", "יהיה בסדר", "מאמין", "מאמינה", "שקט", "נעים", "מרוצה",
  "הקלה", "חופש", "חופשי", "ביטחון", "בטוח", "בטוחה", "מחובר", "מחוברת",
  "גדלתי", "התקדמתי", "למדתי", "הבנתי", "הצלחתי", "התמודדתי", "חזק", "חזקה",
  "מעניין", "מרגש", "אסיר תודה", "תודה", "מודה", "ברכה", "נהניתי", "כייף",
  "שלום", "סיפוק", "מלא", "מלאה", "עשיר", "עשירה", "משמעותי", "משמעות",
  "צמיחה", "התחדשות", "אנרגיה", "מוטיבציה", "השראה", "יצירתיות",
  "חיוך", "צחוק", "הומור", "קל", "קלה", "פשוט", "זורם", "זורמת",
];
const NEGATIVE_KEYWORDS = [
  "עצוב", "עצובה", "עצב", "דמעות", "מדוכא", "לחוץ", "לחוצה", "לחץ", "מתח",
  "עייף", "עייפה", "מותש", "כועס", "כועסת", "כעס", "עצבני", "מתוסכל",
  "חרד", "חרדה", "פחד", "מפחד", "דאגה", "מודאג", "בודד", "בודדה", "קשה",
  "נורא", "גרוע", "כואב", "סובל", "סובלת", "ייאוש", "חסר תקווה", "עומס",
  "מבולבל", "מבולבלת", "בלבול", "אכזבה", "מאוכזב", "מאוכזבת", "אשמה", "אשם",
  "חרטה", "מתחרט", "חנוק", "חנוקה", "לכוד", "לכודה", "תקוע", "תקועה",
  "שחוק", "שחוקה", "שבור", "שבורה", "ריק", "ריקה", "חלש", "חלשה",
  "מותקף", "מאוים", "חסר אונים", "חסרת אונים", "מנותק", "מנותקת",
  "כאב", "סבל", "בכי", "דיכאון", "חוסר שינה", "נדודי שינה", "מתוח",
  "אגרסיבי", "אגרסיבית", "שנאה", "קנאה", "בושה", "מביך", "נבוך",
];

function computeWritingSentiment(messages: WritingMessage[]): { weekLabel: string; score: number }[] {
  if (messages.length === 0) return [];

  // Group messages by week
  const weekMap = new Map<string, string[]>();
  messages.forEach(m => {
    const d = new Date(m.created_at);
    // Get week start (Sunday)
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().split('T')[0];
    if (!weekMap.has(key)) weekMap.set(key, []);
    weekMap.get(key)!.push(m.text);
  });

  const sorted = Array.from(weekMap.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return sorted.map(([_, texts], idx) => {
    const combined = texts.join(" ").toLowerCase();
    let posCount = 0;
    let negCount = 0;

    POSITIVE_KEYWORDS.forEach(kw => {
      const matches = combined.match(new RegExp(kw, "gi"));
      if (matches) posCount += matches.length;
    });
    NEGATIVE_KEYWORDS.forEach(kw => {
      const matches = combined.match(new RegExp(kw, "gi"));
      if (matches) negCount += matches.length;
    });

    const total = posCount + negCount;
    // Convert to 1-5 scale: neutral = 3, fully positive = 5, fully negative = 1
    let score = 3;
    if (total > 0) {
      const ratio = (posCount - negCount) / total; // -1 to 1
      score = 3 + ratio * 2; // 1 to 5
    }
    return { weekLabel: `${idx + 1}`, score: Math.round(score * 10) / 10 };
  });
}

// Behavioral action keywords for detecting growth-oriented actions
const BEHAVIORAL_ACTIONS: { keyword: string; labelHe: string; labelEn: string; category: 'growth' | 'consistency' | 'boundary' }[] = [
  { keyword: "גבולות", labelHe: "הצבת גבולות", labelEn: "Setting Boundaries", category: 'boundary' },
  { keyword: "עמדתי על", labelHe: "עמידה על שלי", labelEn: "Standing My Ground", category: 'boundary' },
  { keyword: "סירבתי", labelHe: "סירוב בריא", labelEn: "Healthy Refusal", category: 'boundary' },
  { keyword: "אמרתי לא", labelHe: "אמרתי לא", labelEn: "Said No", category: 'boundary' },
  { keyword: "טיפול", labelHe: "המשכיות בטיפול", labelEn: "Therapy Consistency", category: 'consistency' },
  { keyword: "מטפל", labelHe: "שיחה עם מטפל", labelEn: "Therapist Session", category: 'consistency' },
  { keyword: "הליכה", labelHe: "פעילות גופנית", labelEn: "Physical Activity", category: 'growth' },
  { keyword: "אימון", labelHe: "אימון", labelEn: "Workout", category: 'growth' },
  { keyword: "כושר", labelHe: "חדר כושר", labelEn: "Gym", category: 'growth' },
  { keyword: "קורס", labelHe: "למידה והשתלמות", labelEn: "Learning & Development", category: 'growth' },
  { keyword: "נרשמתי", labelHe: "הרשמה לפעילות", labelEn: "Signed Up", category: 'growth' },
  { keyword: "שיתפתי", labelHe: "שיתוף ופתיחות", labelEn: "Sharing & Openness", category: 'growth' },
  { keyword: "לשתף", labelHe: "רצון לשתף", labelEn: "Desire to Share", category: 'growth' },
  { keyword: "דיברתי", labelHe: "שיחה פתוחה", labelEn: "Open Conversation", category: 'growth' },
  { keyword: "גאווה", labelHe: "גאווה עצמית", labelEn: "Self-Pride", category: 'growth' },
  { keyword: "הצלחתי", labelHe: "הצלחה אישית", labelEn: "Personal Achievement", category: 'growth' },
  { keyword: "התמודדתי", labelHe: "התמודדות אקטיבית", labelEn: "Active Coping", category: 'growth' },
  { keyword: "מדיטציה", labelHe: "מדיטציה", labelEn: "Meditation", category: 'consistency' },
  { keyword: "כתיבה", labelHe: "התמדה בכתיבה", labelEn: "Journaling Consistency", category: 'consistency' },
];

interface BehavioralShift {
  label: string;
  count: number;
  prevCount: number;
  category: 'growth' | 'consistency' | 'boundary';
  trend: 'improvement' | 'maintaining' | 'focus';
}

function detectBehavioralShifts(
  currentMsgs: WritingMessage[],
  prevMsgs: WritingMessage[],
  isRTL: boolean,
): BehavioralShift[] {
  const currentText = currentMsgs.map(m => m.text).join(' ').toLowerCase();
  const prevText = prevMsgs.map(m => m.text).join(' ').toLowerCase();

  const results: BehavioralShift[] = [];
  for (const action of BEHAVIORAL_ACTIONS) {
    const currentCount = (currentText.match(new RegExp(action.keyword, 'gi')) || []).length;
    const prevCount = (prevText.match(new RegExp(action.keyword, 'gi')) || []).length;

    if (currentCount > 0 || prevCount > 0) {
      let trend: 'improvement' | 'maintaining' | 'focus' = 'maintaining';
      if (currentCount > prevCount) trend = 'improvement';
      else if (currentCount < prevCount && prevCount > 0) trend = 'focus';

      results.push({
        label: isRTL ? action.labelHe : action.labelEn,
        count: currentCount,
        prevCount,
        category: action.category,
        trend,
      });
    }
  }

  // Sort: improvements first, then maintaining, then focus
  const order = { improvement: 0, maintaining: 1, focus: 2 };
  return results.sort((a, b) => order[a.trend] - order[b.trend]).slice(0, 6);
}

interface EmotionPeriod {
  monthName: string;
  dominantEmotions: string[];
  intensity: "low" | "medium" | "high";
}

interface SemanticShift {
  keyword: string;
  shift: string;
}

interface InsightsReport {
  emotionComparison?: {
    summary: string;
    periods: EmotionPeriod[];
  };
  semanticShifts?: SemanticShift[];
  longTermPatterns?: string;
  sessionQuestions?: string[];
  rawText?: string;
}

function parseReport(summaryText: string): InsightsReport | null {
  try {
    const parsed = JSON.parse(summaryText);
    if (parsed.emotionComparison || parsed.rawText) return parsed;
    return null;
  } catch {
    return { rawText: summaryText };
  }
}

// ─── Constants ───────────────────────────────────────────────

const PASTEL = {
  blue: "hsl(220, 70%, 75%)",
  purple: "hsl(280, 60%, 78%)",
  pink: "hsl(340, 65%, 78%)",
  teal: "hsl(160, 55%, 72%)",
  peach: "hsl(30, 70%, 78%)",
  sky: "hsl(200, 60%, 75%)",
  green: "hsl(120, 45%, 72%)",
};

const PASTEL_LIST = Object.values(PASTEL);

const INSIGHT_ICONS = [
  Heart, Brain, Shield, Lightbulb, Flame, RefreshCw, Sparkles,
];

// ─── Helpers ─────────────────────────────────────────────────

/** Extract key themes from plain text as concise insight cards */
function extractInsights(text: string): { icon: number; keyword: string; insight: string }[] {
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 30);

  return paragraphs.slice(0, 4).map((para, idx) => {
    const sentences = para.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 0);
    const firstSentence = sentences[0] || "";

    // Extract keyword: up to first comma/colon/dash, max 30 chars
    const keywordMatch = firstSentence.match(/^(.*?)(,|–|:|\s-\s)/);
    let keyword = keywordMatch
      ? keywordMatch[1].trim().substring(0, 30)
      : firstSentence.substring(0, 30);
    // Clean trailing dots/ellipsis
    keyword = keyword.replace(/[.…]+$/, '').trim();

    // Take first 1-2 sentences as insight, clean up
    let insight = sentences.slice(0, 2).join(". ").trim();
    // Remove trailing dots/ellipsis and add proper period
    insight = insight.replace(/[.…]+$/, '').trim();
    // Add period if missing
    if (insight && !/[.!?]$/.test(insight)) {
      insight += ".";
    }

    return { icon: idx, keyword, insight };
  });
}

/** Extract session-prep bullet points from text */
function extractSessionPoints(text: string): string[] {
  // Look for common patterns: questions, recommendations, action items
  const sentences = text.split(/[.!?]/).map(s => s.trim()).filter(s => s.length > 15);

  // Prioritize sentences with question words or action language
  const actionSentences = sentences.filter(s =>
    /למה|איך|מה|האם|לנסות|לשים לב|להתמודד|לחשוב|להעלות|אפשר/i.test(s)
  );

  if (actionSentences.length >= 2) {
    return actionSentences.slice(0, 3);
  }

  // Fallback: take last 2-3 meaningful sentences (usually conclusions)
  return sentences.slice(-3);
}

/** Build a short narrative quote from text */
function extractNarrative(text: string): string {
  const paragraphs = text.split(/\n\n+/).map(p => p.trim()).filter(p => p.length > 30);
  const conclusion = paragraphs[paragraphs.length - 1] || text;
  return conclusion.replace(/[…]+/g, '.').trim();
}

/** Build therapist-friendly summary from text */
function buildTherapistSummary(text: string, monthLabel: string): string {
  const insights = extractInsights(text);
  const points = extractSessionPoints(text);
  const narrative = extractNarrative(text);

  let result = `📋 סיכום חודשי — ${monthLabel}\n\n`;

  if (insights.length > 0) {
    result += "🔑 תובנות מפתח:\n";
    insights.forEach(i => {
      result += `• ${i.keyword}: ${i.insight}\n`;
    });
    result += "\n";
  }

  if (points.length > 0) {
    result += "💬 נקודות למפגש:\n";
    points.forEach(p => {
      result += `• ${p}\n`;
    });
    result += "\n";
  }

  result += `📝 סיכום:\n${narrative}`;
  return result;
}

// ─── Sub-components ──────────────────────────────────────────

/** Section 1: Emotion ratings chart (now with writing sentiment) */
const EmotionChart = ({
  ratings,
  writingSentiment,
  t,
  isRTL,
}: {
  ratings: EmotionRating[];
  writingSentiment: { weekLabel: string; score: number }[];
  t: any;
  isRTL: boolean;
}) => {
  const chartData = useMemo(() => {
    const ratingsSorted = [...ratings]
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const maxWeeks = Math.max(ratingsSorted.length, writingSentiment.length);
    if (maxWeeks === 0) return [];

    return Array.from({ length: maxWeeks }, (_, idx) => ({
      name: `${isRTL ? 'שבוע' : 'Week'} ${idx + 1}`,
      rating: ratingsSorted[idx]?.rating ?? null,
      writing: writingSentiment[idx]?.score ?? null,
    }));
  }, [ratings, writingSentiment, isRTL]);

  if (chartData.length === 0) return null;

  const ratingValues = chartData.filter(d => d.rating !== null).map(d => d.rating!);
  const writingValues = chartData.filter(d => d.writing !== null).map(d => d.writing!);

  const ratingAvg = ratingValues.length > 0
    ? Math.round(ratingValues.reduce((s, v) => s + v, 0) / ratingValues.length * 10) / 10
    : null;
  const writingAvg = writingValues.length > 0
    ? Math.round(writingValues.reduce((s, v) => s + v, 0) / writingValues.length * 10) / 10
    : null;

  const overallAvg = (() => {
    const vals = [ratingAvg, writingAvg].filter((v): v is number => v !== null);
    if (vals.length === 0) return 3;
    return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length * 10) / 10;
  })();

  const trend = (() => {
    const last = chartData[chartData.length - 1];
    const first = chartData[0];
    const lastVal = last.rating ?? last.writing ?? 0;
    const firstVal = first.rating ?? first.writing ?? 0;
    return lastVal - firstVal;
  })();

  const moodEmoji = overallAvg >= 4 ? '😊' : overallAvg >= 3 ? '🙂' : overallAvg >= 2 ? '😐' : '😔';

  return (
    <Card className="p-5 border border-border bg-card/80 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t.summary.quickGlance}</h3>
          <p className="text-xs text-muted-foreground">{t.summary.quickGlanceDesc}</p>
        </div>
      </div>

      {/* Quick stats row */}
      <div className="flex gap-3">
        <div className="flex-1 p-3 rounded-xl bg-muted/30 text-center">
          <p className="text-2xl font-bold text-foreground">
            {moodEmoji}{' '}
            <span>{overallAvg}</span>
            <span className="text-xs font-normal text-muted-foreground"> / 5</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t.summary.mood}</p>
        </div>
        <div className="flex-1 p-3 rounded-xl bg-muted/30 text-center">
          <p className={`text-2xl font-bold ${trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-rose-500' : 'text-muted-foreground'}`}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t.summary.moodTrend}</p>
        </div>
        <div className="flex-1 p-3 rounded-xl bg-muted/30 text-center">
          <p className="text-2xl font-bold text-foreground">{chartData.length}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t.summary.weeklyComparison}</p>
        </div>
      </div>

      {/* Area chart with both lines */}
      <div className="w-full h-44 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PASTEL.teal} stopOpacity={0.4} />
                <stop offset="100%" stopColor={PASTEL.teal} stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="writingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PASTEL.purple} stopOpacity={0.3} />
                <stop offset="100%" stopColor={PASTEL.purple} stopOpacity={0.05} />
              </linearGradient>
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
              formatter={(value: number, name: string) => [
                `${value} / 5`,
                name === 'rating'
                  ? (isRTL ? 'דירוג רגשות' : 'Emotion rating')
                  : (isRTL ? 'מצב רוח מהכתיבה' : 'Writing mood'),
              ]}
            />
            {ratingValues.length > 0 && (
              <Area
                type="monotone"
                dataKey="rating"
                stroke={PASTEL.teal}
                strokeWidth={2.5}
                fill="url(#ratingGradient)"
                dot={{ fill: PASTEL.teal, r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: PASTEL.teal }}
                connectNulls
              />
            )}
            {writingValues.length > 0 && (
              <Area
                type="monotone"
                dataKey="writing"
                stroke={PASTEL.purple}
                strokeWidth={2.5}
                strokeDasharray="5 3"
                fill="url(#writingGradient)"
                dot={{ fill: PASTEL.purple, r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: PASTEL.purple }}
                connectNulls
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
        {ratingValues.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: PASTEL.teal }} />
            <span>{isRTL ? 'דירוג רגשות' : 'Emotion rating'}</span>
          </div>
        )}
        {writingValues.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 rounded-full border-b border-dashed" style={{ borderColor: PASTEL.purple }} />
            <span>{isRTL ? 'ניתוח כתיבה' : 'Writing analysis'}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

/** Section 2: Insights as plain text */
const InsightCards = ({
  insights,
  t,
  isRTL,
}: {
  insights: { icon: number; keyword: string; insight: string }[];
  t: any;
  isRTL: boolean;
}) => {
  if (insights.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Lightbulb className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t.summary.keyInsights}</h3>
          <p className="text-xs text-muted-foreground">{t.summary.keyInsightsDesc}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm text-foreground/80 leading-relaxed">
        {insights.map((item, idx) => (
          <p key={idx}>{item.insight}</p>
        ))}
      </div>
    </div>
  );
};

/** Section 3: Look Ahead — actionable items */
const SessionTopics = ({
  points,
  t,
}: {
  points: string[];
  t: any;
}) => {
  if (points.length === 0) return null;

  return (
    <Card className="p-5 border border-primary/20 bg-primary/5 space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t.summary.sessionTopics}</h3>
          <p className="text-xs text-muted-foreground">{t.summary.sessionTopicsDesc}</p>
        </div>
      </div>

      <div className="space-y-2">
        {points.map((point, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 rounded-xl bg-background/80 border border-border/30"
            dir="rtl"
          >
            <span
              className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 bg-primary/15"
            >
              <Sparkles className="h-3 w-3 text-primary" />
            </span>
            <p className="text-sm text-foreground leading-relaxed">{point}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};

/** Section 5: Behavioral Shift Index */
const BehavioralShiftIndex = ({
  shifts,
  t,
  isRTL,
}: {
  shifts: BehavioralShift[];
  t: any;
  isRTL: boolean;
}) => {
  if (shifts.length === 0) return null;

  const badgeStyles = {
    improvement: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    maintaining: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    focus: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  };

  const badgeLabels = {
    improvement: t.summary.improvement,
    maintaining: t.summary.maintaining,
    focus: t.summary.focusArea,
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t.summary.behavioralChanges}</h3>
          <p className="text-xs text-muted-foreground">{t.summary.behavioralChangesDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {shifts.map((shift, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2.5 p-3 rounded-xl border border-border/40 bg-card/80"
          >
            <CheckCircle2
              className={`h-4 w-4 shrink-0 ${
                shift.trend === 'improvement' ? 'text-emerald-500' :
                shift.trend === 'maintaining' ? 'text-blue-500' : 'text-orange-500'
              }`}
            />
            <span className="text-sm text-foreground flex-1">{shift.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${badgeStyles[shift.trend]}`}>
              {badgeLabels[shift.trend]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/** Section 4: Narrative quote */
const NarrativeQuote = ({
  text,
  t,
}: {
  text: string;
  t: any;
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Quote className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground">{t.summary.narrativeSummary}</h3>
          <p className="text-xs text-muted-foreground">{t.summary.narrativeSummaryDesc}</p>
        </div>
      </div>

      <div className="relative p-5 rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/3 border border-primary/10">
        <Quote className="h-6 w-6 text-primary/20 absolute top-3 start-3" />
        <p className="text-sm text-foreground/80 leading-relaxed italic pt-4">
          {text}
        </p>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────

const MonthlySummary = () => {
  const [summaries, setSummaries] = useState<MonthlySummaryData[]>([]);
  const [emotionRatings, setEmotionRatings] = useState<EmotionRating[]>([]);
  const [writingMessages, setWritingMessages] = useState<WritingMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOlder, setExpandedOlder] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, dir, isRTL, language } = useLanguage();
  

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/app/auth");
        return;
      }

      // Fetch summaries, emotion ratings, and messages in parallel
      const [summaryResult, ratingsResult, messagesResult] = await Promise.all([
        supabase
          .from('monthly_summaries')
          .select('*')
          .eq('user_id', session.user.id)
          .order('month_start', { ascending: false }),
        supabase
          .from('weekly_emotion_ratings')
          .select('rating, created_at')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: true })
          .limit(20),
        supabase.functions.invoke('decrypt-messages'),
      ]);

      if (summaryResult.data) {
        setSummaries(summaryResult.data);
        const unviewed = summaryResult.data.filter(s => !s.viewed_at);
        if (unviewed.length > 0) {
          await supabase
            .from('monthly_summaries')
            .update({ viewed_at: new Date().toISOString() })
            .in('id', unviewed.map(s => s.id));
        }
      }

      if (ratingsResult.data) {
        setEmotionRatings(ratingsResult.data as EmotionRating[]);
      }

      // Store decrypted user messages for writing sentiment
      if (!messagesResult.error && messagesResult.data?.messages) {
        const userMsgs = messagesResult.data.messages
          .filter((m: any) => m.role === 'user')
          .map((m: any) => ({ text: m.text, created_at: m.created_at }));
        setWritingMessages(userMsgs);
      }

      setLoading(false);
    };

    fetchData();
  }, [navigate]);

  const formatMonthRange = (monthStart: string) => {
    const date = new Date(monthStart);
    return date.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US', { month: 'long', year: 'numeric' });
  };

  const latestReport = useMemo(() => {
    if (summaries.length === 0) return null;
    return parseReport(summaries[0].summary_text);
  }, [summaries]);

  // For legacy text: extract relevant ratings for the summary's month
  const monthRatings = useMemo(() => {
    if (summaries.length === 0 || emotionRatings.length === 0) return [];
    const start = new Date(summaries[0].month_start);
    const end = new Date(summaries[0].month_end);
    return emotionRatings.filter(r => {
      const d = new Date(r.created_at);
      return d >= start && d <= end;
    });
  }, [summaries, emotionRatings]);

  // Fallback: if no month-specific ratings, use all recent ones
  const displayRatings = monthRatings.length >= 2 ? monthRatings : emotionRatings.slice(-6);

  // Compute writing-based sentiment for the month
  const writingSentiment = useMemo(() => {
    if (writingMessages.length === 0 || summaries.length === 0) return [];
    const start = new Date(summaries[0].month_start);
    const end = new Date(summaries[0].month_end);
    const monthMsgs = writingMessages.filter(m => {
      const d = new Date(m.created_at);
      return d >= start && d <= end;
    });
    if (monthMsgs.length === 0 && writingMessages.length > 0) {
      // Fallback: use last ~30 messages
      return computeWritingSentiment(writingMessages.slice(-30));
    }
    return computeWritingSentiment(monthMsgs);
  }, [writingMessages, summaries]);

  const latestInsights = useMemo(() => {
    if (!latestReport?.rawText) return [];
    return extractInsights(latestReport.rawText);
  }, [latestReport]);

  const sessionPoints = useMemo(() => {
    if (!latestReport?.rawText) return [];
    return extractSessionPoints(latestReport.rawText);
  }, [latestReport]);

  const narrative = useMemo(() => {
    if (!latestReport?.rawText) return "";
    return extractNarrative(latestReport.rawText);
  }, [latestReport]);

  // Behavioral shift detection
  const behavioralShifts = useMemo(() => {
    if (writingMessages.length === 0 || summaries.length === 0) return [];
    const start = new Date(summaries[0].month_start);
    const end = new Date(summaries[0].month_end);
    const currentMsgs = writingMessages.filter(m => {
      const d = new Date(m.created_at);
      return d >= start && d <= end;
    });
    const prevStart = new Date(start);
    prevStart.setMonth(prevStart.getMonth() - 3);
    const prevMsgs = writingMessages.filter(m => {
      const d = new Date(m.created_at);
      return d >= prevStart && d < start;
    });
    return detectBehavioralShifts(currentMsgs, prevMsgs, isRTL);
  }, [writingMessages, summaries, isRTL]);

  // ─── Multi-month comparison data ─────────────────────────────
  const multiMonthData = useMemo(() => {
    if (summaries.length === 0 || writingMessages.length === 0) return null;

    const getMonthBounds = (monthsBack: number) => {
      const ref = new Date(summaries[0].month_start);
      const start = new Date(ref);
      start.setMonth(start.getMonth() - monthsBack);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      return { start, end };
    };

    const getMsgsInRange = (start: Date, end: Date) =>
      writingMessages.filter(m => {
        const d = new Date(m.created_at);
        return d >= start && d < end;
      });

    // Word freq is no longer needed — themes are used instead

    // Current month
    const currBounds = getMonthBounds(0);
    const currMsgs = getMsgsInRange(currBounds.start, currBounds.end);
    const currSentiment = computeWritingSentiment(currMsgs);
    const currDays = new Set(currMsgs.map(m => new Date(m.created_at).toDateString())).size;

    // Previous month
    const prevBounds = getMonthBounds(1);
    const prevMsgs = getMsgsInRange(prevBounds.start, prevBounds.end);
    const prevSentiment = computeWritingSentiment(prevMsgs);
    const prevDays = new Set(prevMsgs.map(m => new Date(m.created_at).toDateString())).size;

    // Stress calculation from negative keywords
    const calcStress = (msgs: WritingMessage[]) => {
      const text = msgs.map(m => m.text).join(' ').toLowerCase();
      let negCount = 0;
      NEGATIVE_KEYWORDS.forEach(kw => {
        const matches = text.match(new RegExp(kw, 'gi'));
        if (matches) negCount += matches.length;
      });
      return msgs.length > 0 ? negCount / msgs.length : 0;
    };

    const currStress = calcStress(currMsgs);
    const prevStress = calcStress(prevMsgs);
    const stressChange = prevStress > 0
      ? Math.round(((currStress - prevStress) / prevStress) * 100)
      : 0;

    // Topic shifts using thematic categories
    const currThemes = categorizeIntoThemes(currMsgs.map(m => m.text), isRTL, 10);
    const prevThemes = categorizeIntoThemes(prevMsgs.map(m => m.text), isRTL, 10);

    const currThemeMap = new Map(currThemes.map(t => [t.id, t]));
    const prevThemeMap = new Map(prevThemes.map(t => [t.id, t]));

    const topicShifts: { topic: string; direction: 'fading' | 'strengthening'; change: number }[] = [];

    // Check strengthening themes
    currThemeMap.forEach((theme, id) => {
      const prevCount = prevThemeMap.get(id)?.count || 0;
      if (prevCount === 0 && theme.count >= 2) {
        topicShifts.push({ topic: `${theme.icon} ${theme.label}`, direction: 'strengthening', change: 100 });
      } else if (prevCount > 0) {
        const change = Math.round(((theme.count - prevCount) / prevCount) * 100);
        if (Math.abs(change) >= 30) {
          topicShifts.push({
            topic: `${theme.icon} ${theme.label}`,
            direction: change > 0 ? 'strengthening' : 'fading',
            change: Math.abs(change),
          });
        }
      }
    });

    // Check fading themes (present in prev but not in curr)
    prevThemeMap.forEach((theme, id) => {
      if (!currThemeMap.has(id) && theme.count >= 2 && topicShifts.length < 8) {
        topicShifts.push({ topic: `${theme.icon} ${theme.label}`, direction: 'fading', change: 100 });
      }
    });

    topicShifts.sort((a, b) => b.change - a.change);

    // Month chart lines
    const monthLines = [];
    for (let i = 0; i < timeframe; i++) {
      const bounds = getMonthBounds(i);
      const msgs = getMsgsInRange(bounds.start, bounds.end);
      const sentiment = computeWritingSentiment(msgs);
      const label = bounds.start.toLocaleDateString(
        language === 'he' ? 'he-IL' : 'en-US',
        { month: 'short', year: '2-digit' }
      );
      monthLines.push({ label, data: sentiment });
    }

    // Mood averages
    const avgScore = (sentiment: { score: number }[]) =>
      sentiment.length > 0
        ? Math.round(sentiment.reduce((s, v) => s + v.score, 0) / sentiment.length * 10) / 10
        : 3;

    // Macro narrative
    let macroNarrative = '';
    if (summaries.length >= 2) {
      const oldest = summaries[summaries.length - 1];
      const latest = summaries[0];
      const oldReport = parseReport(oldest.summary_text);
      const newReport = parseReport(latest.summary_text);
      if (oldReport?.rawText && newReport?.rawText) {
        const oldThemes = getThemeLabels(
          getMsgsInRange(new Date(oldest.month_start), new Date(oldest.month_end)).map(m => m.text), isRTL, 3
        );
        const newThemes = getThemeLabels(currMsgs.map(m => m.text), isRTL, 3);
        macroNarrative = isRTL
          ? `כשהתחלת לכתוב, הנושאים המרכזיים שלך היו "${oldThemes.join('", "')}" — היום המיקוד שלך עבר לכיוון "${newThemes.join('", "')}". זהו שינוי שמעיד על התפתחות וצמיחה.`
          : `When you started writing, your main themes were "${oldThemes.join('", "')}" — today your focus has shifted to "${newThemes.join('", "')}". This change reflects growth and development.`;
      }
    }

    return {
      stressChange,
      topicShifts,
      monthLines,
      macroNarrative,
      currentMonth: {
        label: formatMonthRange(summaries[0].month_start),
        moodAvg: avgScore(currSentiment),
        topWords: getThemeLabels(currMsgs.map(m => m.text), isRTL, 5),
        sessionCount: currDays,
      },
      previousMonth: {
        label: summaries.length > 1
          ? formatMonthRange(summaries[1].month_start)
          : (isRTL ? 'חודש קודם' : 'Previous'),
        moodAvg: avgScore(prevSentiment),
        topWords: getThemeLabels(prevMsgs.map(m => m.text), isRTL, 5),
        sessionCount: prevDays,
      },
    };
  }, [summaries, writingMessages, timeframe, isRTL, language]);

  const handleCopyForTherapist = () => {
    if (summaries.length === 0) return;
    const monthLabel = formatMonthRange(summaries[0].month_start);
    const text = latestReport?.rawText || summaries[0].summary_text;
    const formatted = buildTherapistSummary(text, monthLabel);

    navigator.clipboard.writeText(formatted);
    toast({
      title: t.summary.copiedForTherapist,
    });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: t.common.copied, description: t.summary.copiedToClipboard });
  };

  const [exportingPdf, setExportingPdf] = useState(false);



  const handleExportPdf = async () => {
    if (summaries.length === 0) return;

    setExportingPdf(true);
    try {
      const monthLabel = formatMonthRange(summaries[0].month_start);

      // Build executive summary
      let executiveSummary = "";
      if (latestReport?.emotionComparison?.summary) {
        executiveSummary = latestReport.emotionComparison.summary;
      } else if (latestReport?.rawText) {
        executiveSummary = latestReport.rawText;
      }

      // Mood data from writing sentiment
      const moodData = writingSentiment.map((ws, i) => ({
        week: `${isRTL ? "ש" : "W"}${i + 1}`,
        score: ws.score,
      }));

      // Top themes as thematic categories
      let topThemes: string[] = [];
      if (multiMonthData?.currentMonth?.topWords) {
        topThemes = multiMonthData.currentMonth.topWords;
      } else {
        // Fallback: categorize from writing messages
        const currBounds2 = new Date(summaries[0].month_start);
        const currEnd2 = new Date(summaries[0].month_end || summaries[0].month_start);
        currEnd2.setMonth(currEnd2.getMonth() + 1);
        const msgs = writingMessages.filter(m => {
          const d = new Date(m.created_at);
          return d >= currBounds2 && d < currEnd2;
        });
        topThemes = getThemeLabels(msgs.map(m => m.text), isRTL, 5);
      }

      // Therapeutic points
      let therapeuticPoints: string[] = [];
      if (latestReport?.sessionQuestions) {
        therapeuticPoints = latestReport.sessionQuestions;
      } else if (latestReport?.rawText) {
        therapeuticPoints = extractSessionPoints(latestReport.rawText);
      }

      // Get user's first name
      const { data: { user } } = await supabase.auth.getUser();
      let patientName = "";
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("user_id", user.id)
          .maybeSingle();
        patientName = profile?.first_name || "";
      }

      await generateTherapistPdf({
        patientName,
        dateRange: monthLabel,
        executiveSummary,
        moodData,
        topThemes,
        therapeuticPoints,
        isRTL,
      });

      toast({ title: t.summary.pdfExported });
    } catch (err) {
      console.error("PDF export error:", err);
      toast({ title: isRTL ? "שגיאה בייצוא" : "Export error", variant: "destructive" });
    } finally {
      setExportingPdf(false);
    }
  };

  const olderSummaries = summaries.slice(1);



  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <AppHeader />

      {/* Content */}
      <div className="px-4 pt-4">
        <BackButton />
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <AddToHomeBanner />

        <div className="text-center animate-in">
          <h1 className="text-2xl font-semibold text-foreground mb-1">{t.summary.monthlySummary}</h1>
          <p className="text-muted-foreground text-sm">{t.summary.visualOverview}</p>
        </div>

        {/* Timeframe Selector */}
        {summaries.length > 0 && !loading && (
          <TimeframeSelector value={timeframe} onChange={setTimeframe} />
        )}


        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-28 rounded-xl" />
              <Skeleton className="h-28 rounded-xl" />
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : summaries.length === 0 ? (
          <div className="text-center py-12 animate-slide-up px-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📊</span>
            </div>
            <h2 className="text-lg font-medium text-foreground mb-3">{t.summary.noMonthlySummaryYet}</h2>
            <p className="text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
              {t.summary.monthlySummaryInfo}
            </p>
          </div>
        ) : latestReport ? (
          <div className="space-y-6 animate-slide-up">
            {/* Month label */}
            <p className="text-sm text-muted-foreground text-center">
              {formatMonthRange(summaries[0].month_start)}
            </p>

            {/* ══════════════════════════════════════════════════════ */}
            {/* STRUCTURED JSON REPORT (new format)                   */}
            {/* ══════════════════════════════════════════════════════ */}
            {latestReport.emotionComparison ? (
              <>

                {/* Semantic Shifts as insight cards */}
                {latestReport.semanticShifts && latestReport.semanticShifts.length > 0 && (
                  <InsightCards
                    insights={latestReport.semanticShifts.map((s, idx) => ({
                      icon: idx,
                      keyword: s.keyword,
                      insight: s.shift,
                    }))}
                    t={t}
                    isRTL={isRTL}
                  />
                )}

                {/* Behavioral Shift Index */}
                <BehavioralShiftIndex shifts={behavioralShifts} t={t} isRTL={isRTL} />

              </>
            ) : latestReport.rawText ? (
              /* ══════════════════════════════════════════════════════ */
              /* LEGACY TEXT REPORT — visual extraction                */
              /* ══════════════════════════════════════════════════════ */
              <>

                {/* Part 2: Key insight cards */}
                <InsightCards insights={latestInsights} t={t} isRTL={isRTL} />

                {/* Part 3: Behavioral Shift Index */}
                <BehavioralShiftIndex shifts={behavioralShifts} t={t} isRTL={isRTL} />

              </>
            ) : null}

            {/* ══════════════════════════════════════════════════════ */}
            {/* MULTI-MONTH COMPARISON (new)                          */}
            {/* ══════════════════════════════════════════════════════ */}
            <AnimatePresence mode="wait">
              <motion.div
                key={timeframe}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Multi-month emotion chart */}
                {multiMonthData && timeframe > 1 && multiMonthData.monthLines.length > 1 && (
                  <MultiMonthChart months={multiMonthData.monthLines} />
                )}

                {/* Trend KPIs */}
                {multiMonthData && (multiMonthData.stressChange !== 0 || multiMonthData.topicShifts.length > 0) && (
                  <TrendKPIs
                    stressChange={multiMonthData.stressChange}
                    topicShifts={multiMonthData.topicShifts}
                  />
                )}

                {/* Side-by-side comparison */}
                {multiMonthData && multiMonthData.previousMonth.sessionCount > 0 && (
                  <SideBySideComparison
                    currentMonth={multiMonthData.currentMonth}
                    previousMonth={multiMonthData.previousMonth}
                  />
                )}

                {/* Macro AI insight */}
                {multiMonthData && multiMonthData.macroNarrative && timeframe >= 2 && (
                  <MacroInsight narrative={multiMonthData.macroNarrative} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Patterns & Insights CTA */}
            <Card
              className="p-4 border border-border bg-card/80 cursor-pointer hover:shadow-md transition-all rounded-2xl"
              onClick={() => navigate("/app/patterns")}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {isRTL ? "דפוסים ותובנות" : "Patterns & Insights"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "גלו דפוסים רגשיים מ-30 הימים האחרונים" : "Discover emotional patterns from the last 30 days"}
                  </p>
                </div>
                <ArrowRight className={`h-4 w-4 text-muted-foreground ${isRTL ? "rotate-180" : ""}`} />
              </div>
            </Card>

            {/* Disclaimer */}
            <div className="bg-muted/20 p-3.5 rounded-xl border border-border/30">
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                {t.summary.dataDisclaimer}
              </p>
            </div>

            {/* Older reports */}
            {olderSummaries.length > 0 && (
              <div className="space-y-3 pt-2">
                <button
                  onClick={() => setExpandedOlder(!expandedOlder)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full justify-center"
                >
                  {t.summary.olderReports} ({olderSummaries.length})
                  {expandedOlder ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>

                {expandedOlder && (
                  <div className="space-y-4 animate-in">
                    {olderSummaries.map((summary) => {
                      const report = parseReport(summary.summary_text);
                      return (
                        <Card key={summary.id} className="p-4 border border-border bg-card/80 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              {formatMonthRange(summary.month_start)}
                            </span>
                            <Button variant="ghost" size="sm" onClick={() => handleCopy(summary.summary_text)} className="gap-1.5 h-8">
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <p className="text-xs text-foreground/60 leading-relaxed line-clamp-3">
                            {report?.emotionComparison?.summary || report?.rawText?.substring(0, 150) || summary.summary_text.substring(0, 150)}…
                          </p>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : null}

        <div className="text-center text-xs text-muted-foreground/60 py-6 pb-20">
          {t.footer.copyright}
        </div>
      </div>

      {/* FAB area: Copy + PDF Export */}
      {summaries.length > 0 && (
        <div
          className="fixed bottom-6 start-1/2 z-20 flex items-center gap-2"
          style={{ transform: isRTL ? 'translateX(50%)' : 'translateX(-50%)' }}
        >
          <button
            onClick={handleCopyForTherapist}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all active:scale-95"
          >
            <Share2 className="h-4 w-4" />
            <span className="text-sm font-medium">{t.summary.copyForTherapist}</span>
          </button>
          {(
            <button
              onClick={handleExportPdf}
              disabled={exportingPdf}
              className="flex items-center gap-2 px-4 py-3 rounded-full bg-card border border-border text-foreground shadow-lg hover:bg-muted transition-all active:scale-95 disabled:opacity-50"
            >
              {exportingPdf ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{exportingPdf ? t.summary.exportingPdf : t.summary.exportPdf}</span>
            </button>
          )}
        </div>
      )}
      
    </div>
  );
};

export default MonthlySummary;
