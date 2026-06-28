import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

// ── Types ────────────────────────────────────────────────────────────────────

type AppState = "morning" | "daytime" | "checkin" | "done";

interface CheckinData {
  mood: number;
  activities: string[];
  note: string;
  created_at: string;
}

interface SleepData {
  sleep_hours: number | null;
  sleep_quality: number | null;
  sleep_time: string | null;
  wake_time: string | null;
}

interface UserSettings {
  checkin_time: string;
  sleep_reminder_time: string;
  sleep_reminder_enabled: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const MOOD_EMOJIS  = ["😔", "😕", "😐", "🙂", "😊"];
const MOOD_LABELS  = ["קשה", "לא טוב", "בסדר", "טוב", "מעולה"];
const QUALITY_EMOJIS = ["😴", "😕", "😐", "🙂", "😊"];
const QUALITY_LABELS = ["גרוע", "לא טוב", "בסדר", "טוב", "מעולה"];

const DEFAULT_ACTIVITIES = [
  { id: "work",     label: "עבודה",       emoji: "💼" },
  { id: "sport",    label: "ספורט",       emoji: "🏋️" },
  { id: "walk",     label: "הליכה/ריצה", emoji: "🚶" },
  { id: "sleep",    label: "שינה טובה",   emoji: "😴" },
  { id: "date",     label: "דייט",        emoji: "👫" },
  { id: "friends",  label: "חברים",       emoji: "👥" },
  { id: "family",   label: "משפחה",       emoji: "📞" },
];

const WEEK_BAR_COLORS: Record<number, string> = {
  1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#22c55e", 5: "#6366f1",
};

function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date());
}

function israelHour() {
  return parseInt(
    new Intl.DateTimeFormat("he-IL", { hour: "numeric", hour12: false, timeZone: "Asia/Jerusalem" }).format(new Date()),
    10
  );
}

function getAppState(checkinTime: string, hasTodayCheckin: boolean): AppState {
  if (hasTodayCheckin) return "done";
  const hour = israelHour();
  if (hour >= 0 && hour < 11) return "morning";
  const [hh] = checkinTime.split(":").map(Number);
  if (hour >= hh) return "checkin";
  return "daytime";
}

function getGreeting(): string {
  const h = israelHour();
  if (h >= 0  && h < 11) return "בוקר טוב ☀️";
  if (h >= 11 && h < 14) return "צהריים טובים 🌤️";
  if (h >= 14 && h < 18) return "אחר הצהריים ☀️";
  return "ערב טוב 🌙";
}

function calcSleepHours(sleep: string, wake: string): number | null {
  if (!sleep || !wake) return null;
  const [sh, sm] = sleep.split(":").map(Number);
  const [wh, wm] = wake.split(":").map(Number);
  let mins = (wh * 60 + wm) - (sh * 60 + sm);
  if (mins <= 0) mins += 24 * 60;
  return Math.round(mins / 60 * 10) / 10;
}

// ── Mini streak counter ───────────────────────────────────────────────────────

async function fetchStreak(userId: string): Promise<number> {
  const { data } = await supabase
    .from("daily_checkins")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(30);
  if (!data || data.length === 0) return 0;
  let streak = 0;
  const today = new Date(todayISO());
  for (let i = 0; i < data.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const iso = expected.toISOString().slice(0, 10);
    if (data[i].date === iso) streak++;
    else break;
  }
  return streak;
}

// ── Main component ────────────────────────────────────────────────────────────

const Home = () => {
  const navigate = useNavigate();

  const [userId, setUserId]         = useState<string | null>(null);
  const [appState, setAppState]     = useState<AppState>("daytime");
  const [checkinData, setCheckin]   = useState<CheckinData | null>(null);
  const [yesterdayData, setYesterday] = useState<CheckinData | null>(null);
  const [weekData, setWeekData]     = useState<{ date: string; mood: number }[]>([]);
  const [sleepData, setSleepData]   = useState<SleepData | null>(null);
  const [sleepLogged, setSleepLogged] = useState(false);
  const [settings, setSettings]    = useState<UserSettings>({ checkin_time: "20:00", sleep_reminder_time: "08:00", sleep_reminder_enabled: true });
  const [streak, setStreak]         = useState(0);
  const [loading, setLoading]       = useState(true);
  const [hasWeeklySummary, setHasWeeklySummary] = useState(false);
  const [totalCheckins, setTotalCheckins] = useState(0);

  // Quick journal state
  const [quickNote, setQuickNote]   = useState("");
  const [savingQuick, setSavingQuick] = useState(false);
  const [quickSaved, setQuickSaved] = useState(false);

  // Sleep card state
  const [sleepTime, setSleepTime]   = useState("23:00");
  const [wakeTime, setWakeTime]     = useState("07:00");
  const [sleepQuality, setSleepQuality] = useState<number | null>(null);
  const [savingSleep, setSavingSleep] = useState(false);

  // Check-in state
  const [selectedMood, setMood]     = useState<number | null>(null);
  const [checkinStep, setCheckinStep] = useState<"mood" | "activities">("mood");
  const [selectedActivities, setActivities] = useState<string[]>([]);
  const [note, setNote]             = useState("");
  const [savingCheckin, setSavingCheckin] = useState(false);

  const load = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/app/auth"); return; }
    const uid = session.user.id;
    setUserId(uid);

    const today = todayISO();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yday = yesterday.toISOString().slice(0, 10);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const weekStart = weekAgo.toISOString().slice(0, 10);

    const [
      { data: settingsRow },
      { data: todayCheckin },
      { data: yCheckin },
      { data: weekCheckins },
      { data: todaySleep },
      { data: summaries },
      { count: checkinCount },
    ] = await Promise.all([
      supabase.from("user_settings").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("daily_checkins").select("*").eq("user_id", uid).eq("date", today).maybeSingle(),
      supabase.from("daily_checkins").select("*").eq("user_id", uid).eq("date", yday).maybeSingle(),
      supabase.from("daily_checkins").select("date, mood").eq("user_id", uid).gte("date", weekStart).lte("date", today).order("date"),
      supabase.from("sleep_logs").select("sleep_hours, sleep_quality, sleep_time, wake_time").eq("user_id", uid).eq("date", today).maybeSingle(),
      supabase.from("weekly_summaries").select("id").eq("user_id", uid).order("created_at", { ascending: false }).limit(1),
      supabase.from("daily_checkins").select("id", { count: "exact", head: true }).eq("user_id", uid),
    ]);

    const s = settingsRow ?? { checkin_time: "20:00", sleep_reminder_time: "08:00", sleep_reminder_enabled: true };
    setSettings(s);
    setCheckin(todayCheckin as CheckinData | null);
    setYesterday(yCheckin as CheckinData | null);
    setWeekData((weekCheckins ?? []) as { date: string; mood: number }[]);
    setSleepData(todaySleep as SleepData | null);
    setSleepLogged(!!todaySleep && (todaySleep.sleep_hours ?? 0) > 0);
    setHasWeeklySummary((summaries ?? []).length > 0);
    setTotalCheckins(checkinCount ?? 0);
    setAppState(getAppState(s.checkin_time, !!todayCheckin));

    const streakVal = await fetchStreak(uid);
    setStreak(streakVal);
    setLoading(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  // ── Save sleep ──────────────────────────────────────────────────────────────
  const saveSleep = async () => {
    if (!userId || !sleepQuality) return;
    setSavingSleep(true);
    const hours = calcSleepHours(sleepTime, wakeTime);
    await supabase.from("sleep_logs").upsert({
      user_id: userId,
      date: todayISO(),
      sleep_time: sleepTime + ":00",
      wake_time: wakeTime + ":00",
      sleep_hours: hours,
      sleep_quality: sleepQuality,
    }, { onConflict: "user_id,date" });
    setSleepLogged(true);
    setSavingSleep(false);
  };

  // ── Save check-in ───────────────────────────────────────────────────────────
  const saveCheckin = async () => {
    if (!userId || !selectedMood) return;
    setSavingCheckin(true);
    const today = todayISO();
    await supabase.from("daily_checkins").upsert({
      user_id: userId, date: today, mood: selectedMood,
      activities: selectedActivities, note,
    }, { onConflict: "user_id,date" });
    setCheckin({ mood: selectedMood, activities: selectedActivities, note, created_at: new Date().toISOString() });
    setAppState("done");
    setSavingCheckin(false);
  };

  // ── Save quick journal entry ────────────────────────────────────────────────
  const saveQuickNote = async () => {
    if (!userId || !quickNote.trim()) return;
    setSavingQuick(true);
    await supabase.from("journal_entries").insert({
      user_id: userId,
      content: quickNote.trim(),
    });
    setQuickNote("");
    setQuickSaved(true);
    setSavingQuick(false);
    setTimeout(() => setQuickSaved(false), 2500);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100dvh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 28, height: 28, border: "3px solid #6366f1", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const sleepHoursCalc = calcSleepHours(sleepTime, wakeTime);
  const isMorning = appState === "morning";
  const isCheckin = appState === "checkin";
  const isDone = appState === "done";

  return (
    <div dir="rtl" style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "'Heebo', sans-serif" }}>

      {/* ── Topbar ─────────────────────────────────────────────────────────── */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 30,
        background: "#ffffff",
        borderBottom: "0.5px solid #e2e8f0",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: 0,
        paddingLeft: "20px",
        paddingRight: "20px",
        minHeight: "calc(56px + env(safe-area-inset-top, 0px))",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        {/* Settings icon — left side (RTL: visual left = logical right) */}
        <button onClick={() => navigate("/app/settings")} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#94a3b8" }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>

        {/* Logo — center */}
        <span style={{ fontSize: 20, fontFamily: "'Righteous', cursive", color: "#6366f1", letterSpacing: 0.5 }}>
          NestAI
        </span>

        {/* Streak — right */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 18 }}>🔥</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{streak}</span>
        </div>
      </div>

      {/* Spacer so fixed topbar doesn't overlap content */}
      <div style={{ height: "calc(56px + env(safe-area-inset-top, 0px))" }} />

      {/* ── Page body ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 16px" }}>

        {/* Greeting */}
        {!isCheckin && (
          <p style={{ fontSize: 24, fontWeight: 900, color: "#0f172a", margin: "0 0 20px" }}>
            {isDone ? (checkinData?.mood && checkinData.mood >= 4 ? "כיף שהיה יום טוב 😊" : "תודה ששיתפת את היום שלך") : getGreeting()}
          </p>
        )}

        <AnimatePresence mode="wait">

          {/* ── STATE: MORNING (sleep card) ─────────────────────────────── */}
          {isMorning && !sleepLogged && (
            <motion.div key="sleep-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{
                background: "#fff", borderRadius: 16, border: "2px solid #818cf8",
                padding: "18px 18px 20px", marginBottom: 14,
                boxShadow: "0 2px 16px rgba(99,102,241,0.08)",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>🌙</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>איך ישנת הלילה?</span>
                  </div>
                  <span style={{ fontSize: 11, background: "#ede9fe", color: "#6366f1", borderRadius: 20, padding: "3px 10px", fontWeight: 700 }}>עד 11:00</span>
                </div>

                {/* Time inputs */}
                <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 5px", fontWeight: 600 }}>הלכתי לישון</p>
                    <input type="time" value={sleepTime} onChange={e => setSleepTime(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, fontFamily: "'Heebo', sans-serif", background: "#f8fafc", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 5px", fontWeight: 600 }}>התעוררתי</p>
                    <input type="time" value={wakeTime} onChange={e => setWakeTime(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 10, border: "1px solid #e2e8f0", fontSize: 16, fontFamily: "'Heebo', sans-serif", background: "#f8fafc", boxSizing: "border-box" }} />
                  </div>
                </div>

                {/* Hours pill */}
                {sleepHoursCalc !== null && (
                  <div style={{ textAlign: "center", marginBottom: 14 }}>
                    <span style={{ background: "#dcfce7", color: "#16a34a", borderRadius: 20, padding: "4px 14px", fontSize: 13, fontWeight: 700 }}>
                      {sleepHoursCalc} שעות שינה
                    </span>
                  </div>
                )}

                {/* Quality */}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  {QUALITY_EMOJIS.map((em, i) => (
                    <button key={i} onClick={() => setSleepQuality(i + 1)} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                      background: sleepQuality === i + 1 ? "#ede9fe" : "transparent",
                      border: sleepQuality === i + 1 ? "2px solid #6366f1" : "2px solid transparent",
                      borderRadius: 10, padding: "6px 8px", cursor: "pointer", fontFamily: "'Heebo', sans-serif",
                    }}>
                      <span style={{ fontSize: 22 }}>{em}</span>
                      <span style={{ fontSize: 9, color: sleepQuality === i + 1 ? "#6366f1" : "#94a3b8", fontWeight: 600 }}>{QUALITY_LABELS[i]}</span>
                    </button>
                  ))}
                </div>

                <button onClick={saveSleep} disabled={!sleepQuality || savingSleep} style={{
                  width: "100%", padding: "12px", borderRadius: 12, border: "none",
                  background: sleepQuality ? "#6366f1" : "#e2e8f0",
                  color: sleepQuality ? "#fff" : "#94a3b8",
                  fontSize: 15, fontWeight: 700, cursor: sleepQuality ? "pointer" : "default",
                  fontFamily: "'Heebo', sans-serif",
                }}>
                  {savingSleep ? "שומר..." : "שמור שינה ✓"}
                </button>
              </div>
            </motion.div>
          )}

          {/* Sleep logged confirmation */}
          {isMorning && sleepLogged && (
            <motion.div key="sleep-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ background: "#f0fdf4", borderRadius: 14, padding: "14px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 20 }}>✅</span>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#15803d" }}>שינה נרשמה</p>
                  {sleepData?.sleep_hours && <p style={{ margin: 0, fontSize: 12, color: "#166534" }}>{sleepData.sleep_hours} שעות • {QUALITY_LABELS[(sleepData.sleep_quality ?? 3) - 1]}</p>}
                </div>
              </div>
            </motion.div>
          )}

          {/* ── STATE: CHECK-IN (mood + activities) ─────────────────────── */}
          {isCheckin && (
            <motion.div key="checkin" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {checkinStep === "mood" ? (
                <div style={{
                  background: "linear-gradient(135deg, #6366f1, #818cf8)",
                  borderRadius: 20, padding: "24px 20px 28px",
                  marginBottom: 14,
                }}>
                  <p style={{ fontSize: 22, fontWeight: 900, color: "#fff", margin: "0 0 24px", textAlign: "center" }}>
                    ערב טוב 🌙<br />
                    <span style={{ fontSize: 17, fontWeight: 600 }}>איך היה היום?</span>
                  </p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                    {MOOD_EMOJIS.map((em, i) => (
                      <button key={i} onClick={() => { setMood(i + 1); setCheckinStep("activities"); }} style={{
                        display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                        background: "rgba(255,255,255,0.15)", border: "2px solid transparent",
                        borderRadius: 14, padding: "10px 8px", cursor: "pointer", fontFamily: "'Heebo', sans-serif",
                        WebkitTapHighlightColor: "transparent",
                      }}>
                        <span style={{ fontSize: 30 }}>{em}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{MOOD_LABELS[i]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ background: "#fff", borderRadius: 20, border: "0.5px solid #e2e8f0", padding: "20px 18px", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                    <button onClick={() => setCheckinStep("mood")} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#94a3b8" }}>←</button>
                    <span style={{ fontSize: 28 }}>{MOOD_EMOJIS[(selectedMood ?? 1) - 1]}</span>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#0f172a" }}>מה עשית היום?</p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 16 }}>
                    {DEFAULT_ACTIVITIES.map(act => {
                      const on = selectedActivities.includes(act.id);
                      return (
                        <button key={act.id} onClick={() => setActivities(p => on ? p.filter(a => a !== act.id) : [...p, act.id])} style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                          background: on ? "#ede9fe" : "#f8fafc",
                          border: on ? "2px solid #6366f1" : "2px solid #e2e8f0",
                          borderRadius: 12, padding: "10px 6px", cursor: "pointer", fontFamily: "'Heebo', sans-serif",
                        }}>
                          <span style={{ fontSize: 22 }}>{act.emoji}</span>
                          <span style={{ fontSize: 10, color: on ? "#6366f1" : "#64748b", fontWeight: on ? 700 : 400 }}>{act.label}</span>
                        </button>
                      );
                    })}
                    <button onClick={() => {}} style={{
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      background: "#f8fafc", border: "2px dashed #e2e8f0",
                      borderRadius: 12, padding: "10px 6px", cursor: "pointer",
                    }}>
                      <span style={{ fontSize: 22 }}>➕</span>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>הוסף</span>
                    </button>
                  </div>

                  <textarea
                    placeholder="הוסף הערה (אופציונלי)..."
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 10, border: "1px solid #e2e8f0",
                      fontSize: 14, fontFamily: "'Heebo', sans-serif", resize: "none",
                      background: "#f8fafc", boxSizing: "border-box", marginBottom: 14,
                    }}
                  />

                  <button onClick={saveCheckin} disabled={savingCheckin} style={{
                    width: "100%", padding: "13px", borderRadius: 12, border: "none",
                    background: "#6366f1", color: "#fff",
                    fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo', sans-serif",
                  }}>
                    {savingCheckin ? "שומר..." : "שמור יום ✓"}
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {/* ── STATE: DONE — today's summary ───────────────────────────── */}
          {isDone && checkinData && (
            <motion.div key="today-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={{ background: "#fff", borderRadius: 16, border: "0.5px solid #e2e8f0", padding: "16px 18px", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 32 }}>{MOOD_EMOJIS[(checkinData.mood ?? 1) - 1]}</span>
                    <div>
                      <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#0f172a" }}>{MOOD_LABELS[(checkinData.mood ?? 1) - 1]}</p>
                      <p style={{ margin: 0, fontSize: 11, color: "#94a3b8" }}>
                        {new Date(checkinData.created_at).toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { setAppState("checkin"); setCheckinStep("mood"); setMood(null); }} style={{
                    background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "5px 10px",
                    fontSize: 12, color: "#64748b", cursor: "pointer", fontFamily: "'Heebo', sans-serif",
                  }}>עדכן</button>
                </div>
                {(checkinData.activities ?? []).length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {(checkinData.activities ?? []).map(a => {
                      const act = DEFAULT_ACTIVITIES.find(d => d.id === a);
                      return act ? (
                        <span key={a} style={{ background: "#f1f5f9", borderRadius: 20, padding: "3px 10px", fontSize: 12, color: "#475569" }}>
                          {act.emoji} {act.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Weekly summary banner */}
              {hasWeeklySummary && (
                <div onClick={() => navigate("/app/summaries")} style={{
                  background: "linear-gradient(135deg, #1e1b4b, #312e81)",
                  borderRadius: 16, padding: "16px 18px", marginBottom: 14, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontSize: 13, fontWeight: 800, color: "#fff" }}>הסיכום השבועי מוכן ✨</p>
                    <p style={{ margin: 0, fontSize: 11, color: "#a5b4fc" }}>לחץ לצפייה</p>
                  </div>
                  <span style={{ fontSize: 20 }}>📋</span>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── Yesterday card (shown in morning + daytime) ──────────────── */}
        {!isCheckin && yesterdayData && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e2e8f0", padding: "14px 16px", marginBottom: 14 }}>
              <p style={{ margin: "0 0 8px", fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>אתמול</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 26 }}>{MOOD_EMOJIS[(yesterdayData.mood ?? 1) - 1]}</span>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                  {yesterdayData.mood >= 4 ? "היה יום טוב 🌟" : yesterdayData.mood === 3 ? "יום סביר" : "יום לא קל"}
                </p>
              </div>
              {(yesterdayData.activities ?? []).length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {(yesterdayData.activities ?? []).slice(0, 4).map(a => {
                    const act = DEFAULT_ACTIVITIES.find(d => d.id === a);
                    return act ? (
                      <span key={a} style={{ background: "#f1f5f9", borderRadius: 20, padding: "2px 8px", fontSize: 11, color: "#64748b" }}>
                        {act.emoji} {act.label}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Weekly bar chart ─────────────────────────────────────────── */}
        {weekData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "0.5px solid #e2e8f0", padding: "14px 16px", marginBottom: 14 }}>
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>מצב רוח — 7 ימים אחרונים</p>
              <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 60 }}>
                {Array.from({ length: 7 }).map((_, i) => {
                  const d = new Date(todayISO());
                  d.setDate(d.getDate() - (6 - i));
                  const iso = d.toISOString().slice(0, 10);
                  const entry = weekData.find(w => w.date === iso);
                  const h = entry ? Math.round((entry.mood / 5) * 44) + 8 : 4;
                  const isToday = iso === todayISO();
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      {entry && <span style={{ fontSize: 10 }}>{MOOD_EMOJIS[entry.mood - 1]}</span>}
                      <div style={{ width: "100%", height: 44, display: "flex", alignItems: "flex-end" }}>
                        <div style={{
                          width: "100%", height: h, borderRadius: "4px 4px 2px 2px",
                          background: entry ? WEEK_BAR_COLORS[entry.mood] : "#f1f5f9",
                          opacity: isToday ? 1 : 0.7,
                        }} />
                      </div>
                      <span style={{ fontSize: 9, color: isToday ? "#6366f1" : "#cbd5e1", fontWeight: isToday ? 800 : 400 }}>
                        {["א׳","ב׳","ג׳","ד׳","ה׳","ו׳","ש׳"][d.getDay()]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Quick journal card (always visible) ──────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "14px 16px", marginBottom: 14 }}>
            <p style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "#0f172a" }}>📓 כתיבה מהירה</p>
            <textarea
              value={quickNote}
              onChange={e => setQuickNote(e.target.value)}
              rows={3}
              placeholder="מה עובר עליך עכשיו?"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 10,
                border: "1px solid #e2e8f0", fontSize: 14, fontFamily: "'Heebo', sans-serif",
                resize: "none", background: "#f8fafc", boxSizing: "border-box",
                marginBottom: 10, outline: "none",
              }}
            />
            <button
              onClick={saveQuickNote}
              disabled={!quickNote.trim() || savingQuick}
              style={{
                width: "100%", padding: "10px", borderRadius: 10, border: "none",
                background: quickSaved ? "#dcfce7" : quickNote.trim() ? "#6366f1" : "#e2e8f0",
                color: quickSaved ? "#15803d" : quickNote.trim() ? "#fff" : "#94a3b8",
                fontSize: 13, fontWeight: 700, cursor: quickNote.trim() ? "pointer" : "default",
                fontFamily: "'Heebo', sans-serif", transition: "all 0.2s",
              }}
            >
              {quickSaved ? "✓ נשמר ביומן" : savingQuick ? "שומר..." : "💾 שמור ביומן"}
            </button>
          </div>
        </motion.div>

        {/* ── Steps card (shown until 7 check-ins) ─────────────────────── */}
        {totalCheckins < 7 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", padding: "14px 16px", marginBottom: 14 }}>
              <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#0f172a" }}>🗺️ הצעדים הראשונים</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  {
                    done: true,
                    label: "נרשמת ל-NestAI",
                  },
                  {
                    done: totalCheckins > 0,
                    label: "עדכון מצב רוח ראשון",
                  },
                  {
                    done: streak >= 7,
                    active: streak > 0 && streak < 7,
                    label: streak > 0 && streak < 7 ? `7 ימים רצופים — יום ${streak} מתוך 7` : "7 ימים רצופים",
                  },
                  {
                    done: hasWeeklySummary,
                    label: "סיכום שבועי ראשון — תובנות על מה משפיע עליך",
                  },
                ].map((step, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800,
                      background: step.done ? "#dcfce7" : step.active ? "#ede9fe" : "#f1f5f9",
                      color: step.done ? "#15803d" : step.active ? "#6366f1" : "#94a3b8",
                      border: step.active ? "2px solid #6366f1" : "none",
                    }}>
                      {step.done ? "✓" : step.active ? "●" : "○"}
                    </span>
                    <span style={{
                      fontSize: 13, color: step.done ? "#15803d" : step.active ? "#0f172a" : "#94a3b8",
                      fontWeight: step.active ? 700 : 400,
                      textDecoration: step.done ? "line-through" : "none",
                    }}>
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Quick actions ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 4 }}>
            {[
              { label: "יומן",   emoji: "📓", path: "/app/journal" },
              { label: "מגמות",  emoji: "📊", path: "/app/trends" },
              { label: "צ'אט",   emoji: "💬", path: "/app/chat",  badge: true },
            ].map(item => (
              <button key={item.label} onClick={() => navigate(item.path)} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                background: "#fff", border: "0.5px solid #e2e8f0",
                borderRadius: 14, padding: "14px 8px", cursor: "pointer", fontFamily: "'Heebo', sans-serif",
                position: "relative",
              }}>
                <span style={{ fontSize: 24 }}>{item.emoji}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    position: "absolute", top: 8, left: 8,
                    background: "#f59e0b", color: "#fff", borderRadius: 20,
                    padding: "1px 6px", fontSize: 9, fontWeight: 800,
                  }}>Premium</span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Home;
