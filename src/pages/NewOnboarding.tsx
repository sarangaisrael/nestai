import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { requestNotificationPermission, scheduleAllNotifications, scheduleSleepReminder } from "@/lib/pushNotifications";

const TIME_PRESETS = [
  { label: "07:00", sublabel: "בוקר מוקדם" },
  { label: "12:00", sublabel: "צהריים" },
  { label: "18:00", sublabel: "אחה\"צ" },
  { label: "20:00", sublabel: "ערב" },
  { label: "22:00", sublabel: "לילה" },
];

const NewOnboarding = () => {
  const navigate = useNavigate();
  const [step, setStep]         = useState<1 | 2>(1);
  const [checkinTime, setTime]  = useState("20:00");
  const [saving, setSaving]     = useState(false);

  const saveAndNext = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from("user_settings").upsert(
        { user_id: session.user.id, checkin_time: checkinTime, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
    }
    setSaving(false);
    setStep(2);
  };

  const requestPermission = async () => {
    await requestNotificationPermission();
    // Schedule with default sleep reminder enabled
    await scheduleAllNotifications(checkinTime, true, "08:00");
    await scheduleSleepReminder("08:00");
    navigate("/app/dashboard");
  };

  return (
    <div dir="rtl" style={{
      minHeight: "100dvh", background: "#f8fafc", fontFamily: "'Heebo', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "24px 20px",
    }}>

      {/* Logo */}
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <span style={{ fontSize: 28, fontFamily: "'Righteous', cursive", color: "#6366f1" }}>LogMe</span>
      </div>

      <AnimatePresence mode="wait">

        {/* Step 1 — time picker */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            style={{ width: "100%", maxWidth: 380 }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", border: "0.5px solid #e2e8f0" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", margin: "0 0 8px", textAlign: "center" }}>שלב 1 מתוך 2</p>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 6px", textAlign: "center" }}>מתי לתזכר אותך?</h2>
              <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 24px", textAlign: "center", lineHeight: 1.5 }}>
                כל יום נשלח לך תזכורת לעדכן את מצב הרוח שלך
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {TIME_PRESETS.map(({ label, sublabel }) => (
                  <button key={label} onClick={() => setTime(label)} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px", borderRadius: 12,
                    border: checkinTime === label ? "2px solid #6366f1" : "1.5px solid #e2e8f0",
                    background: checkinTime === label ? "#ede9fe" : "#fff",
                    cursor: "pointer", fontFamily: "'Heebo', sans-serif",
                  }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: checkinTime === label ? "#6366f1" : "#0f172a" }}>{label}</span>
                    <span style={{ fontSize: 12, color: checkinTime === label ? "#818cf8" : "#94a3b8" }}>{sublabel}</span>
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>שעה אחרת:</span>
                <input type="time" value={checkinTime} onChange={e => setTime(e.target.value)}
                  style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, fontFamily: "'Heebo', sans-serif", flex: 1 }} />
              </div>

              <button onClick={saveAndNext} disabled={saving} style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: "#6366f1", color: "#fff",
                fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo', sans-serif",
              }}>
                {saving ? "שומר..." : "המשך ←"}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 2 — push permission */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            style={{ width: "100%", maxWidth: 380 }}>
            <div style={{ background: "#fff", borderRadius: 20, padding: "28px 24px", border: "0.5px solid #e2e8f0", textAlign: "center" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#6366f1", margin: "0 0 8px" }}>שלב 2 מתוך 2</p>
              <div style={{ fontSize: 56, margin: "0 0 16px" }}>🔔</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 10px" }}>אפשר לשלוח התראות?</h2>
              <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 28px", lineHeight: 1.6 }}>
                נשלח לך תזכורת ב-{checkinTime} כל יום,<br />
                ותזכורת בוקר לרשום את השינה שלך
              </p>

              <button onClick={requestPermission} style={{
                width: "100%", padding: "14px", borderRadius: 14, border: "none",
                background: "#6366f1", color: "#fff",
                fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo', sans-serif",
                marginBottom: 12,
              }}>
                כן, שלח התראות 🔔
              </button>

              <button onClick={() => navigate("/app/dashboard")} style={{
                width: "100%", padding: "12px", borderRadius: 14,
                border: "1px solid #e2e8f0", background: "#fff",
                color: "#64748b", fontSize: 14, cursor: "pointer", fontFamily: "'Heebo', sans-serif",
              }}>
                אחר כך
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Step dots */}
      <div style={{ display: "flex", gap: 8, marginTop: 28 }}>
        {[1, 2].map(s => (
          <div key={s} style={{ width: s === step ? 20 : 8, height: 8, borderRadius: 4, background: s === step ? "#6366f1" : "#e2e8f0", transition: "width 0.3s" }} />
        ))}
      </div>
    </div>
  );
};

export default NewOnboarding;
