import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

import DashboardTopbar from "@/components/dashboard/DashboardTopbar";
import HeroJournalCard from "@/components/dashboard/HeroJournalCard";
import GratitudeCard from "@/components/dashboard/GratitudeCard";
import ActionGrid from "@/components/dashboard/ActionGrid";
import ToolboxCarousel from "@/components/dashboard/ToolboxCarousel";
import BottomTabBar from "@/components/dashboard/BottomTabBar";

import IOSInstallOverlay from "@/components/IOSInstallOverlay";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import AccessLockOverlay from "@/components/AccessLockOverlay";
import { ensureUserAccessProfile, fetchMyAccessState, type AccessState } from "@/lib/accessControl";

type TimeOfDay = "morning" | "noon" | "evening" | "night";

const getTimeOfDay = (): TimeOfDay => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "noon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
};

const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }
  .dash-bottom-nav { display: block; }
  @media (min-width: 768px) {
    .dash-bottom-nav { display: none !important; }
  }
`;

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading]           = useState(true);
  const [firstName, setFirstName]       = useState("");
  const [streak, setStreak]             = useState(0);
  const { isInstalled, isIOS }          = usePWAInstall();
  const { t, dir, isRTL }               = useLanguage();
  const [timeOfDay]                     = useState<TimeOfDay>(getTimeOfDay());
  const { toast }                       = useToast();
  const [showMoodPrompt, setShowMoodPrompt] = useState(false);
  const [accessState, setAccessState]   = useState<AccessState | null>(null);

  const fromReminder = searchParams.get("from") === "daily-reminder";

  useEffect(() => {
    if (fromReminder && !loading) {
      setShowMoodPrompt(true);
      setSearchParams({}, { replace: true });
    }
  }, [fromReminder, loading]);

  const handleMoodSelected = useCallback(() => {
    setShowMoodPrompt(false);
    setTimeout(() => {
      toast({
        title: t.dashboard.thankSharing,
        description: t.dashboard.wantToWriteMore,
      });
    }, 500);
  }, [t, toast]);

  // Evening reminder
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 20 && now.getMinutes() === 0) {
        const shownKey = `nestai-evening-toast-${now.toDateString()}`;
        if (!localStorage.getItem(shownKey)) {
          localStorage.setItem(shownKey, "1");
          toast({
            title: t.dashboard.moodQuestion,
            description: t.dashboard.timeToWrite,
          });
        }
      }
    };
    const interval = setInterval(checkTime, 30000);
    checkTime();
    return () => clearInterval(interval);
  }, [t, toast]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { navigate("/app/auth"); return; }

        const ensuredAccessState = await ensureUserAccessProfile(session.user, "patient");
        setAccessState(ensuredAccessState);

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (profile?.first_name) setFirstName(profile.first_name);

        // Compute consecutive-day writing streak
        const { data: msgDates } = await supabase
          .from("messages")
          .select("created_at")
          .eq("user_id", session.user.id)
          .eq("role", "user")
          .order("created_at", { ascending: false })
          .limit(200);

        if (msgDates && msgDates.length > 0) {
          const uniqueDays = [...new Set(
            msgDates.map((m: any) => new Date(m.created_at).toISOString().slice(0, 10))
          )].sort((a, b) => b.localeCompare(a));

          let count = 0;
          const today = new Date().toISOString().slice(0, 10);
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          let current = uniqueDays[0] === today || uniqueDays[0] === yesterday ? uniqueDays[0] : null;
          if (current) {
            for (const day of uniqueDays) {
              if (day === current) { count++; const d = new Date(current); d.setDate(d.getDate() - 1); current = d.toISOString().slice(0, 10); }
              else break;
            }
          }
          setStreak(count);
        }

        setLoading(false);

        // Background narrative fetch (kept for future use)
        try {
          const { data: decryptData } = await supabase.functions.invoke("decrypt-messages", {
            body: { source: "chat" },
          });
          const messages = (decryptData?.messages || []).filter((m: any) => m.role === "user");
          if (messages.length > 0) {
            await supabase.functions.invoke("analyze-dashboard", {
              body: { messages: messages.map((m: any) => m.text) },
            });
          }
        } catch { /* silent */ }
      } catch (error) {
        console.error("Dashboard init error:", error);
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const greetingLabel = t.greetings[timeOfDay];

  /* ── Loading spinner ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
        <style>{CSS}</style>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #e0e7ff', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', fontFamily: "'Heebo', sans-serif" }} dir={dir}>
      <style>{CSS}</style>

      {/* Dashboard-specific topbar */}
      <DashboardTopbar />

      {/* Overlays */}
      {accessState?.is_locked && (
        <AccessLockOverlay
          accessState={accessState}
          onRequestSubmitted={async () => {
            const refreshed = await fetchMyAccessState();
            setAccessState(refreshed);
          }}
        />
      )}
      {isIOS && !isInstalled && <IOSInstallOverlay />}

      {/* Scrollable body */}
      <div style={{ paddingBottom: 80 }}>

        {/* ── Mood prompt ── */}
        {showMoodPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            style={{ padding: '12px 20px 0' }}
          >
            <div style={{ background: '#ffffff', borderRadius: 16, padding: 20, border: '0.5px solid #e2e8f0' }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#0f172a', marginBottom: 12, textAlign: 'center' }}>
                {t.dashboard.moodQuestion}
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
                {[
                  { key: "happy",     emoji: "😊" },
                  { key: "anxious",   emoji: "😰" },
                  { key: "exhausted", emoji: "😩" },
                  { key: "sad",       emoji: "😢" },
                  { key: "calm",      emoji: "😌" },
                ].map((m) => (
                  <button
                    key={m.key}
                    onClick={async () => {
                      const { data: { session } } = await supabase.auth.getSession();
                      if (!session) return;
                      await supabase.from("mood_entries").insert({ user_id: session.user.id, mood: m.key });
                      handleMoodSelected();
                    }}
                    style={{ fontSize: 28, padding: 8, borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer' }}
                  >
                    {m.emoji}
                  </button>
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={() => setShowMoodPrompt(false)}
                  style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  {t.dashboard.maybeLater}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ padding: '24px 20px 10px' }}
        >
          <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400, margin: '0 0 4px', fontFamily: "'Heebo', sans-serif" }}>
            {greetingLabel}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', margin: 0, lineHeight: 1.2, letterSpacing: '-1px', fontFamily: "'Heebo', sans-serif" }}>
              {t.dashboard.helloPrefix} {firstName} 👋
            </h1>
            {streak > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#fff7ed', border: '1px solid #fed7aa',
                borderRadius: 50, padding: '4px 12px',
                fontSize: 12, fontWeight: 700, color: '#c2410c',
                fontFamily: "'Heebo', sans-serif",
                flexShrink: 0,
              }}>
                🔥 {streak} ימים ברצף
              </span>
            )}
          </div>
        </motion.div>

        {/* ── Main cards ── */}
        <div style={{ padding: '16px 20px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <HeroJournalCard />
          <GratitudeCard />
          <ActionGrid />
          <ToolboxCarousel />
        </div>

      </div>

      {/* ── Bottom nav — mobile only ── */}
      <div className="dash-bottom-nav">
        <BottomTabBar />
      </div>
    </div>
  );
};

export default Dashboard;
