import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { Calendar, Wind, Lightbulb, X, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ToolboxCarousel = () => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [breathPhase, setBreathPhase] = useState<"idle" | "inhale" | "hold" | "exhale">("idle");
  const [breathTimer, setBreathTimer] = useState<number | null>(null);
  const [lastInsight, setLastInsight] = useState<string | null>(null);

  // Session editing state
  const [sessionDate, setSessionDate] = useState("");
  const [sessionTime, setSessionTime] = useState("17:00");
  const [isEditingSession, setIsEditingSession] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("nestai-next-session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.date) setSessionDate(parsed.date);
        if (parsed.time) setSessionTime(parsed.time);
      } catch {}
    }
  }, []);

  const saveSession = () => {
    localStorage.setItem("nestai-next-session", JSON.stringify({ date: sessionDate, time: sessionTime }));
    setIsEditingSession(false);
    toast({
      title: isRTL ? "נשמר!" : "Saved!",
      description: isRTL ? "פרטי המפגש עודכנו" : "Session details updated",
    });
  };

  const formatSessionDisplay = () => {
    if (!sessionDate) return isRTL ? "לא נקבע עדיין" : "Not set yet";
    const d = new Date(sessionDate + "T00:00:00");
    const dayNames = isRTL
      ? ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"]
      : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const monthNames = isRTL
      ? ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"]
      : ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return isRTL
      ? `יום ${dayNames[d.getDay()]}, ${d.getDate()} ב${monthNames[d.getMonth()]}`
      : `${dayNames[d.getDay()]}, ${monthNames[d.getMonth()]} ${d.getDate()}`;
  };

  useEffect(() => {
    const fetchInsight = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("weekly_summaries")
        .select("summary_text")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data?.summary_text) {
        const text = data.summary_text;
        // Find first complete sentence (ending with period, exclamation, or question mark)
        const sentences = text.match(/[^.!?\n]+[.!?]/g);
        if (sentences) {
          // Find a sentence that's meaningful (>10 chars) and fits well
          const good = sentences.find(s => s.trim().length > 10 && s.trim().length <= 80);
          if (good) {
            setLastInsight(good.trim());
          } else if (sentences[0] && sentences[0].trim().length > 10) {
            const s = sentences[0].trim();
            setLastInsight(s.length > 80 ? s.slice(0, 77) + "..." : s);
          }
        }
      }
    };
    fetchInsight();
  }, []);

  const startBreathing = () => {
    setBreathPhase("inhale");
    let cycle = 0;
    const maxCycles = 4;

    const run = () => {
      const phases: Array<"inhale" | "hold" | "exhale"> = ["inhale", "hold", "exhale"];
      const durations = [4000, 4000, 4000];
      let step = 0;

      const next = () => {
        if (cycle >= maxCycles) {
          setBreathPhase("idle");
          setActiveCard(null);
          return;
        }
        setBreathPhase(phases[step]);
        const id = window.setTimeout(() => {
          step++;
          if (step >= 3) { step = 0; cycle++; }
          next();
        }, durations[step]);
        setBreathTimer(id);
      };
      next();
    };
    run();
  };

  const stopBreathing = () => {
    if (breathTimer) clearTimeout(breathTimer);
    setBreathPhase("idle");
    setActiveCard(null);
  };

  const cards = [
    {
      id: "session",
      icon: Calendar,
      title: isRTL ? "המפגש הבא" : "Next Session",
      content: sessionDate ? `${formatSessionDisplay()} · ${sessionTime}` : (isRTL ? "הגדר את המפגש הבא" : "Set your next session"),
    },
    {
      id: "breathing",
      icon: Wind,
      title: isRTL ? "תרגיל נשימה" : "Take a Breath",
      content: isRTL ? "מדריך הרגעה של 2 דקות" : "A 2-minute calming guide",
    },
    {
      id: "insight",
      icon: Lightbulb,
      title: isRTL ? "מה עזר לי?" : "Last Week's Win",
      content: lastInsight || (isRTL ? "הצבת גבולות בעבודה" : "Setting boundaries at work"),
    },
  ];

  const renderOverlay = () => {
    if (!activeCard) return null;

    return (
      <AnimatePresence>
        <motion.div
          key={activeCard}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 backdrop-blur-sm"
          onClick={() => { stopBreathing(); setActiveCard(null); setIsEditingSession(false); }}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-card rounded-t-3xl p-6 shadow-elevated"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 24px) + 24px)", minHeight: "40vh" }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-foreground">
                {activeCard === "breathing" && (isRTL ? "תרגיל נשימה" : "Breathing Exercise")}
                {activeCard === "session" && (isRTL ? "המפגש הבא" : "Next Session")}
                {activeCard === "insight" && (isRTL ? "התובנה שלי" : "My Insight")}
              </h3>
              <button onClick={() => { stopBreathing(); setActiveCard(null); setIsEditingSession(false); }} className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {activeCard === "session" && (
              <div className="text-center py-6 space-y-5">
                {!isEditingSession ? (
                  <>
                    <div className="h-16 w-16 rounded-full mx-auto flex items-center justify-center bg-accent">
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                    {sessionDate ? (
                      <>
                        <p className="text-lg font-medium text-foreground">{formatSessionDisplay()}</p>
                        <p className="text-2xl font-bold text-foreground">{sessionTime}</p>
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? "הפגישה הבאה שלך מתקרבת" : "Your next session is coming up"}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">
                        {isRTL ? "לא הגדרת עדיין את המפגש הבא" : "You haven't set your next session yet"}
                      </p>
                    )}
                    <Button
                      variant="outline"
                      className="rounded-2xl gap-2"
                      onClick={() => setIsEditingSession(true)}
                    >
                      <Pencil className="h-4 w-4" />
                      {sessionDate
                        ? (isRTL ? "עריכה" : "Edit")
                        : (isRTL ? "הגדר מפגש" : "Set Session")}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4 text-start">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        {isRTL ? "תאריך" : "Date"}
                      </label>
                      <Input
                        type="date"
                        value={sessionDate}
                        onChange={(e) => setSessionDate(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">
                        {isRTL ? "שעה" : "Time"}
                      </label>
                      <Input
                        type="time"
                        value={sessionTime}
                        onChange={(e) => setSessionTime(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button onClick={saveSession} className="flex-1 rounded-2xl">
                        {isRTL ? "שמור" : "Save"}
                      </Button>
                      <Button variant="outline" onClick={() => setIsEditingSession(false)} className="rounded-2xl">
                        {isRTL ? "ביטול" : "Cancel"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeCard === "breathing" && (
              <div className="flex flex-col items-center gap-6 py-4">
                {breathPhase === "idle" ? (
                  <Button onClick={startBreathing} size="lg" className="rounded-2xl px-8">
                    {isRTL ? "התחל" : "Start"}
                  </Button>
                ) : (
                  <>
                    <motion.div
                      animate={{ scale: breathPhase === "inhale" ? 1.4 : breathPhase === "hold" ? 1.4 : 1 }}
                      transition={{ duration: 4, ease: "easeInOut" }}
                      className="h-28 w-28 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "hsl(170 35% 88%)" }}
                    >
                      <Wind className="h-10 w-10" style={{ color: "hsl(170 40% 38%)" }} />
                    </motion.div>
                    <p className="text-xl font-semibold text-foreground">
                      {breathPhase === "inhale" && (isRTL ? "שאפ/י..." : "Breathe in...")}
                      {breathPhase === "hold" && (isRTL ? "החזק/י..." : "Hold...")}
                      {breathPhase === "exhale" && (isRTL ? "נשוף/י..." : "Breathe out...")}
                    </p>
                    <button onClick={stopBreathing} className="text-sm text-muted-foreground hover:underline">
                      {isRTL ? "עצור" : "Stop"}
                    </button>
                  </>
                )}
              </div>
            )}

            {activeCard === "insight" && (
              <div className="text-center py-6 space-y-4">
                <div className="h-16 w-16 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: "hsl(270 30% 90%)" }}>
                  <Lightbulb className="h-8 w-8" style={{ color: "hsl(270 35% 50%)" }} />
                </div>
                <p className="text-lg font-medium text-foreground italic leading-relaxed px-4">
                  "{lastInsight || (isRTL ? "הצבת גבולות בעבודה" : "Setting boundaries at work")}"
                </p>
                <Button variant="outline" className="rounded-2xl" onClick={() => { setActiveCard(null); navigate("/app/summary"); }}>
                  {isRTL ? "צפה בסיכום המלא" : "View Full Summary"}
                </Button>
              </div>
            )}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <>
      <div>
        <p style={{ fontSize: 9, fontWeight: 500, color: '#cbd5e1', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          {isRTL ? "ארגז הכלים" : "TOOLBOX"}
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {cards.map((card) => (
            <button
              key={card.id}
              onClick={() => setActiveCard(card.id)}
              style={{
                background: '#ffffff', border: '0.5px solid #e2e8f0',
                borderRadius: 14, padding: '14px 12px',
                display: 'flex', flexDirection: 'column',
                cursor: 'pointer', textAlign: 'start', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'}
              onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#ffffff'}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <card.icon size={13} color="#1d4ed8" strokeWidth={2} />
                </div>
              </div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: '0 0 4px', lineHeight: 1.3 }}>{card.title}</p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' } as React.CSSProperties}>{card.content}</p>
            </button>
          ))}
        </div>
      </div>

      {renderOverlay()}
    </>
  );
};

export default ToolboxCarousel;
