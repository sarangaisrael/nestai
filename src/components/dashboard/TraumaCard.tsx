import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// ── Helpers (mirrors SleepCard pattern) ──────────────────────────────────────
function todayIsrael(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

// ── Data ─────────────────────────────────────────────────────────────────────
const SAFETY_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: "בכלל לא" },
  { value: 2, label: "קצת" },
  { value: 3, label: "בסדר" },
  { value: 4, label: "טוב" },
  { value: 5, label: "בטוח/ה" },
];

const BODY_PARTS: string[] = ["ראש", "חזה", "בטן", "ידיים", "רגליים", "לא מרגיש/ה"];

// ─────────────────────────────────────────────────────────────────────────────
const TraumaCard = () => {
  // Visibility: null = checking, true = show, false = hide
  const [visible,      setVisible]      = useState<boolean | null>(null);

  // Form state
  const [safetyLevel,    setSafetyLevel]    = useState<number | null>(null);
  const [hadTrigger,     setHadTrigger]     = useState<boolean | null>(null);
  const [triggerDesc,    setTriggerDesc]    = useState("");
  const [bodyLocations,  setBodyLocations]  = useState<string[]>([]);
  const [saving,         setSaving]         = useState(false);

  const { toast } = useToast();

  // ── Check visibility on mount ─────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { setVisible(false); return; }

        // 1. Check has_trauma flag
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("has_trauma")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (!prefs?.has_trauma) { setVisible(false); return; }

        // 2. Check if already logged today
        const today = todayIsrael();
        const { data: existing } = await supabase
          .from("trauma_logs")
          .select("id")
          .eq("user_id", session.user.id)
          .eq("date", today)
          .maybeSingle();

        setVisible(!existing);
      } catch {
        setVisible(false);
      }
    })();
  }, []);

  // ── Body location toggle ──────────────────────────────────────────────────
  const toggleBodyPart = (part: string) => {
    setBodyLocations(prev =>
      prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part]
    );
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const { error } = await supabase.from("trauma_logs").insert({
        user_id:             session.user.id,
        date:                todayIsrael(),
        safety_level:        safetyLevel,
        had_trigger:         hadTrigger,
        trigger_description: triggerDesc.trim() || null,
        body_locations:      bodyLocations.length > 0 ? bodyLocations : null,
      });

      if (error) throw error;

      toast({ title: "נשמר 🛡️", description: "המרחב שלך תועד" });
      setVisible(false);
    } catch (err) {
      console.error("[TraumaCard] save error:", err);
      toast({ title: "שגיאה בשמירה, נסה שוב", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (visible !== true) return null;

  // ── Style helpers ─────────────────────────────────────────────────────────
  const safetyBtn = (v: number): React.CSSProperties => ({
    flex: 1,
    padding: "8px 4px",
    borderRadius: 8,
    border: safetyLevel === v ? "1.5px solid #fca5a5" : "1.5px solid #fde8e8",
    background: safetyLevel === v ? "#fee2e2" : "#fff5f5",
    color: safetyLevel === v ? "#dc2626" : "#9ca3af",
    fontSize: 11,
    fontWeight: safetyLevel === v ? 700 : 500,
    cursor: "pointer",
    textAlign: "center" as const,
    fontFamily: "'Heebo', sans-serif",
    transition: "all 0.1s",
  });

  const triggerBtn = (active: boolean, isYes: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "9px 0",
    borderRadius: 8,
    border: active
      ? isYes ? "1.5px solid #fca5a5" : "1.5px solid #86efac"
      : "1.5px solid #e5e7eb",
    background: active
      ? isYes ? "#fee2e2" : "#f0fdf4"
      : "#f9fafb",
    color: active
      ? isYes ? "#dc2626" : "#16a34a"
      : "#9ca3af",
    fontSize: 13,
    fontWeight: active ? 700 : 500,
    cursor: "pointer",
    fontFamily: "'Heebo', sans-serif",
    transition: "all 0.1s",
  });

  const bodyBtn = (part: string): React.CSSProperties => {
    const active = bodyLocations.includes(part);
    return {
      padding: "6px 12px",
      borderRadius: 20,
      border: active ? "1.5px solid #c4b5fd" : "1.5px solid #e5e7eb",
      background: active ? "#ede9fe" : "#f9fafb",
      color: active ? "#5b21b6" : "#6b7280",
      fontSize: 12,
      fontWeight: active ? 700 : 500,
      cursor: "pointer",
      fontFamily: "'Heebo', sans-serif",
      transition: "all 0.1s",
      whiteSpace: "nowrap" as const,
    };
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: "#374151",
    margin: "0 0 8px",
    display: "block",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2 }}
      style={{
        background: "white",
        borderRadius: 14,
        border: "1.5px solid #fca5a5",
        padding: "16px 18px 18px",
        fontFamily: "'Heebo', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle red radial glow — top-right corner */}
      <div style={{
        position: "absolute",
        top: -40, right: -40,
        width: 140, height: 140,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(252,165,165,0.25) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 20 }}>🛡️</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#0f172a", margin: 0 }}>
              מרחב הטראומה
            </p>
            <span style={{
              background: "#fee2e2", color: "#dc2626",
              borderRadius: 50, padding: "2px 8px",
              fontSize: 10, fontWeight: 700,
            }}>
              יומי
            </span>
          </div>
          <p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>איך את/ה עכשיו?</p>
        </div>
      </div>

      {/* ── Section 1 — Safety scale ── */}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>כמה בטוח/ה את/ה מרגיש/ה עכשיו?</label>
        <div style={{ display: "flex", gap: 6 }}>
          {SAFETY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSafetyLevel(opt.value)}
              style={safetyBtn(opt.value)}
            >
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{opt.value}</div>
              <div style={{ fontSize: 10, lineHeight: 1.2 }}>{opt.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Section 2 — Trigger ── */}
      <div style={{ marginBottom: hadTrigger === true ? 10 : 16 }}>
        <label style={labelStyle}>האם נתקלת בטריגר היום?</label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setHadTrigger(true)}
            style={triggerBtn(hadTrigger === true, true)}
          >
            כן
          </button>
          <button
            type="button"
            onClick={() => { setHadTrigger(false); setTriggerDesc(""); }}
            style={triggerBtn(hadTrigger === false, false)}
          >
            לא
          </button>
        </div>
      </div>

      {/* Trigger description — only when "כן" */}
      {hadTrigger === true && (
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={triggerDesc}
            onChange={e => setTriggerDesc(e.target.value)}
            placeholder="מה קרה? (אופציונלי)"
            dir="rtl"
            style={{
              width: "100%", boxSizing: "border-box",
              border: "1px solid #fca5a5", borderRadius: 8,
              padding: "8px 12px", fontSize: 12,
              color: "#374151", background: "#fff9f9",
              outline: "none", fontFamily: "'Heebo', sans-serif",
            }}
          />
        </div>
      )}

      {/* ── Section 3 — Body location ── */}
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>איפה את/ה מרגיש/ה את זה בגוף?</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {BODY_PARTS.map((part) => (
            <button
              key={part}
              type="button"
              onClick={() => toggleBodyPart(part)}
              style={bodyBtn(part)}
            >
              {part}
            </button>
          ))}
        </div>
      </div>

      {/* ── Save button ── */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        style={{
          width: "100%",
          background: saving ? "#fca5a5" : "#dc2626",
          color: "white",
          border: "none",
          borderRadius: 8,
          padding: "11px 0",
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

export default TraumaCard;
