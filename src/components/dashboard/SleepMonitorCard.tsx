import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type SleepLog = {
  date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
};

const DAY_LABELS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const BAR_MAX_H  = 52; // px
const MAX_HOURS  = 10;

function getWeekDates(): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    dates.push(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(d));
  }
  return dates;
}

function todayIsrael(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
}

function shortDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return DAY_LABELS[d.getDay()];
}

function generateInsight(logs: SleepLog[]): string | null {
  const valid = logs.filter(l => l.sleep_hours && l.sleep_hours > 0);
  if (valid.length < 3) return null;

  const avg = valid.reduce((s, l) => s + (l.sleep_hours ?? 0), 0) / valid.length;
  const longNights = valid.filter(l => (l.sleep_hours ?? 0) >= 7);
  const shortNights = valid.filter(l => (l.sleep_hours ?? 0) < 7);

  if (longNights.length >= 2 && shortNights.length >= 1) {
    const ratedLong  = longNights.filter(l => l.sleep_quality);
    const ratedShort = shortNights.filter(l => l.sleep_quality);
    if (ratedLong.length > 0 && ratedShort.length > 0) {
      const avgLongQ  = ratedLong.reduce((s, l) => s + (l.sleep_quality ?? 0), 0) / ratedLong.length;
      const avgShortQ = ratedShort.reduce((s, l) => s + (l.sleep_quality ?? 0), 0) / ratedShort.length;
      if (avgLongQ > avgShortQ + 0.4) {
        return `בלילות שישנת יותר מ-7 שעות, דירגת את האיכות גבוה יותר — ${longNights.length} פעמים השבוע`;
      }
    }
    return `${longNights.length} לילות עם שינה טובה (7+ שעות) מתוך ${valid.length} שנרשמו`;
  }

  if (avg >= 7.5) return "שינה טובה השבוע — ממוצע גבוה מהמומלץ 🌟";
  if (avg < 6)   return "שינה קצרה השבוע — כדאי לנסות ללכת לישון מוקדם יותר";
  return null;
}

const SleepMonitorCard = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const weekDates = getWeekDates();
        const { data } = await supabase
          .from("sleep_logs")
          .select("date, sleep_hours, sleep_quality")
          .eq("user_id", session.user.id)
          .gte("date", weekDates[0])
          .lte("date", weekDates[6])
          .order("date", { ascending: true });

        setLogs((data ?? []) as SleepLog[]);
      } catch {
        // silent fail — card just shows empty state
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return null;

  const weekDates  = getWeekDates();
  const today      = todayIsrael();
  const byDate     = Object.fromEntries(logs.map(l => [l.date, l]));
  const valid      = logs.filter(l => l.sleep_hours && l.sleep_hours > 0);
  const avgHours   = valid.length
    ? Math.round((valid.reduce((s, l) => s + (l.sleep_hours ?? 0), 0) / valid.length) * 10) / 10
    : null;
  const insight    = generateInsight(logs);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      onClick={() => navigate("/app/sleep")}
      style={{
        background: "#ffffff",
        borderRadius: 16,
        border: "0.5px solid #e2e8f0",
        padding: "18px 20px 20px",
        fontFamily: "'Heebo', sans-serif",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 20 }}>🌙</span>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0 }}>ניטור שינה</p>
        </div>
        {avgHours !== null && (
          <span style={{
            background: "#ede9fe", color: "#5b21b6",
            borderRadius: 50, padding: "3px 12px",
            fontSize: 12, fontWeight: 700,
          }}>
            ממוצע {avgHours}ש׳
          </span>
        )}
      </div>

      {/* Bar chart */}
      <div style={{ display: "flex", gap: 4, alignItems: "flex-end", marginBottom: 12, height: BAR_MAX_H + 28 }}>
        {weekDates.map((date) => {
          const log   = byDate[date];
          const hours = log?.sleep_hours ?? 0;
          const barH  = hours ? Math.max(4, Math.round((hours / MAX_HOURS) * BAR_MAX_H)) : 4;
          const isToday = date === today;
          const hasData = hours > 0;

          return (
            <div
              key={date}
              style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}
            >
              <span style={{ fontSize: 8, color: "#94a3b8", height: 12, display: "flex", alignItems: "center" }}>
                {hasData ? `${hours}` : ""}
              </span>
              <div style={{ width: "100%", height: BAR_MAX_H, display: "flex", alignItems: "flex-end" }}>
                <div style={{
                  width: "100%",
                  height: barH,
                  borderRadius: "4px 4px 2px 2px",
                  background: hasData
                    ? (isToday ? "linear-gradient(180deg, #818cf8, #6366f1)" : "linear-gradient(180deg, #a5b4fc, #818cf8)")
                    : "#f1f5f9",
                  transition: "height 0.3s ease",
                }} />
              </div>
              <span style={{
                fontSize: 9, fontWeight: isToday ? 800 : 500,
                color: isToday ? "#6366f1" : "#94a3b8",
              }}>
                {shortDay(date)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Insight */}
      {insight ? (
        <div style={{
          background: "#f8f7ff",
          borderRadius: 10,
          padding: "8px 12px",
          fontSize: 12,
          color: "#4c1d95",
          lineHeight: 1.5,
          fontWeight: 500,
        }}>
          💡 {insight}
        </div>
      ) : valid.length === 0 ? (
        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, textAlign: "center" }}>
          עוד לא נרשמו נתוני שינה השבוע
        </p>
      ) : null}

      {/* Tap hint */}
      <p style={{ fontSize: 11, color: "#cbd5e1", margin: "10px 0 0", textAlign: "center" }}>
        לחץ לפרטים נוספים ←
      </p>
    </motion.div>
  );
};

export default SleepMonitorCard;
