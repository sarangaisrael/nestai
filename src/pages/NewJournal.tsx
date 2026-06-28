import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const MOOD_EMOJIS = ["😔", "😕", "😐", "🙂", "😊"];
const MOOD_LABELS = ["קשה", "לא טוב", "בסדר", "טוב", "מעולה"];

interface Entry {
  id: string;
  content: string;
  mood: number | null;
  created_at: string;
}

const NewJournal = () => {
  const [entries, setEntries]         = useState<Entry[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showNew, setShowNew]         = useState(false);
  const [content, setContent]         = useState("");
  const [mood, setMood]               = useState<number | null>(null);
  const [saving, setSaving]           = useState(false);
  const [userId, setUserId]           = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase
        .from("journal_entries")
        .select("id, content, mood, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setEntries((data ?? []) as Entry[]);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!userId || !content.trim()) return;
    setSaving(true);
    const { data: row } = await supabase
      .from("journal_entries")
      .insert({ user_id: userId, content: content.trim(), mood })
      .select()
      .single();
    if (row) setEntries(p => [row as Entry, ...p]);
    setContent("");
    setMood(null);
    setShowNew(false);
    setSaving(false);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", weekday: "short" });
  };

  return (
    <div dir="rtl" style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "'Heebo', sans-serif" }}>

      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        background: "#fff", borderBottom: "0.5px solid #e2e8f0",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "14px", paddingLeft: "20px", paddingRight: "20px",
        minHeight: "calc(56px + env(safe-area-inset-top, 0px))",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" }}>יומן</h1>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>כתיבה חופשית ללא תגובה</p>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>

        {/* New entry button */}
        <button onClick={() => setShowNew(true)} style={{
          width: "100%", padding: "13px", borderRadius: 14, border: "none",
          background: "#6366f1", color: "#fff",
          fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo', sans-serif",
          marginBottom: 18, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        }}>
          <span style={{ fontSize: 18 }}>+</span> רשומה חדשה
        </button>

        {/* New entry form */}
        <AnimatePresence>
          {showNew && (
            <motion.div key="new-form" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #e2e8f0", padding: "18px", marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>רשומה חדשה</p>
                  <button onClick={() => setShowNew(false)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" }}>✕</button>
                </div>

                <textarea
                  autoFocus
                  placeholder="כתוב כאן בחופשיות..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  rows={5}
                  style={{
                    width: "100%", padding: "12px", borderRadius: 10, border: "1px solid #e2e8f0",
                    fontSize: 15, fontFamily: "'Heebo', sans-serif", resize: "none",
                    background: "#f8fafc", boxSizing: "border-box", marginBottom: 14,
                    lineHeight: 1.6,
                  }}
                />

                {/* Optional mood */}
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>מצב רוח (אופציונלי)</p>
                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  {MOOD_EMOJIS.map((em, i) => (
                    <button key={i} onClick={() => setMood(mood === i + 1 ? null : i + 1)} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                      background: mood === i + 1 ? "#ede9fe" : "transparent",
                      border: mood === i + 1 ? "2px solid #6366f1" : "2px solid transparent",
                      borderRadius: 8, padding: "5px 6px", cursor: "pointer", flex: 1,
                    }}>
                      <span style={{ fontSize: 20 }}>{em}</span>
                      <span style={{ fontSize: 8, color: mood === i + 1 ? "#6366f1" : "#94a3b8" }}>{MOOD_LABELS[i]}</span>
                    </button>
                  ))}
                </div>

                <button onClick={save} disabled={!content.trim() || saving} style={{
                  width: "100%", padding: "12px", borderRadius: 12, border: "none",
                  background: content.trim() ? "#6366f1" : "#e2e8f0",
                  color: content.trim() ? "#fff" : "#94a3b8",
                  fontSize: 14, fontWeight: 700, cursor: content.trim() ? "pointer" : "default",
                  fontFamily: "'Heebo', sans-serif",
                }}>
                  {saving ? "שומר..." : "שמור רשומה"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entries list */}
        {loading ? (
          <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 14 }}>טוען...</p>
        ) : entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>📓</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>היומן ריק</p>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>לחץ על "רשומה חדשה" כדי להתחיל לכתוב</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {entries.map(entry => (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e2e8f0", padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{formatDate(entry.created_at)}</span>
                    {entry.mood && <span style={{ fontSize: 18 }}>{MOOD_EMOJIS[entry.mood - 1]}</span>}
                  </div>
                  <p style={{
                    margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.6,
                    display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" as const, overflow: "hidden",
                  }}>
                    {entry.content}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NewJournal;
