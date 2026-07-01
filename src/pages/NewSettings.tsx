import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { scheduleSleepReminder, cancelSleepReminder, scheduleAllNotifications } from "@/lib/pushNotifications";
import { decryptText } from "@/utils/encryption";

interface Settings {
  checkin_time: string;
  sleep_reminder_time: string;
  sleep_reminder_enabled: boolean;
}

interface SummaryPrefs {
  weekly_time: string;
  monthly_time: string;
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
  const [summaryPrefs, setSummaryPrefs] = useState<SummaryPrefs>({ weekly_time: "20:00", monthly_time: "20:00" });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/app/auth"); return; }
      setUserId(session.user.id);
      setEmail(session.user.email ?? "");

      const [{ data: s }, { data: sub }, { data: prefs }] = await Promise.all([
        supabase.from("user_settings").select("*").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("subscriptions").select("plan, is_active").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("user_preferences").select("summary_time, monthly_summary_time").eq("user_id", session.user.id).maybeSingle(),
      ]);
      if (s) setSettings({ checkin_time: s.checkin_time, sleep_reminder_time: s.sleep_reminder_time, sleep_reminder_enabled: s.sleep_reminder_enabled });
      if (sub) setPlan(sub.is_active ? sub.plan : null);
      if (prefs) setSummaryPrefs({ weekly_time: prefs.summary_time ?? "20:00", monthly_time: prefs.monthly_summary_time ?? "20:00" });
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
    await scheduleAllNotifications(
      "saturday",
      "20:00",
      settings.checkin_time,
      settings.sleep_reminder_enabled,
      settings.sleep_reminder_time
    );

    await supabase.from("user_preferences").upsert({
      user_id: userId,
      summary_time: summaryPrefs.weekly_time,
      monthly_summary_time: summaryPrefs.monthly_time,
    }, { onConflict: "user_id" });

    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExportData = async () => {
    if (!userId) return;
    setExporting(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const [
        { data: preferences },
        { data: messages },
        { data: journalEntries },
        { data: checkins },
        { data: sleepLogs },
        { data: weeklySummaries },
        { data: appSettings },
        { data: gratitudeEntries },
      ] = await Promise.all([
        supabase.from("user_preferences").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("messages").select("id, role, text, created_at").eq("user_id", userId).order("created_at"),
        supabase.from("journal_entries").select("id, content, mood, created_at").eq("user_id", userId).order("created_at"),
        supabase.from("daily_checkins").select("id, date, mood, activities, note, created_at").eq("user_id", userId).order("date"),
        supabase.from("sleep_logs").select("id, date, sleep_hours, sleep_quality, sleep_time, wake_time, created_at").eq("user_id", userId).order("date"),
        supabase.from("weekly_summaries").select("id, week_start, week_end, summary_text, created_at").eq("user_id", userId).order("created_at"),
        supabase.from("user_settings").select("checkin_time, sleep_reminder_time, sleep_reminder_enabled, custom_activities, mood_labels").eq("user_id", userId).maybeSingle(),
        supabase.from("gratitude_entries").select("id, content, created_at").eq("user_id", userId).order("created_at"),
      ]);

      const decryptedMessages = await Promise.all(
        (messages ?? []).map(async m => ({ ...m, text: await decryptText(m.text, userId) }))
      );
      const decryptedJournal = await Promise.all(
        (journalEntries ?? []).map(async e => ({ ...e, content: await decryptText(e.content, userId) }))
      );
      const decryptedCheckins = await Promise.all(
        (checkins ?? []).map(async c => ({ ...c, note: c.note ? await decryptText(c.note, userId) : null }))
      );
      const decryptedSummaries = await Promise.all(
        (weeklySummaries ?? []).map(async s => ({ ...s, summary_text: await decryptText(s.summary_text, userId) }))
      );

      const exportPayload = {
        export_date: new Date().toISOString(),
        export_format_version: "1.0",
        account: {
          email: authUser?.email ?? null,
          registered_at: authUser?.created_at ?? null,
          terms_accepted_at: preferences?.terms_accepted_at ?? null,
        },
        preferences: preferences ? {
          therapy_type: preferences.therapy_type ?? null,
          summary_focus: preferences.summary_focus ?? [],
          terms_accepted_at: preferences.terms_accepted_at ?? null,
        } : null,
        app_settings: appSettings ?? null,
        chat_messages: decryptedMessages,
        journal_entries: decryptedJournal,
        daily_checkins: decryptedCheckins,
        sleep_logs: sleepLogs ?? [],
        weekly_summaries: decryptedSummaries,
        gratitude_entries: gratitudeEntries ?? [],
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nestai-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/app/auth", { replace: true });
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

        {/* Summaries card */}
        <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #e2e8f0", padding: "16px 18px", marginBottom: 14 }}>
          <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>סיכומים</p>

          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>📋 שעת שליחת סיכום שבועי</p>
            <input
              type="time"
              value={summaryPrefs.weekly_time}
              onChange={e => setSummaryPrefs(p => ({ ...p, weekly_time: e.target.value }))}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, fontFamily: "'Heebo', sans-serif", background: "#f8fafc" }}
            />
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>נשלח בכל שבת בשעה הנבחרת</p>
          </div>

          <div>
            <p style={{ margin: "0 0 8px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>📅 שעת שליחת סיכום חודשי</p>
            <input
              type="time"
              value={summaryPrefs.monthly_time}
              onChange={e => setSummaryPrefs(p => ({ ...p, monthly_time: e.target.value }))}
              style={{ padding: "8px 12px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, fontFamily: "'Heebo', sans-serif", background: "#f8fafc" }}
            />
            <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>נשלח ב-1 לחודש בשעה הנבחרת</p>
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

        {/* Export data */}
        <button onClick={handleExportData} disabled={exporting} style={{
          width: "100%", padding: "13px", borderRadius: 14,
          border: "1px solid #e2e8f0", background: "#fff",
          color: "#475569", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo', sans-serif",
          marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          opacity: exporting ? 0.6 : 1,
        }}>
          {exporting ? "מייצא..." : "⬇ ייצוא הנתונים שלי"}
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
