import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { scheduleSleepReminder, cancelSleepReminder, scheduleAllNotifications } from "@/lib/pushNotifications";

interface Settings {
  checkin_time: string;
  sleep_reminder_time: string;
  sleep_reminder_enabled: boolean;
}

const CHECKIN_PRESETS = ["07:00", "12:00", "18:00", "20:00", "22:00"];

const NewSettings = () => {
  const navigate = useNavigate();
  const [userId, setUserId]   = useState<string | null>(null);
  const [email, setEmail]     = useState("");
  const [plan, setPlan]       = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({
    checkin_time: "20:00", sleep_reminder_time: "08:00", sleep_reminder_enabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/app/auth"); return; }
      setUserId(session.user.id);
      setEmail(session.user.email ?? "");

      const [{ data: s }, { data: sub }] = await Promise.all([
        supabase.from("user_settings").select("*").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("subscriptions").select("plan, is_active").eq("user_id", session.user.id).maybeSingle(),
      ]);
      if (s) setSettings({ checkin_time: s.checkin_time, sleep_reminder_time: s.sleep_reminder_time, sleep_reminder_enabled: s.sleep_reminder_enabled });
      if (sub) setPlan(sub.is_active ? sub.plan : null);
      setLoading(false);
    })();
  }, [navigate]);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    await supabase.from("user_settings").upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() }, { onConflict: "user_id" });

    // Update local notifications
    if (settings.sleep_reminder_enabled) {
      await scheduleSleepReminder(settings.sleep_reminder_time);
    } else {
      await cancelSleepReminder();
    }
    await scheduleAllNotifications(settings.checkin_time, settings.sleep_reminder_enabled, settings.sleep_reminder_time);

    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh" }}>
      <div style={{ width: 28, height: 28, border: "3px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "0.5px solid #f1f5f9" }}>
      <span style={{ fontSize: 14, color: "#374151", fontWeight: 600 }}>{label}</span>
      {children}
    </div>
  );

  return (
    <div dir="rtl" style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "'Heebo', sans-serif" }}>

      {/* Header */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 30,
        background: "#fff", borderBottom: "0.5px solid #e2e8f0",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "14px", paddingLeft: "20px", paddingRight: "20px",
        minHeight: "calc(56px + env(safe-area-inset-top, 0px))",
        display: "flex", alignItems: "flex-end",
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: "#0f172a" }}>הגדרות</h1>
      </div>
      <div style={{ height: "calc(56px + env(safe-area-inset-top, 0px))" }} />

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px" }}>

        {/* Account card */}
        <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #e2e8f0", padding: "16px 18px", marginBottom: 14 }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>חשבון</p>
          <Row label="אימייל">
            <span style={{ fontSize: 13, color: "#64748b" }}>{email}</span>
          </Row>
          <Row label="מנוי">
            <span style={{
              fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "3px 10px",
              background: plan ? "#dcfce7" : "#fef9c3",
              color: plan ? "#15803d" : "#92400e",
            }}>
              {plan === "yearly" ? "שנתי ✓" : plan === "monthly" ? "חודשי ✓" : plan === "trial" ? "ניסיון" : "לא פעיל"}
            </span>
          </Row>
        </div>

        {/* Notifications card */}
        <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #e2e8f0", padding: "16px 18px", marginBottom: 14 }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>התראות</p>

          {/* Check-in time */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>⏰ תזכורת Check-in יומית</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {CHECKIN_PRESETS.map(t => (
                <button key={t} onClick={() => setSettings(s => ({ ...s, checkin_time: t }))} style={{
                  padding: "6px 12px", borderRadius: 20, border: "1.5px solid",
                  borderColor: settings.checkin_time === t ? "#6366f1" : "#e2e8f0",
                  background: settings.checkin_time === t ? "#ede9fe" : "#fff",
                  color: settings.checkin_time === t ? "#6366f1" : "#64748b",
                  fontSize: 13, fontWeight: settings.checkin_time === t ? 700 : 400,
                  cursor: "pointer", fontFamily: "'Heebo', sans-serif",
                }}>
                  {t}
                </button>
              ))}
              <input type="time" value={settings.checkin_time} onChange={e => setSettings(s => ({ ...s, checkin_time: e.target.value }))}
                style={{ padding: "5px 8px", borderRadius: 20, border: "1.5px solid #e2e8f0", fontSize: 13, fontFamily: "'Heebo', sans-serif" }} />
            </div>
          </div>

          {/* Sleep reminder */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>🌙 תזכורת שינה בוקר</p>
              {/* Toggle */}
              <div
                onClick={() => setSettings(s => ({ ...s, sleep_reminder_enabled: !s.sleep_reminder_enabled }))}
                style={{
                  width: 44, height: 24, borderRadius: 12, cursor: "pointer",
                  background: settings.sleep_reminder_enabled ? "#6366f1" : "#e2e8f0",
                  position: "relative", transition: "background 0.2s",
                }}
              >
                <div style={{
                  position: "absolute", width: 18, height: 18, borderRadius: "50%", background: "#fff",
                  top: 3, left: settings.sleep_reminder_enabled ? 23 : 3, transition: "left 0.2s",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                }} />
              </div>
            </div>
            {settings.sleep_reminder_enabled && (
              <input type="time" value={settings.sleep_reminder_time} onChange={e => setSettings(s => ({ ...s, sleep_reminder_time: e.target.value }))}
                style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, fontFamily: "'Heebo', sans-serif", background: "#f8fafc" }} />
            )}
          </div>
        </div>

        {/* Save button */}
        <button onClick={save} disabled={saving} style={{
          width: "100%", padding: "13px", borderRadius: 14, border: "none",
          background: saved ? "#22c55e" : "#6366f1", color: "#fff",
          fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo', sans-serif",
          marginBottom: 14, transition: "background 0.3s",
        }}>
          {saving ? "שומר..." : saved ? "✓ נשמר" : "שמור הגדרות"}
        </button>

        {/* Logout */}
        <button onClick={logout} style={{
          width: "100%", padding: "13px", borderRadius: 14,
          border: "1px solid #fecaca", background: "#fff",
          color: "#ef4444", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo', sans-serif",
        }}>
          התנתק
        </button>

      </div>
    </div>
  );
};

export default NewSettings;
