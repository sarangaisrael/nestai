import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const RING_RADIUS = 45;
const RING_C = 283; // ≈ 2 * π * 45

interface SummaryScores {
  stress_score: number | null;
  anxiety_score: number | null;
  joy_score: number | null;
}

const GrowthMeterCard = () => {
  const [daysLogged, setDaysLogged] = useState(0);
  const [latest, setLatest] = useState<SummaryScores | null>(null);
  const [prev, setPrev]     = useState<SummaryScores | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || cancelled) return;

        const { data: summaries } = await supabase
          .from("weekly_summaries")
          .select("stress_score, anxiety_score, joy_score, created_at")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false })
          .limit(2);

        if (cancelled) return;

        const hasScores =
          summaries && summaries.length > 0 && summaries[0].stress_score !== null;

        if (hasScores) {
          setLatest(summaries![0] as SummaryScores);
          if (summaries!.length > 1) setPrev(summaries![1] as SummaryScores);
        } else {
          // State A — count distinct activity days in the last 7 days
          const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

          const [{ data: msgs }, { data: sleeps }] = await Promise.all([
            supabase
              .from("messages")
              .select("created_at")
              .eq("user_id", session.user.id)
              .eq("role", "user")
              .gte("created_at", sevenDaysAgo),
            supabase
              .from("sleep_logs")
              .select("log_date")
              .eq("user_id", session.user.id)
              .gte("log_date", sevenDaysAgo.slice(0, 10)),
          ]);

          if (cancelled) return;

          const fmt = (iso: string) =>
            new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(
              new Date(iso)
            );

          const days = new Set([
            ...(msgs  || []).map((m: any) => fmt(m.created_at)),
            ...(sleeps || []).map((s: any) => s.log_date as string),
          ]);
          setDaysLogged(Math.min(days.size, 7));
        }
      } catch { /* silent — card simply stays in State A */ }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) return null;

  /* ── State B: scores available ── */
  if (latest && latest.stress_score !== null) {
    const metrics = [
      { label: "לחץ",   key: "stress_score"  as const, color: "#ef4444", lowIsBetter: true  },
      { label: "חרדה",  key: "anxiety_score" as const, color: "#f59e0b", lowIsBetter: true  },
      { label: "שמחה",  key: "joy_score"     as const, color: "#22c55e", lowIsBetter: false },
    ];

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: "20px 20px 16px",
          border: "0.5px solid #e2e8f0",
          fontFamily: "'Heebo', sans-serif",
        }}>
          <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>
            מדד התפתחות אישית
          </p>

          {metrics.map(({ label, key, color, lowIsBetter }) => {
            const val  = latest[key];
            const pval = prev?.[key] ?? null;
            const pct  = val !== null ? Math.round((val / 10) * 100) : 0;
            const trend =
              val !== null && pval !== null
                ? lowIsBetter
                  ? val < pval ? "up" : val > pval ? "down" : "same"
                  : val > pval ? "up" : val < pval ? "down" : "same"
                : null;

            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 5,
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{label}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    {trend === "up"   && <span style={{ color: "#22c55e", fontSize: 14 }}>↑</span>}
                    {trend === "down" && <span style={{ color: "#ef4444", fontSize: 14 }}>↓</span>}
                    {trend === "same" && <span style={{ color: "#94a3b8", fontSize: 14 }}>→</span>}
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      {val !== null ? val.toFixed(1) : "—"}
                    </span>
                  </span>
                </div>
                <div style={{
                  height: 7, borderRadius: 99,
                  background: "#f1f5f9", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", width: `${pct}%`,
                    borderRadius: 99, background: color,
                    transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            );
          })}

          <p style={{
            margin: "6px 0 0", fontSize: 10,
            color: "#94a3b8", textAlign: "center",
          }}>
            מבוסס על הסיכום השבועי האחרון שלך
          </p>
        </div>
      </motion.div>
    );
  }

  /* ── State A: ring ── */
  const isUnlocked = daysLogged >= 5;
  const filled     = Math.round((RING_C * daysLogged) / 7);
  const offset     = RING_C - filled;
  const ringColor  = isUnlocked ? "#6366f1" : "#94a3b8";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div style={{
        background: "#ffffff",
        borderRadius: 20,
        padding: "20px",
        border: "0.5px solid #e2e8f0",
        display: "flex",
        alignItems: "center",
        gap: 20,
        fontFamily: "'Heebo', sans-serif",
      }}>
        {/* SVG ring with HTML center overlay */}
        <div style={{ position: "relative", width: 110, height: 110, flexShrink: 0 }}>
          <svg width={110} height={110} viewBox="0 0 120 120">
            <circle cx={60} cy={60} r={RING_RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={10} />
            <circle
              cx={60} cy={60} r={RING_RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 2,
          }}>
            <span style={{ fontSize: 22, lineHeight: 1 }}>{isUnlocked ? "🔓" : "🔒"}</span>
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: ringColor, fontFamily: "'Heebo', sans-serif",
            }}>
              {daysLogged} / 7
            </span>
          </div>
        </div>

        {/* Text side */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: "0 0 6px", fontSize: 14,
            fontWeight: 800, color: "#0f172a", lineHeight: 1.3,
          }}>
            מדד התפתחות אישית
          </p>
          <p style={{
            margin: "0 0 12px", fontSize: 12,
            color: "#64748b", lineHeight: 1.5,
          }}>
            {isUnlocked
              ? "כל הכבוד! 5 ימים של מעקב — סיכום שבועי בדרך 🎉"
              : `עוד ${7 - daysLogged} ימים לסיכום השבועי הראשון`}
          </p>
          {/* Dot indicator */}
          <div style={{ display: "flex", gap: 5 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: i < daysLogged ? ringColor : "#e2e8f0",
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default GrowthMeterCard;
