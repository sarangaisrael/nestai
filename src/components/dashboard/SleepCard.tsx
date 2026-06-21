import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const QUALITY_OPTIONS = [
  { value: 1, emoji: "😴", label: "גרוע" },
  { value: 2, emoji: "😕", label: "לא טוב" },
  { value: 3, emoji: "😐", label: "בסדר" },
  { value: 4, emoji: "🙂", label: "טוב" },
  { value: 5, emoji: "😊", label: "מעולה" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function isIsraelMorning(): boolean {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jerusalem",
      hour: "numeric",
      hour12: false,
    }).formatToParts(new Date());
    const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0");
    return hour >= 6 && hour < 11;
  } catch {
    // Fallback to local time if Intl fails
    const hour = new Date().getHours();
    return hour >= 6 && hour < 11;
  }
}

function todayIsrael(): string {
  try {
    // Returns YYYY-MM-DD in Israel timezone
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

/** Returns decimal sleep hours (e.g. 7.5) given HH:MM strings */
function calcHours(sleep: string, wake: string): number {
  const [sh, sm] = sleep.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let sleepMins = sh * 60 + sm;
  let wakeMins  = wh * 60 + wm;
  if (wakeMins <= sleepMins) wakeMins += 24 * 60; // crosses midnight
  return Math.round(((wakeMins - sleepMins) / 60) * 10) / 10;
}

// ── Component ─────────────────────────────────────────────────────────────────
const SleepCard = () => {
  const [visible,   setVisible]   = useState<boolean | null>(null); // null = checking
  const [sleepTime, setSleepTime] = useState("23:00");
  const [wakeTime,  setWakeTime]  = useState("07:00");
  const [quality,   setQuality]   = useState<number | null>(null);
  const [saving,    setSaving]    = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!isIsraelMorning()) { setVisible(false); return; }

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setVisible(false); return; }

        const today = todayIsrael();
        const { data } = await supabase
          .from("sleep_logs")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("date", today)
          .maybeSingle();

        setVisible(!data); // hide if already logged today
      } catch {
        setVisible(false);
      }
    })();
  }, []);

  const hours = calcHours(sleepTime, wakeTime);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { error } = await supabase.from("sleep_logs").insert({
        user_id:       session.user.id,
        date:          todayIsrael(),
        sleep_time:    sleepTime,
        wake_time:     wakeTime,
        sleep_hours:   hours,
        sleep_quality: quality,
      });

      if (error) throw error;

      toast({ title: "נשמר! 🌙", description: "נתוני השינה שלך נרשמו" });
      setVisible(false); // dismiss card after save
    } catch (err) {
      console.error("[SleepCard] save error:", err);
      toast({ title: "שגיאה בשמירה, נסה שוב", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  // Not morning, already logged, or still checking → render nothing
  if (visible !== true) return null;

  const timeInputStyle: React.CSSProperties = {
    flex: 1,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "8px 10px",
    fontSize: 16,
    fontWeight: 600,
    color: "#0f172a",
    fontFamily: "'Heebo', sans-serif",
    textAlign: "center" as const,
    WebkitAppearance: "none" as const,
    outline: "none",
    width: "100%",
    boxSizing: "border-box" as const,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      style={{
        background: "#ffffff",
        borderRadius: 16,
        border: "0.5px solid #e2e8f0",
        padding: "18px 20px 20px",
        fontFamily: "'Heebo', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 22 }}>🌙</span>
        <div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a", margin: 0, lineHeight: 1.2 }}>
            איך ישנת הלילה?
          </p>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, lineHeight: 1.4 }}>
            ייקח לך 20 שניות
          </p>
        </div>
      </div>

      {/* Time selects */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {/* Sleep time */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", textAlign: "center" }}>
            הלכתי לישון
          </label>
          <input
            type="time"
            value={sleepTime}
            onChange={(e) => setSleepTime(e.target.value)}
            style={timeInputStyle}
          />
        </div>

        {/* Wake time */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#7c3aed", textAlign: "center" }}>
            התעוררתי
          </label>
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            style={timeInputStyle}
          />
        </div>
      </div>

      {/* Calculated hours pill */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <span style={{
          background: "#ede9fe",
          color: "#5b21b6",
          borderRadius: 50,
          padding: "4px 14px",
          fontSize: 12,
          fontWeight: 700,
        }}>
          ⏱️ {hours} שעות שינה
        </span>
      </div>

      {/* Sleep quality */}
      <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", margin: "0 0 10px", fontWeight: 600 }}>
        איכות השינה
      </p>
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 18 }}>
        {QUALITY_OPTIONS.map((q) => (
          <button
            key={q.value}
            type="button"
            onClick={() => setQuality(q.value)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "6px 10px",
              borderRadius: 10,
              border: quality === q.value ? "1.5px solid #6366f1" : "1.5px solid transparent",
              background: quality === q.value ? "#ede9fe" : "#f8fafc",
              cursor: "pointer",
              transition: "all 0.12s",
              minWidth: 44,
            }}
          >
            <span style={{ fontSize: 20 }}>{q.emoji}</span>
            <span style={{ fontSize: 9, color: quality === q.value ? "#4f46e5" : "#94a3b8", fontWeight: 600 }}>
              {q.label}
            </span>
          </button>
        ))}
      </div>

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          width: "100%",
          background: saving ? "#a5b4fc" : "#6366f1",
          color: "white",
          border: "none",
          borderRadius: 12,
          padding: "12px 0",
          fontSize: 14,
          fontWeight: 800,
          cursor: saving ? "not-allowed" : "pointer",
          fontFamily: "'Heebo', sans-serif",
          transition: "background 0.15s",
        }}
      >
        {saving ? "שומר..." : "שמור ✓"}
      </button>
    </motion.div>
  );
};

export default SleepCard;
