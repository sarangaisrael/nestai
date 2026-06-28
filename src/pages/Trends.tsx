import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

type Period = "week" | "month" | "year";

interface SummaryCard {
  id: string;
  type: "weekly" | "monthly";
  label: string;
  created_at: string;
  preview: string;
}

const MOOD_EMOJIS  = ["😔", "😕", "😐", "🙂", "😊"];
const MOOD_COLORS: Record<number, string> = {
  1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#22c55e", 5: "#6366f1",
};

const ACTIVITIES_MAP: Record<string, { label: string; emoji: string }> = {
  work:    { label: "עבודה",       emoji: "💼" },
  sport:   { label: "ספורט",       emoji: "🏋️" },
  walk:    { label: "הליכה/ריצה", emoji: "🚶" },
  sleep:   { label: "שינה טובה",   emoji: "😴" },
  date:    { label: "דייט",        emoji: "👫" },
  friends: { label: "חברים",       emoji: "👥" },
  family:  { label: "משפחה",       emoji: "📞" },
};

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
}

function periodStart(period: Period): string {
  const d = new Date(todayISO());
  if (period === "week")  d.setDate(d.getDate() - 6);
  if (period === "month") d.setDate(d.getDate() - 29);
  if (period === "year")  d.setDate(d.getDate() - 364);
  return d.toISOString().slice(0, 10);
}

interface Checkin {
  date: string;
  mood: number;
  activities: string[];
}

const Trends = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData]     = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaries, setSummaries] = useState<SummaryCard[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;

      // Fetch latest weekly + monthly summary rows (ids only first)
      const [{ data: weeklies }, { data: monthlies }] = await Promise.all([
        supabase.from("weekly_summaries").select("id, created_at, summary_text")
          .eq("user_id", uid).order("created_at", { ascending: false }).limit(1),
        supabase.from("monthly_summaries").select("id, created_at, summary_text")
          .eq("user_id", uid).order("created_at", { ascending: false }).limit(1),
      ]);

      const cards: SummaryCard[] = [];

      for (const row of (weeklies ?? [])) {
        const res = await supabase.functions.invoke("get-decrypted-summary", { body: { summary_id: row.id } });
        const text: string = res.error ? "" : (res.data?.summary_text ?? "");
        cards.push({ id: row.id, type: "weekly", label: "סיכום שבועי", created_at: row.created_at, preview: text.slice(0, 120) });
      }
      for (const row of (monthlies ?? [])) {
        const res = await supabase.functions.invoke("get-decrypted-summary", { body: { summary_id: row.id } });
        const text: string = res.error ? "" : (res.data?.summary_text ?? "");
        cards.push({ id: row.id, type: "monthly", label: "סיכום חודשי", created_at: row.created_at, preview: text.slice(0, 120) });
      }

      setSummaries(cards);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const { data: rows } = await supabase
        .from("daily_checkins")
        .select("date, mood, activities")
        .eq("user_id", session.user.id)
        .gte("date", periodStart(period))
        .lte("date", todayISO())
        .order("date", { ascending: true });
      setData((rows ?? []) as Checkin[]);
      setLoading(false);
    })();
  }, [period]);

  // Compute activity correlation
  const activityCorrelation = () => {
    const result: { id: string; avgMood: number; count: number }[] = [];
    const totalAvg = data.length ? data.reduce((s, d) => s + d.mood, 0) / data.length : 3;
    for (const id of Object.keys(ACTIVITIES_MAP)) {
      const withAct = data.filter(d => (d.activities ?? []).includes(id));
      if (withAct.length < 2) continue;
      const avg = withAct.reduce((s, d) => s + d.mood, 0) / withAct.length;
      result.push({ id, avgMood: avg, count: withAct.length });
    }
    result.sort((a, b) => Math.abs(b.avgMood - totalAvg) - Math.abs(a.avgMood - totalAvg));
    return { items: result.slice(0, 5), totalAvg };
  };

  const avgMood = data.length ? Math.round(data.reduce((s, d) => s + d.mood, 0) / data.length * 10) / 10 : null;

  const { items: correlations, totalAvg } = activityCorrelation();

  return (
    <div dir="rtl" style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "'Heebo', sans-serif" }}>

      {/* Header */}
      <div style={{ background: "#fff", borderBottom: "0.5px solid #e2e8f0", padding: "calc(env(safe-area-inset-top,0px) + 16px) 20px 14px" }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" }}>מגמות</h1>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>

        {/* Summaries section */}
        {summaries.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#0f172a" }}>סיכומים</p>
              <button onClick={() => navigate("/app/summaries")} style={{
                background: "none", border: "none", fontSize: 12, color: "#6366f1",
                fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo', sans-serif",
              }}>כל הסיכומים ←</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
              {summaries.map(s => (
                <div key={s.id} onClick={() => navigate("/app/summaries")} style={{
                  background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                  borderRadius: 14, padding: "14px 16px", cursor: "pointer",
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#a5b4fc" }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: "#818cf8" }}>
                      {new Date(s.created_at).toLocaleDateString("he-IL", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  {s.preview ? (
                    <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {s.preview}
                    </p>
                  ) : (
                    <p style={{ margin: 0, fontSize: 12, color: "#818cf8" }}>לחץ לצפייה בסיכום ✨</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Period selector */}
        <div style={{ display: "flex", background: "#fff", borderRadius: 12, border: "0.5px solid #e2e8f0", overflow: "hidden", marginBottom: 18 }}>
          {(["week", "month", "year"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              flex: 1, padding: "10px", border: "none", cursor: "pointer", fontFamily: "'Heebo', sans-serif",
              background: period === p ? "#6366f1" : "transparent",
              color: period === p ? "#fff" : "#64748b",
              fontSize: 13, fontWeight: period === p ? 700 : 400,
              transition: "all 0.2s",
            }}>
              {p === "week" ? "שבוע" : p === "month" ? "חודש" : "שנה"}
            </button>
          ))}
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>טוען...</p>
        ) : data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "#fff", borderRadius: 16, border: "0.5px solid #e2e8f0" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>📊</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>אין עדיין נתונים</p>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>תתחיל לעשות check-in יומי כדי לראות מגמות</p>
          </div>
        ) : (
          <>
            {/* Summary stat */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, background: "#fff", borderRadius: 14, border: "0.5px solid #e2e8f0", padding: "14px", textAlign: "center" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 28, fontWeight: 900, color: "#6366f1" }}>
                    {avgMood ?? "—"}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>ממוצע מצב רוח</p>
                </div>
                <div style={{ flex: 1, background: "#fff", borderRadius: 14, border: "0.5px solid #e2e8f0", padding: "14px", textAlign: "center" }}>
                  <p style={{ margin: "0 0 2px", fontSize: 28, fontWeight: 900, color: "#22c55e" }}>
                    {data.length}
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>ימים נרשמו</p>
                </div>
              </div>
            </motion.div>

            {/* Mood bar chart */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e2e8f0", padding: "14px 16px", marginBottom: 14 }}>
                <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#64748b" }}>מצב רוח לפי יום</p>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 60, overflowX: "auto" }}>
                  {data.map((d, i) => {
                    const h = Math.round((d.mood / 5) * 44) + 6;
                    return (
                      <div key={i} style={{ minWidth: period === "year" ? 4 : period === "month" ? 8 : 28, flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: "100%", height: 50, display: "flex", alignItems: "flex-end" }}>
                          <div style={{ width: "100%", height: h, borderRadius: "3px 3px 1px 1px", background: MOOD_COLORS[d.mood] ?? "#94a3b8" }} />
                        </div>
                        {period === "week" && (
                          <span style={{ fontSize: 8, color: "#cbd5e1", marginTop: 2 }}>
                            {["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"][new Date(d.date + "T12:00:00").getDay()]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Activity correlation */}
            {correlations.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e2e8f0", padding: "14px 16px", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
                    <span style={{ fontSize: 18 }}>🔍</span>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "#0f172a" }}>מה משפיע על מצב הרוח שלך?</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {correlations.map(({ id, avgMood: am, count }) => {
                      const act = ACTIVITIES_MAP[id];
                      if (!act) return null;
                      const diff = am - totalAvg;
                      const positive = diff > 0;
                      const pct = Math.round(Math.abs(diff) / 4 * 100);
                      return (
                        <div key={id}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 16 }}>{act.emoji}</span>
                              <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{act.label}</span>
                              <span style={{ fontSize: 11, color: "#94a3b8" }}>({count} ימים)</span>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: positive ? "#16a34a" : "#d97706" }}>
                              {positive ? "↑" : "↓"} {am.toFixed(1)}
                            </span>
                          </div>
                          <div style={{ height: 6, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(pct + 20, 100)}%`, background: positive ? "#22c55e" : "#f97316", borderRadius: 99 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Mood distribution */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e2e8f0", padding: "14px 16px" }}>
                <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#64748b" }}>התפלגות מצב רוח</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {[5, 4, 3, 2, 1].map(m => {
                    const cnt = data.filter(d => d.mood === m).length;
                    const pct = data.length ? Math.round(cnt / data.length * 100) : 0;
                    return (
                      <div key={m} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16, width: 24 }}>{MOOD_EMOJIS[m - 1]}</span>
                        <div style={{ flex: 1, height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: MOOD_COLORS[m], borderRadius: 99, transition: "width 0.5s ease" }} />
                        </div>
                        <span style={{ fontSize: 11, color: "#94a3b8", width: 28, textAlign: "left" }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default Trends;
