import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Loader2, User, Heart } from "lucide-react";
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
import { Button } from "@/components/ui/button";
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={dir}>
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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="px-4 pt-3">
          <Card className="p-5 text-center space-y-3 border-primary/20 bg-primary/5 rounded-3xl">
            <p className="text-lg font-semibold text-foreground">
              {isRTL ? "איך היה לך היום?" : "How was your day?"}
            </p>
            <div className="flex gap-2 justify-center">
              {[
                { key: "happy", emoji: "😊" },
                { key: "anxious", emoji: "😰" },
                { key: "exhausted", emoji: "😩" },
                { key: "sad", emoji: "😢" },
                { key: "calm", emoji: "😌" },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={async () => {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession();
                    if (!session) return;
                    await supabase.from("mood_entries").insert({
                      user_id: session.user.id,
                      mood: m.key,
                    });
                    handleMoodSelected(m.key);
                  }}
                  className="text-3xl p-2 rounded-xl hover:bg-muted transition-colors"
                >
                  {m.emoji}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMoodPrompt(false)}
              className="text-xs text-muted-foreground hover:underline"
            >
              {isRTL ? "אולי אח״כ" : "Maybe later"}
            </button>
          </Card>
        </motion.div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="px-5 pt-5 pb-2"
        >
          <p className="text-sm text-muted-foreground">{greeting}</p>
          <h1 className="text-xl font-bold text-foreground leading-tight">
            {firstName || (isRTL ? "שלום" : "Hello")} 👋
          </h1>
        </motion.div>

        <div className="px-5 space-y-5 max-w-lg mx-auto">
          {accessState && <TrialStatusCard accessState={accessState} className="border-primary/10 bg-card/95 shadow-card" />}
          <HeroJournalCard />
          <ActionGrid />
          <ToolboxCarousel />
          <InsightsSection narrativeInsight={narrativeInsight} />

          <div className="text-center pt-4 pb-2 space-y-2">
            <button
              onClick={() => navigate("/app/support")}
              className="text-sm text-primary hover:underline"
            >
              {isRTL ? "עזרה ותמיכה" : "Help & Support"}
            </button>
            <p className="text-xs text-muted-foreground">{t.footer.copyright}</p>
          </div>
        </div>
      </div>

      <BottomTabBar />
    </div>
  );
};

export default Dashboard;
