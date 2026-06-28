import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Summary {
  id: string;
  type: "weekly" | "monthly";
  label: string;
  created_at: string;
  summary_text: string;
}

const Summaries = () => {
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [loading, setLoading]     = useState(true);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      const uid = session.user.id;

      const [{ data: weeklies }, { data: monthlies }] = await Promise.all([
        supabase.from("weekly_summaries").select("id, created_at")
          .eq("user_id", uid).order("created_at", { ascending: false }).limit(20),
        supabase.from("monthly_summaries").select("id, created_at")
          .eq("user_id", uid).order("created_at", { ascending: false }).limit(20),
      ]);

      const all: Summary[] = [
        ...(weeklies ?? []).map(r => ({ id: r.id, type: "weekly" as const, label: "סיכום שבועי", created_at: r.created_at, summary_text: "" })),
        ...(monthlies ?? []).map(r => ({ id: r.id, type: "monthly" as const, label: "סיכום חודשי", created_at: r.created_at, summary_text: "" })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setSummaries(all);
      setLoading(false);
    })();
  }, []);

  const expand = async (s: Summary) => {
    if (expanded === s.id) { setExpanded(null); return; }
    setExpanded(s.id);
    if (s.summary_text) return;

    setDecrypting(s.id);
    const res = await supabase.functions.invoke("get-decrypted-summary", { body: { summary_id: s.id } });
    const text: string = res.error ? "" : (res.data?.summary_text ?? "");
    setSummaries(prev => prev.map(x => x.id === s.id ? { ...x, summary_text: text } : x));
    setDecrypting(null);
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
        display: "flex", alignItems: "flex-end", gap: 12,
      }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#94a3b8", fontSize: 18 }}>
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#0f172a" }}>סיכומים</h1>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>
        {loading ? (
          <p style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0" }}>טוען...</p>
        ) : summaries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "#fff", borderRadius: 16, border: "0.5px solid #e2e8f0" }}>
            <p style={{ fontSize: 40, margin: "0 0 12px" }}>📋</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>אין עדיין סיכומים</p>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>הסיכום השבועי נוצר אוטומטית כל שבוע</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {summaries.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div
                  onClick={() => expand(s)}
                  style={{
                    background: "#fff", borderRadius: 16, border: "0.5px solid #e2e8f0",
                    overflow: "hidden", cursor: "pointer",
                  }}
                >
                  {/* Card header */}
                  <div style={{
                    background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                    padding: "14px 16px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>{s.type === "weekly" ? "📋" : "📅"}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#fff" }}>{s.label}</p>
                        <p style={{ margin: 0, fontSize: 11, color: "#a5b4fc" }}>
                          {new Date(s.created_at).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, color: "#818cf8", transition: "transform 0.2s", transform: expanded === s.id ? "rotate(180deg)" : "none" }}>
                      ▼
                    </span>
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {expanded === s.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ padding: "16px" }}>
                          {decrypting === s.id ? (
                            <p style={{ textAlign: "center", color: "#94a3b8", fontSize: 13, padding: "8px 0" }}>טוען...</p>
                          ) : s.summary_text ? (
                            <p style={{ margin: 0, fontSize: 14, color: "#374151", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                              {s.summary_text}
                            </p>
                          ) : (
                            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "8px 0" }}>
                              הסיכום אינו זמין כרגע
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Summaries;
