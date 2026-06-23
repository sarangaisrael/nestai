import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import AppHeader from "@/components/AppHeader";
import BackButton from "@/components/BackButton";

type SleepLog = {
  id: string;
  date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  sleep_time: string | null;
  wake_time: string | null;
};

const DAY_LABELS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];
const DAY_SHORT  = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const BAR_MAX_H  = 80;
const MAX_HOURS  = 10;

const QUALITY_EMOJI: Record<number, string> = { 1: "😴", 2: "😕", 3: "😐", 4: "🙂", 5: "😊" };
const QUALITY_LABEL: Record<number, string> = { 1: "גרוע", 2: "לא טוב", 3: "בסדר", 4: "טוב", 5: "מעולה" };

function getWeekDates(offsetWeeks = 0): string[] {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i - offsetWeeks * 7);
    dates.push(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(d));
  }
  return dates;
}

function todayIsrael(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
}

function shortDay(dateStr: string): string {
  return DAY_SHORT[new Date(dateStr + "T12:00:00").getDay()];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const day = DAY_LABELS[d.getDay()];
  return `${day}, ${d.getDate()} ב${["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"][d.getMonth()]}`;
}

const SleepMonitorPage = () => {
  const [logs, setLogs]           = useState<SleepLog[]>([]);
  const [loading, setLoading]     = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekDates = getWeekDates(weekOffset);
  const today     = todayIsrael();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const start = getWeekDates(weekOffset)[0];
        // Fetch 3 weeks to cover history list
        const farBack = getWeekDates(2)[0];
        const { data } = await supabase
          .from("sleep_logs")
          .select("id, date, sleep_hours, sleep_quality, sleep_time, wake_time")
          .eq("user_id", session.user.id)
          .gte("date", farBack)
          .lte("date", today)
          .order("date", { ascending: false });

        setLogs((data ?? []) as SleepLog[]);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    })();
  }, [weekOffset]);

  const byDate   = Object.fromEntries(logs.map(l => [l.date, l]));
  const weekLogs = weekDates.map(d => byDate[d]).filter(Boolean) as SleepLog[];
  const valid    = weekLogs.filter(l => l.sleep_hours && l.sleep_hours > 0);
  const avgHours = valid.length
    ? Math.round((valid.reduce((s, l) => s + (l.sleep_hours ?? 0), 0) / valid.length) * 10) / 10
    : null;
  const avgQuality = valid.filter(l => l.sleep_quality).length
    ? Math.round(valid.reduce((s, l) => s + (l.sleep_quality ?? 0), 0) / valid.filter(l => l.sleep_quality).length * 10) / 10
    : null;

  const weekLabel = weekOffset === 0
    ? "השבוע"
    : weekOffset === 1 ? "שבוע שעבר"
    : `לפני ${weekOffset} שבועות`;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <BackButton />

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 24 }}>🌙</span>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: 0, fontFamily: "'Heebo', sans-serif" }}>
            ניטור שינה
          </h1>
        </div>

        {/* Week navigator */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "#f8fafc", borderRadius: 14, padding: "10px 16px",
          border: "1px solid #e2e8f0", fontFamily: "'Heebo', sans-serif",
        }}>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#64748b", padding: "0 8px" }}
          >
            ›
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{weekLabel}</span>
          <button
            onClick={() => setWeekOffset(w => Math.max(0, w - 1))}
            disabled={weekOffset === 0}
            style={{ background: "none", border: "none", fontSize: 18, cursor: weekOffset === 0 ? "default" : "pointer", color: weekOffset === 0 ? "#cbd5e1" : "#64748b", padding: "0 8px" }}
          >
            ‹
          </button>
        </div>

        {/* Stats row */}
        {(avgHours !== null || valid.length > 0) && (
          <div style={{ display: "flex", gap: 10 }}>
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              style={{
                flex: 1, background: "#ede9fe", borderRadius: 14,
                padding: "14px 16px", textAlign: "center",
                fontFamily: "'Heebo', sans-serif",
              }}
            >
              <p style={{ fontSize: 26, fontWeight: 900, color: "#4f46e5", margin: "0 0 2px" }}>
                {avgHours ?? "—"}
              </p>
              <p style={{ fontSize: 11, color: "#7c3aed", margin: 0, fontWeight: 600 }}>ממוצע שעות</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              style={{
                flex: 1, background: "#f0fdf4", borderRadius: 14,
                padding: "14px 16px", textAlign: "center",
                fontFamily: "'Heebo', sans-serif",
              }}
            >
              <p style={{ fontSize: 26, fontWeight: 900, color: "#16a34a", margin: "0 0 2px" }}>
                {valid.length}
              </p>
              <p style={{ fontSize: 11, color: "#15803d", margin: 0, fontWeight: 600 }}>לילות נרשמו</p>
            </motion.div>

            {avgQuality !== null && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                style={{
                  flex: 1, background: "#fff7ed", borderRadius: 14,
                  padding: "14px 16px", textAlign: "center",
                  fontFamily: "'Heebo', sans-serif",
                }}
              >
                <p style={{ fontSize: 26, fontWeight: 900, color: "#ea580c", margin: "0 0 2px" }}>
                  {QUALITY_EMOJI[Math.round(avgQuality)] ?? "😐"}
                </p>
                <p style={{ fontSize: 11, color: "#c2410c", margin: 0, fontWeight: 600 }}>איכות ממוצעת</p>
              </motion.div>
            )}
          </div>
        )}

        {/* Bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{
            background: "#fff", borderRadius: 16, border: "0.5px solid #e2e8f0",
            padding: "18px 16px 14px", fontFamily: "'Heebo', sans-serif",
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8", margin: "0 0 14px" }}>שעות שינה לפי יום</p>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: BAR_MAX_H + 32 }}>
            {weekDates.map((date) => {
              const log    = byDate[date];
              const hours  = log?.sleep_hours ?? 0;
              const barH   = hours ? Math.max(5, Math.round((hours / MAX_HOURS) * BAR_MAX_H)) : 5;
              const isToday = date === today;
              const hasData = hours > 0;

              return (
                <div key={date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <span style={{ fontSize: 9, color: "#94a3b8", height: 14, display: "flex", alignItems: "center" }}>
                    {hasData ? `${hours}` : ""}
                  </span>
                  <div style={{ width: "100%", height: BAR_MAX_H, display: "flex", alignItems: "flex-end" }}>
                    <div style={{
                      width: "100%", height: barH,
                      borderRadius: "5px 5px 2px 2px",
                      background: hasData
                        ? (isToday ? "linear-gradient(180deg, #818cf8, #6366f1)" : "linear-gradient(180deg, #a5b4fc, #818cf8)")
                        : "#f1f5f9",
                    }} />
                  </div>
                  <span style={{ fontSize: 9, fontWeight: isToday ? 800 : 500, color: isToday ? "#6366f1" : "#94a3b8" }}>
                    {shortDay(date)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hour reference lines */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: "1px dashed #e2e8f0" }}>
            {[4, 6, 8, 10].map(h => (
              <span key={h} style={{ fontSize: 9, color: "#cbd5e1" }}>{h}ש׳</span>
            ))}
          </div>
        </motion.div>

        {/* Log history */}
        <div style={{ fontFamily: "'Heebo', sans-serif" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#64748b", margin: "0 0 10px" }}>היסטוריית לילות</p>
          {loading ? (
            <p style={{ fontSize: 13, color: "#94a3b8", textAlign: "center" }}>טוען...</p>
          ) : logs.length === 0 ? (
            <div style={{ background: "#f8fafc", borderRadius: 12, padding: "20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>עוד לא נרשמו לילות</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {logs.map((log) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    background: "#fff", borderRadius: 12,
                    border: "0.5px solid #e2e8f0",
                    padding: "12px 16px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 2px" }}>
                      {formatDate(log.date)}
                    </p>
                    {(log.sleep_time || log.wake_time) && (
                      <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>
                        {log.sleep_time && `ישן בשעה ${log.sleep_time.slice(0, 5)}`}
                        {log.sleep_time && log.wake_time && " · "}
                        {log.wake_time && `התעורר ${log.wake_time.slice(0, 5)}`}
                      </p>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {log.sleep_hours && (
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#6366f1" }}>
                        {log.sleep_hours}ש׳
                      </span>
                    )}
                    {log.sleep_quality && (
                      <span title={QUALITY_LABEL[log.sleep_quality]} style={{ fontSize: 20 }}>
                        {QUALITY_EMOJI[log.sleep_quality]}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SleepMonitorPage;
