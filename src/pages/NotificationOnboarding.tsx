import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  isNativeApp,
  requestNotificationPermission,
  scheduleDailyReminder,
  scheduleSleepReminder,
} from "@/lib/pushNotifications";

const HOURS = Array.from({ length: 18 }, (_, i) => {
  const h = (i + 6).toString().padStart(2, "0");
  return `${h}:00`;
}); // 06:00 – 23:00

const markOnboardingDone = async (dailyReminderTime: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  await supabase.from("user_preferences").upsert(
    {
      user_id: session.user.id,
      onboarding_completed: true,
      daily_reminder_time: dailyReminderTime,
    },
    { onConflict: "user_id" }
  );
};

const NotificationOnboarding = () => {
  const navigate = useNavigate();
  const [time, setTime]         = useState("21:00");
  const [loading, setLoading]   = useState(false);
  const [denied, setDenied]     = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    try {
      if (isNativeApp()) {
        const perm = await requestNotificationPermission();
        if (perm === "granted") {
          await scheduleDailyReminder(time);
          await scheduleSleepReminder();
          localStorage.setItem("nestai-notifications-enabled", "true");
        } else {
          setDenied(true);
        }
      }
      await markOnboardingDone(time);
      navigate("/app/dashboard", { replace: true });
    } catch {
      await markOnboardingDone(time);
      navigate("/app/dashboard", { replace: true });
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    await markOnboardingDone(time);
    navigate("/app/dashboard", { replace: true });
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100dvh",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "env(safe-area-inset-top, 24px) 28px 40px",
        fontFamily: "'Heebo', sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* Logo */}
      <div style={{ paddingTop: 16 }}>
        <span style={{ fontFamily: "'Righteous', sans-serif", fontSize: 20, color: "#111827" }}>
          Nest<span style={{ color: "#6366f1" }}>AI</span>
        </span>
      </div>

      {/* Center content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, width: "100%", maxWidth: 360 }}>

        {/* Icon */}
        <div style={{
          width: 90, height: 90, borderRadius: "50%",
          background: "linear-gradient(135deg, #eef2ff, #e0e7ff)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 40,
        }}>
          🔔
        </div>

        {/* Text */}
        <div style={{ textAlign: "center", gap: 8, display: "flex", flexDirection: "column" }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
            כמה שניות לפני שמתחילים
          </h1>
          <p style={{ margin: 0, fontSize: 15, color: "#64748b", lineHeight: 1.6 }}>
            NestAI ישלח לך שאלה יומית קצרה על מסך הנעילה — כל יום שאלה אחרת, בשעה שתבחר
          </p>
        </div>

        {/* Time picker */}
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
            באיזו שעה לשלוח את ההתראה?
          </label>
          <div style={{ position: "relative" }}>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{
                width: "100%", height: 52, borderRadius: 14,
                border: "1.5px solid #e2e8f0", background: "#f8fafc",
                fontSize: 18, fontWeight: 700, color: "#0f172a",
                padding: "0 16px", cursor: "pointer",
                fontFamily: "'Heebo', sans-serif",
                appearance: "none", WebkitAppearance: "none",
                textAlign: "center",
              }}
            >
              {HOURS.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            <span style={{
              position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
              fontSize: 12, color: "#94a3b8", pointerEvents: "none",
            }}>▼</span>
          </div>
        </div>

        {/* Days-of-week preview */}
        <div style={{
          width: "100%", background: "#f8fafc", borderRadius: 14,
          padding: "14px 16px", border: "0.5px solid #e2e8f0",
        }}>
          <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#6366f1" }}>
            השאלות השבועיות
          </p>
          {[
            { day: "ראשון", q: "מה הרגע שגרם לך להרגיש שהיום היה שווה?" },
            { day: "שני",   q: "מה דבר אחד שהפתיע אותך היום?" },
            { day: "שלישי", q: "מה אתה גאה בו מהיום?" },
            { day: "רביעי", q: "מה למדת על עצמך היום?" },
            { day: "חמישי", q: "מה הדבר שנתת לעצמך היום?" },
            { day: "שישי",  q: "מה היה הרגע הכי שקט שלך השבוע?" },
            { day: "שבת",   q: "מה אתה רוצה לקחת איתך לשבוע הבא?" },
          ].map(({ day, q }) => (
            <div key={day} style={{ display: "flex", gap: 8, marginBottom: 5, alignItems: "flex-start" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", minWidth: 36, paddingTop: 1 }}>{day}</span>
              <span style={{ fontSize: 11, color: "#64748b", lineHeight: 1.4 }}>{q}</span>
            </div>
          ))}
        </div>

        {/* Permission denied notice */}
        {denied && (
          <p style={{ margin: 0, fontSize: 12, color: "#ef4444", textAlign: "center" }}>
            ההתראות נחסמו. ניתן להפעיל מאוחר יותר בהגדרות המכשיר.
          </p>
        )}
      </div>

      {/* Buttons */}
      <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={handleEnable}
          disabled={loading}
          style={{
            width: "100%", height: 54, borderRadius: 16,
            background: loading ? "#a5b4fc" : "#6366f1",
            color: "#ffffff", border: "none", cursor: loading ? "default" : "pointer",
            fontSize: 16, fontWeight: 700, fontFamily: "'Heebo', sans-serif",
            transition: "background 0.2s",
          }}
        >
          {loading ? "טוען..." : "הפעל התראות ✓"}
        </button>
        <button
          onClick={handleSkip}
          disabled={loading}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontSize: 14, color: "#94a3b8", fontFamily: "'Heebo', sans-serif",
            padding: "8px 0",
          }}
        >
          דלג, אפעיל אחר כך
        </button>
      </div>
    </div>
  );
};

export default NotificationOnboarding;
