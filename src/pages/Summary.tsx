import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Copy, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from "lucide-react";
import AddToHomeBanner from "@/components/AddToHomeBanner";
import { WeeklyQuestionnaire } from "@/components/WeeklyQuestionnaire";
import { WeeklyEmotionMeter } from "@/components/WeeklyEmotionMeter";
import { useLanguage } from "@/contexts/LanguageContext";



import AppHeader from "@/components/AppHeader";
import BackButton from "@/components/BackButton";
import SessionPrepCard from "@/components/SessionPrepCard";


type Summary = {
  id: string;
  summary_text: string;
  week_start: string;
  week_end: string;
  created_at: string;
};

type UserPreferences = {
  summary_day: string;
  summary_time: string;
};

const Summary = () => {
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    summary_day: "saturday",
    summary_time: "20:00",
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const { toast } = useToast();
  const { t, dir, isRTL, language } = useLanguage();
  const hasWeeklyAccess = true;

  const currentSummary = summaries[currentIndex] || null;

  // Handle return from Stripe




  const dayLabels: Record<string, string> = {
    sunday: t.settings.sunday,
    monday: t.settings.monday,
    tuesday: t.settings.tuesday,
    wednesday: t.settings.wednesday,
    thursday: t.settings.thursday,
    friday: t.settings.friday,
    saturday: t.settings.saturday,
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/app/auth");
      } else {
        loadAllSummaries();
        loadPreferences(session.user.id);
        markSummariesAsViewed();
      }
    });
  }, [navigate]);

  const markSummariesAsViewed = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase
        .from("weekly_summaries")
        .update({ viewed_at: new Date().toISOString() })
        .eq("user_id", session.user.id)
        .is("viewed_at", null);
    } catch (error) {
      console.error("Error marking summaries as viewed:", error);
    }
  };

  const loadAllSummaries = async () => {
    try {
      const { data, error } = await supabase
        .from("weekly_summaries")
        .select("*")
        .order("created_at", { ascending: false });

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setSummaries(data || []);
    } catch (error) {
      console.error("Error loading summaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("summary_day, summary_time")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error("Error loading preferences:", error);
    }
  };

  const handleCopy = () => {
    if (currentSummary) {
      navigator.clipboard.writeText(currentSummary.summary_text);
      toast({
        title: t.common.copied,
        description: t.summary.copiedToClipboard,
      });
    }
  };

  const handleRegenerate = async () => {
    if (!currentSummary || regenerating) return;
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("regenerate-summary", {
        body: { type: "weekly", summary_id: currentSummary.id },
      });
      if (error) throw error;
      if (data?.summary_text) {
        setSummaries(prev => prev.map(s =>
          s.id === currentSummary.id ? { ...s, summary_text: data.summary_text } : s
        ));
        toast({
          title: isRTL ? "הסיכום חודש בהצלחה ✨" : "Summary regenerated ✨",
        });
      }
    } catch (err) {
      console.error("Regenerate error:", err);
      toast({
        title: isRTL ? "שגיאה ביצירת הסיכום מחדש" : "Error regenerating summary",
        variant: "destructive",
      });
    } finally {
      setRegenerating(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-[17px] text-muted-foreground">{t.common.loading}</p>
        </div>
      </div>
    );
  }




  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <WeeklyQuestionnaire />
      
      <AppHeader />

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <BackButton />
        <AddToHomeBanner />
        


        {summaries.length === 0 ? (
          <div className="text-center py-20 animate-slide-up px-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📝</span>
            </div>
            <h2 className="text-[24px] font-semibold text-foreground mb-3">
              {t.summary.noSummaryYet}
            </h2>
            <p className="text-[17px] text-muted-foreground max-w-[300px] mx-auto">
              {isRTL 
                ? `הסיכום השבועי ייווצר ב${dayLabels[preferences.summary_day]} בשעה ${preferences.summary_time}`
                : `Weekly summary will be created on ${dayLabels[preferences.summary_day]} at ${preferences.summary_time}`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Navigation for history */}
            {summaries.length > 1 && (
              <div className="flex items-center justify-between bg-muted/30 p-3 rounded-[14px] border border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                  disabled={currentIndex === 0}
                  className="gap-1 h-9"
                >
                  {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  {isRTL ? "חדש יותר" : "Newer"}
                </Button>
                <span className="text-[14px] text-muted-foreground">
                  {currentIndex + 1} {isRTL ? "מתוך" : "of"} {summaries.length}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.min(summaries.length - 1, currentIndex + 1))}
                  disabled={currentIndex === summaries.length - 1}
                  className="gap-1 h-9"
                >
                  {isRTL ? "ישן יותר" : "Older"}
                  {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            )}

            <div className="bg-card rounded-[20px] p-6 border border-border animate-slide-up space-y-6">
              <div className="bg-muted/30 p-4 rounded-[14px] border border-border/50 mb-4">
                <p className="text-[14px] text-muted-foreground text-center leading-relaxed">
                  {currentIndex === 0 
                    ? (isRTL 
                        ? "זהו הסיכום השבועי הנוכחי על סמך מה שנכתב השבוע. סיכום חדש יווצר אוטומטית במועד שנבחר."
                        : "This is your current weekly summary based on what was written this week. A new summary will be automatically created at your chosen time.")
                    : (isRTL ? "סיכום שבועי מהעבר" : "Past weekly summary")}
                </p>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-[14px]">
                    {new Date(currentSummary.week_start).toLocaleDateString(language === 'he' ? "he-IL" : "en-US")} -{" "}
                    {new Date(currentSummary.week_end).toLocaleDateString(language === 'he' ? "he-IL" : "en-US")}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      const subject = encodeURIComponent(isRTL ? "סיכום שבועי מ-nestai.care" : "Weekly Summary from nestai.care");
                      const body = encodeURIComponent(currentSummary.summary_text);
                      window.location.href = `mailto:?subject=${subject}&body=${body}`;
                    }} 
                    className="gap-2 h-9 rounded-[12px]"
                  >
                    <span className="text-[14px]">{isRTL ? "שתף" : "Share"}</span>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 h-9 rounded-[12px]">
                    <Copy className="h-[14px] w-[14px]" />
                    <span className="text-[14px]">{t.common.copy}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="gap-2 h-9 rounded-[12px]"
                  >
                    {regenerating ? (
                      <Loader2 className="h-[14px] w-[14px] animate-spin" />
                    ) : (
                      <RefreshCw className="h-[14px] w-[14px]" />
                    )}
                    <span className="text-[14px]">{isRTL ? "חדש מחדש" : "Regenerate"}</span>
                  </Button>
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-[16px] leading-relaxed whitespace-pre-wrap">{currentSummary.summary_text}</p>
              </div>

              {/* Emotion Meter */}
              <WeeklyEmotionMeter summaryId={currentSummary.id} />
            </div>

            {/* Session Prep Card */}
            <SessionPrepCard />
          </div>
        )}

        <div className="text-center text-xs text-muted-foreground/60 py-6">
          {t.footer.copyright}
        </div>
      </div>

      
    </div>
  );
};

export default Summary;