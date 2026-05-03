import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

import AppHeader from "@/components/AppHeader";
import HeroJournalCard from "@/components/dashboard/HeroJournalCard";
import ActionGrid from "@/components/dashboard/ActionGrid";
import ToolboxCarousel from "@/components/dashboard/ToolboxCarousel";
import InsightsSection from "@/components/dashboard/InsightsSection";
import BottomTabBar from "@/components/dashboard/BottomTabBar";
import IOSInstallOverlay from "@/components/IOSInstallOverlay";
import TrialStatusCard from "@/components/access/TrialStatusCard";
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

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [narrativeInsight, setNarrativeInsight] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const { isInstalled, isIOS } = usePWAInstall();
  const { t, dir, isRTL } = useLanguage();
  const [timeOfDay] = useState<TimeOfDay>(getTimeOfDay());
  const { toast } = useToast();
  const [showMoodPrompt, setShowMoodPrompt] = useState(false);
  const [accessState, setAccessState] = useState<AccessState | null>(null);
  const [streakDays, setStreakDays] = useState<number>(0);

  const fromReminder = searchParams.get("from") === "daily-reminder";

  useEffect(() => {
    if (fromReminder && !loading) {
      setShowMoodPrompt(true);
      setSearchParams({}, { replace: true });
    }
  }, [fromReminder, loading]);

  const handleMoodSelected = useCallback(
    (mood: string) => {
      setShowMoodPrompt(false);
      setTimeout(() => {
        toast({
          title: isRTL ? "תודה ששיתפת 💙" : "Thanks for sharing 💙",
          description: isRTL ? "רוצה לכתוב עוד?" : "Want to write more?",
        });
      }, 500);
    },
    [isRTL, toast]
  );

  // Evening reminder
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 20 && now.getMinutes() === 0) {
        const shownKey = `nestai-evening-toast-${now.toDateString()}`;
        if (!localStorage.getItem(shownKey)) {
          localStorage.setItem(shownKey, "1");
          toast({
            title: isRTL ? "איך היה לך היום?" : "How was your day?",
            description: isRTL ? "זמן לכתוב ב-NestAI" : "Time to write in NestAI",
          });
        }
      }
    };
    const interval = setInterval(checkTime, 30000);
    checkTime();
    return () => clearInterval(interval);
  }, [isRTL, toast]);

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          navigate("/app/auth");
          return;
        }

        const ensuredAccessState = await ensureUserAccessProfile(session.user, "patient");
        setAccessState(ensuredAccessState);

        const { data: profile } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("user_id", session.user.id)
          .maybeSingle();
        if (profile?.first_name) setFirstName(profile.first_name);

        setLoading(false);

        // Streak calculation (non-blocking)
        try {
          const { data: moodData } = await supabase
            .from('mood_entries')
            .select('created_at')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(30);
          if (moodData && moodData.length > 0) {
            const days = new Set(moodData.map((e: any) => e.created_at.slice(0, 10)));
            let streak = 0;
            const today = new Date();
            for (let i = 0; i < 30; i++) {
              const d = new Date(today);
              d.setDate(d.getDate() - i);
              const dateStr = d.toISOString().slice(0, 10);
              if (days.has(dateStr)) { streak++; } else { break; }
            }
            if (streak > 0) setStreakDays(streak);
          }
        } catch { /* silent */ }

        // Background narrative fetch
        try {
          const { data: decryptData } = await supabase.functions.invoke("decrypt-messages", {
            body: { source: "chat" },
          });
          const messages = (decryptData?.messages || []).filter((m: any) => m.role === "user");
          if (messages.length > 0) {
            const { data: analysisData } = await supabase.functions.invoke("analyze-dashboard", {
              body: { messages: messages.map((m: any) => m.text) },
            });
            if (analysisData?.narrative?.keyInsight) {
              setNarrativeInsight(analysisData.narrative.keyInsight);
            }
          }
        } catch (err) {
          console.error("Narrative analysis error:", err);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setLoading(false);
      }
    };
    init();
  }, [navigate]);

  const greeting = t.greetings[timeOfDay];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #dbeafe', borderTopColor: '#1e3a5f', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#ffffff', display: 'flex', flexDirection: 'column' }} dir={dir}>
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
      <AppHeader />

      {/* Mood prompt */}
      {showMoodPrompt && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '12px 16px 0' }}>
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: 20, border: '0.5px solid #e2e8f0', textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 500, color: '#0f172a', marginBottom: 12 }}>
              {isRTL ? "איך היה לך היום?" : "How was your day?"}
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 12 }}>
              {[
                { key: "happy",    emoji: "😊" },
                { key: "anxious",  emoji: "😰" },
                { key: "exhausted",emoji: "😩" },
                { key: "sad",      emoji: "😢" },
                { key: "calm",     emoji: "😌" },
              ].map((m) => (
                <button key={m.key} onClick={async () => {
                  const { data: { session } } = await supabase.auth.getSession();
                  if (!session) return;
                  await supabase.from("mood_entries").insert({ user_id: session.user.id, mood: m.key });
                  handleMoodSelected(m.key);
                }} style={{ fontSize: 28, padding: 8, borderRadius: 10, border: 'none', background: 'none', cursor: 'pointer' }}>
                  {m.emoji}
                </button>
              ))}
            </div>
            <button onClick={() => setShowMoodPrompt(false)} style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}>
              {isRTL ? "אולי אח״כ" : "Maybe later"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          style={{ padding: '16px 20px 8px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
        >
          <div>
            <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400, marginBottom: 2 }}>{greeting}</p>
            <h1 style={{ fontSize: 20, fontWeight: 500, color: '#0f172a', margin: 0, lineHeight: 1.2 }}>
              {isRTL ? `שלום ${firstName}` : `Hello ${firstName}`}
            </h1>
          </div>
          {streakDays > 0 && (
            <div style={{ background: '#fef3c7', borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#92400e' }}>{streakDays} {isRTL ? 'ימים ברצף' : 'day streak'}</span>
            </div>
          )}
        </motion.div>

        <div style={{ padding: '0 20px', maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {accessState && <TrialStatusCard accessState={accessState} className="border-primary/10 bg-card/95 shadow-card" />}
          <HeroJournalCard />
          <ActionGrid />
          <ToolboxCarousel />
          <InsightsSection narrativeInsight={narrativeInsight} />

          <div style={{ textAlign: 'center', paddingTop: 16, paddingBottom: 8 }}>
            <button onClick={() => navigate("/app/support")} style={{ fontSize: 13, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', display: 'block', margin: '0 auto 6px' }}>
              {isRTL ? "עזרה ותמיכה" : "Help & Support"}
            </button>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{t.footer.copyright}</p>
          </div>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Dashboard;
