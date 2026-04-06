import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, FileText, BarChart3, Lightbulb, Send, CheckCircle2, Copy, TrendingUp, Repeat, AlertTriangle, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import nestLogo from "@/assets/nestai-logo-full.png";
import EmotionStats from "@/components/dashboard/EmotionStats";
import { toast } from "@/hooks/use-toast";

// ─── Dummy Data ───────────────────────────────────────
const dummySummaryText = `השבוע של דנה התאפיין בתנודתיות רגשית מובהקת. תחילת השבוע לוותה בחרדה סביב ביצועים בעבודה, שהתבטאה בדפוסי שינה לקויים ובמחשבות חוזרות על "לא מספיק טובה". באמצע השבוע חל שינוי — שיחה עם חברה קרובה הביאה להקלה זמנית והעלתה תובנה חשובה: "אני תמיד מחפשת אישור מבחוץ".

לקראת סוף השבוע, דנה הביעה מוטיבציה לעבוד על הנושא בפגישה הקרובה. ציינה שהיא רוצה להבין מתי ההרגל הזה התחיל.

נושאים מרכזיים: חרדת ביצוע, צורך באישור חיצוני, קשרים חברתיים כמקור תמיכה.
מגמה רגשית: ירידה בתחילת השבוע, עלייה משמעותית באמצע, ייצוב לקראת הסוף.`;

const dummyEmotionBreakdown = [
  { emotion: "חרדה", percent: 35, color: "hsl(0, 70%, 60%)" },
  { emotion: "מוטיבציה", percent: 25, color: "hsl(140, 60%, 50%)" },
  { emotion: "עצב", percent: 20, color: "hsl(220, 60%, 55%)" },
  { emotion: "הקלה", percent: 15, color: "hsl(175, 60%, 50%)" },
  { emotion: "תקווה", percent: 5, color: "hsl(45, 80%, 55%)" },
];

const dummyIntensityData = [
  { shortDate: "1 מרץ", intensity: 6, label: "חרדה מעבודה" },
  { shortDate: "5 מרץ", intensity: 8, label: "לחץ גבוה" },
  { shortDate: "8 מרץ", intensity: 5, label: "שיחה עם חברה" },
  { shortDate: "10 מרץ", intensity: 7, label: "קושי בשינה" },
  { shortDate: "12 מרץ", intensity: 4, label: "הקלה" },
  { shortDate: "14 מרץ", intensity: 3, label: "ייצוב" },
  { shortDate: "16 מרץ", intensity: 4, label: "מוטיבציה לפגישה" },
];

const dummyPatterns = [
  { title: "חרדת ביצוע חוזרת", description: "דנה מדווחת על תחושות ״לא מספיק טובה״ בהקשרי עבודה, בעיקר בתחילת שבוע.", emoji: "🔄", type: "pattern" as const },
  { title: "קושי בשינה כטריגר", description: "ערבים עם מחשבות חוזרות מובילים לשינה לקויה, שמחמירה את החרדה למחרת.", emoji: "⚡", type: "trigger" as const },
  { title: "שיחות כמשאב", description: "שיחות עם אנשים קרובים מספקות הקלה זמנית ומעלות תובנות חדשות.", emoji: "💚", type: "positive" as const },
  { title: "צורך באישור חיצוני", description: "דפוס חוזר של חיפוש ולידציה מבחוץ — הוזכר במפורש ע״י דנה כנושא לעבודה בטיפול.", emoji: "👁️", type: "warning" as const },
];

const typeConfig: Record<string, { bgClass: string; borderClass: string }> = {
  pattern: { bgClass: "bg-primary/[0.06]", borderClass: "border-primary/20" },
  trigger: { bgClass: "bg-destructive/[0.06]", borderClass: "border-destructive/20" },
  positive: { bgClass: "bg-secondary/[0.08]", borderClass: "border-secondary/30" },
  warning: { bgClass: "bg-accent/[0.08]", borderClass: "border-accent/30" },
};

// ─── Tabs ─────────────────────────────────────────────
type Tab = "summary" | "trends" | "approach";

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-xl px-3 py-2 shadow-lg text-sm">
        <p className="font-semibold text-foreground">{d.shortDate}</p>
        <p className="text-muted-foreground">{d.label}</p>
        <p className="text-primary font-bold">{d.intensity}/10</p>
      </div>
    );
  }
  return null;
};

const ProfessionalDemo = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleContactSubmit = async () => {
    if (!email || !email.includes("@")) {
      toast({ title: "נא להזין כתובת אימייל תקינה", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("professional_leads" as any).insert({ email: email.trim(), phone: phone.trim() || null } as any);
      if (error) throw error;
      setSubmitted(true);
      toast({ title: "הפרטים נשלחו בהצלחה!", description: "ניצור איתך קשר בקרוב." });
    } catch (e: any) {
      toast({ title: "שגיאה בשליחה", description: e?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(dummySummaryText);
    toast({ title: "הועתק בהצלחה" });
  };

  const tabs = [
    { id: "summary" as Tab, label: "סיכום שבועי", icon: FileText },
    { id: "trends" as Tab, label: "מגמות", icon: BarChart3 },
    { id: "approach" as Tab, label: "הגישה שלנו", icon: Lightbulb },
  ];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" dir="rtl">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-border/30">
          <button onClick={() => navigate("/app/professional/intro")} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground rotate-180" />
          </button>
          <div className="flex items-center gap-2">
            <img src={nestLogo} alt="NestAI" className="h-7 object-contain" />
            <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">דמו</span>
          </div>
          <div className="w-9" />
        </div>
      </div>
      <div style={{ height: "calc(env(safe-area-inset-top, 0px) + 56px)" }} />

      {/* Tabs */}
      <div className="flex border-b border-border bg-card/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-medium transition-colors border-b-2 ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            {/* ── Summary Tab ── */}
            {activeTab === "summary" && (
              <motion.div key="summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-card rounded-[20px] p-6 border border-border space-y-6">
                  <div className="bg-muted/30 p-4 rounded-[14px] border border-border/50">
                    <p className="text-[14px] text-muted-foreground text-center leading-relaxed">
                      זהו סיכום שבועי לדוגמה — כך ייראה הסיכום שהמטפל/ת יקבלו עבור כל מטופל/ת.
                    </p>
                  </div>

                  <div className="flex items-center justify-between pb-4 border-b border-border">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-[14px]">10/03/2026 - 16/03/2026</span>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 h-9 rounded-[12px]">
                      <Copy className="h-[14px] w-[14px]" />
                      <span className="text-[14px]">העתק</span>
                    </Button>
                  </div>

                  <div className="prose prose-sm max-w-none">
                    <p className="text-[16px] leading-relaxed whitespace-pre-wrap text-foreground">{dummySummaryText}</p>
                  </div>
                </div>

                <EmotionStats breakdown={dummyEmotionBreakdown} />
              </motion.div>
            )}

            {/* ── Trends Tab ── */}
            {activeTab === "trends" && (
              <motion.div key="trends" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Overall Trend */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="rounded-3xl border-secondary/20 bg-secondary/[0.04]">
                    <CardContent className="py-4 px-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <TrendingUp className="h-4 w-4 text-secondary" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-secondary uppercase tracking-wide mb-1">מגמה כללית</p>
                          <p className="text-sm text-foreground leading-relaxed">
                            מגמה חיובית ברורה — ירידה בעוצמת החרדה מ-8 ל-3 לאורך השבועיים האחרונים, עם ייצוב בסוף התקופה.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Emotional Intensity Chart */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card className="rounded-3xl overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-secondary via-primary to-accent" />
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <span>📈</span>
                        עוצמה רגשית לאורך החודש
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dummyIntensityData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="demoIntensityGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                            <XAxis dataKey="shortDate" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={30} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                              type="monotone"
                              dataKey="intensity"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2.5}
                              fill="url(#demoIntensityGradient)"
                              dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
                              activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Pattern Cards */}
                <div className="space-y-3">
                  <h2 className="text-base font-bold text-foreground px-1">דפוסים שזוהו</h2>
                  {dummyPatterns.map((pattern, index) => {
                    const config = typeConfig[pattern.type] || typeConfig.pattern;
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.08 }}
                      >
                        <Card className={`rounded-2xl ${config.bgClass} ${config.borderClass} border`}>
                          <CardContent className="py-4 px-4">
                            <div className="flex gap-3">
                              <span className="text-2xl flex-shrink-0">{pattern.emoji}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-0.5">
                                  <h4 className="font-semibold text-sm text-foreground">{pattern.title}</h4>
                                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                    pattern.type === "positive"
                                      ? "bg-secondary/15 text-secondary"
                                      : pattern.type === "trigger" || pattern.type === "warning"
                                      ? "bg-destructive/10 text-destructive"
                                      : "bg-primary/10 text-primary"
                                  }`}>
                                    {pattern.type === "pattern" ? "דפוס" :
                                     pattern.type === "trigger" ? "טריגר" :
                                     pattern.type === "positive" ? "חיובי" : "שימו לב"}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{pattern.description}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Approach Tab ── */}
            {activeTab === "approach" && (
              <motion.div key="approach" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-bold text-foreground">הגישה שלנו</h2>
                  <p className="text-xs text-muted-foreground">העקרונות שמנחים אותנו</p>
                </div>

                {[
                  { title: "אנחנו לא מטפלים", body: "Nest AI הוא גשר נרטיבי — לא כלי התערבות. אנחנו לא מספקים אבחנות, לא נותנים עצות טיפוליות ולא מחליפים שום אינטראקציה אנושית.", icon: "🛡️" },
                  { title: "המטופל מגיע מוכן", body: "המרחב מאפשר למטופל לעבד מחשבות ורגשות בקצב שלו. הסיכום השבועי מרכז את הנקודות המשמעותיות ומאפשר כניסה מהירה לעומק בפגישה.", icon: "🎯" },
                  { title: "טיפול מבוסס מדידה", body: "ניטור מגמות רגשיות לאורך זמן מגביר את סיכויי ההחלמה ומחזק את המעורבות של המטופל — מבלי לאבד את האנושיות של התהליך.", icon: "📈" },
                  { title: "פרטיות מוחלטת", body: "כל המידע מוצפן מקצה לקצה. למטפל/ת יש גישה רק לסיכום השבועי — ולעולם לא לשיחות עצמן.", icon: "🔒" },
                ].map((item, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }}>
                    <Card className="p-5 rounded-2xl border-0 shadow-sm bg-card">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div className="space-y-1">
                          <h3 className="text-sm font-bold text-foreground">{item.title}</h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Lead Capture Footer */}
      <div className="border-t border-border bg-card/80 backdrop-blur-sm px-4 py-5">
        {!submitted ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 max-w-md mx-auto">
            <p className="text-sm font-semibold text-foreground text-center">צור/צרי איתנו קשר לפרטים נוספים</p>
            <div className="space-y-2">
              <Input type="email" placeholder="אימייל" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl text-sm" dir="ltr" />
              <Input type="tel" placeholder="מספר טלפון" value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl text-sm" dir="ltr" />
            </div>
            <Button onClick={handleContactSubmit} disabled={submitting} className="w-full rounded-full gap-2">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              שליחה
            </Button>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center justify-center gap-2 py-2">
            <CheckCircle2 className="w-5 h-5 text-secondary" />
            <p className="text-sm font-medium text-foreground">תודה! ניצור קשר בקרוב.</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProfessionalDemo;
