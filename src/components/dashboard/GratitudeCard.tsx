import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const MAX_PER_DAY = 3;

interface GratitudeEntry {
  id: string;
  content: string;
  created_at: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

const todayRange = (): { start: string; end: string } => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end   = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
};

// ─── Component ─────────────────────────────────────────────────────────────

const GratitudeCard = () => {
  const [entries, setEntries]         = useState<GratitudeEntry[]>([]);
  const [text, setText]               = useState("");
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [justSaved, setJustSaved]     = useState(false);
  const textareaRef                   = useRef<HTMLTextAreaElement>(null);

  // ── Fetch today's entries ────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { start, end } = todayRange();
      const { data } = await supabase
        .from("gratitude_entries")
        .select("id, content, created_at")
        .eq("user_id", user.id)
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: true });

      setEntries(data ?? []);
      setLoading(false);
    };
    load();
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed || entries.length >= MAX_PER_DAY || saving) return;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data, error } = await supabase
      .from("gratitude_entries")
      .insert({ user_id: user.id, content: trimmed })
      .select("id, content, created_at")
      .single();

    if (!error && data) {
      setEntries(prev => [...prev, data]);
      setText("");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2800);
    }
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
  };

  const count      = entries.length;
  const isComplete = count >= MAX_PER_DAY;

  // ─── Styles ──────────────────────────────────────────────────────────────
  const card: React.CSSProperties = {
    background: "#ffffff",
    border: "0.5px solid #e2e8f0",
    borderRadius: 16,
    padding: "18px 18px 16px",
    boxSizing: "border-box",
  };

  const headerRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  };

  const titleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 6,
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
  };

  const countBadge: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: isComplete ? "#16a34a" : "#64748b",
    background: isComplete ? "#dcfce7" : "#f1f5f9",
    borderRadius: 50,
    padding: "2px 9px",
    letterSpacing: "0.02em",
  };

  const entryBubble: React.CSSProperties = {
    background: "#f0f9ff",
    border: "0.5px solid #bae6fd",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 13,
    color: "#0c4a6e",
    lineHeight: 1.55,
    marginBottom: 8,
  };

  const textareaStyle: React.CSSProperties = {
    width: "100%",
    boxSizing: "border-box",
    resize: "none",
    border: "1px solid #e2e8f0",
    borderRadius: 10,
    padding: "10px 12px",
    fontSize: 13,
    color: "#1e293b",
    lineHeight: 1.6,
    outline: "none",
    fontFamily: "inherit",
    background: "#f8fafc",
    minHeight: 72,
    transition: "border-color 0.15s",
  };

  const saveBtn: React.CSSProperties = {
    marginTop: 8,
    background: text.trim() ? "#3b82f6" : "#cbd5e1",
    color: "#ffffff",
    border: "none",
    borderRadius: 50,
    padding: "7px 20px",
    fontSize: 13,
    fontWeight: 600,
    cursor: text.trim() && !saving ? "pointer" : "default",
    fontFamily: "inherit",
    transition: "background 0.15s",
    display: "flex",
    alignItems: "center",
    gap: 6,
  };

  const confirmMsg: React.CSSProperties = {
    marginTop: 10,
    background: "#f0fdf4",
    border: "0.5px solid #bbf7d0",
    borderRadius: 10,
    padding: "9px 12px",
    fontSize: 12,
    fontWeight: 500,
    color: "#15803d",
    textAlign: "center",
  };

  const completedBanner: React.CSSProperties = {
    marginTop: 10,
    background: "linear-gradient(135deg, #f0fdf4 0%, #eff6ff 100%)",
    border: "0.5px solid #bbf7d0",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 12,
    fontWeight: 500,
    color: "#15803d",
    textAlign: "center",
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  if (loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={card}
    >
      {/* Header */}
      <div style={headerRow}>
        <div style={titleStyle}>
          <span>🙏</span>
          <span>תודות היום</span>
        </div>
        <span style={countBadge}>
          {count}/{MAX_PER_DAY}
        </span>
      </div>

      {/* Today's entries */}
      <AnimatePresence initial={false}>
        {entries.map(entry => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22 }}
            style={entryBubble}
          >
            {entry.content}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Input area */}
      {!isComplete && (
        <div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={e => (e.target.style.borderColor = "#93c5fd")}
            onBlur={e => (e.target.style.borderColor = "#e2e8f0")}
            placeholder="על מה אתה אסיר תודה היום?"
            maxLength={300}
            rows={2}
            style={textareaStyle}
            dir="rtl"
          />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              style={saveBtn}
              onClick={handleSave}
              disabled={!text.trim() || saving}
            >
              {saving ? (
                <>
                  <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                  שומר...
                </>
              ) : "שמור"}
            </button>
            {text.length > 0 && (
              <span style={{ fontSize: 10, color: "#94a3b8" }}>{text.length}/300</span>
            )}
          </div>
        </div>
      )}

      {/* Confirmation flash */}
      <AnimatePresence>
        {justSaved && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={confirmMsg}
          >
            ✨ נשמר! תודה שלקחת רגע להכיר טובה
          </motion.div>
        )}
      </AnimatePresence>

      {/* All-done banner */}
      {isComplete && !justSaved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={completedBanner}
        >
          🌟 מדהים — תיעדת 3 תודות היום!
        </motion.div>
      )}

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </motion.div>
  );
};

export default GratitudeCard;
