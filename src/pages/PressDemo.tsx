import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Copy, BookOpen, FileText, Sparkles, PenLine, Heart, ChevronLeft, ChevronRight, TrendingUp, Brain, Shield, Target } from "lucide-react";
import { motion } from "framer-motion";
import AppHeader from "@/components/AppHeader";

// ─── Mock Chat Messages ───
const mockMessages = [
  {
    id: "m1",
    text: "חזרתי השבוע מהמילואים. שלושה שבועות בצפון. קשה לי לחזור לשגרה, הכל מרגיש מוזר. בעבודה מצפים שאני אהיה כאילו כלום לא קרה, ובבית אני מרגיש שאני לא באמת נוכח. יש רגעים שאני פשוט יושב ובוהה.",
    role: "user" as const,
    created_at: "2026-02-15T09:23:00Z",
  },
  {
    id: "m2",
    text: "תודה ששיתפת. המעבר מהמילואים חזרה לשגרה הוא תהליך שלוקח זמן — זה לא משהו שפשוט \"מכבים\". מה שאתה מתאר, התחושה של להיות נוכח פיזית אבל לא ממש \"שם\", היא חוויה שהרבה אנשים מכירים אחרי תקופות כאלה. מה הדבר הכי קשה לך כרגע — ההסתגלות בעבודה, או התחושה בבית?",
    role: "assistant" as const,
    created_at: "2026-02-15T09:24:00Z",
  },
  {
    id: "m3",
    text: "דווקא בבית. בעבודה אני עסוק אז אני לא חושב על זה. אבל בבית כשהילדים מסביב אני מרגיש אשמה שאני לא מצליח להיות ברגע. בת הזוג שלי סבלנית אבל אני רואה שגם היא עייפה מזה.",
    role: "user" as const,
    created_at: "2026-02-15T09:26:00Z",
  },
  {
    id: "m4",
    text: "האשמה הזו שאתה מרגיש — היא דווקא סימן לכך שאכפת לך עמוקות. עצם זה שאתה שם לב שאתה \"לא ברגע\" מראה מודעות גבוהה. במקום לשפוט את עצמך, אולי שווה לנסות לבחור רגע קטן אחד ביום — קריאת סיפור לילדים, שיחה קצרה עם בת הזוג — ולהיות שם באמת, בלי ציפייה לשלמות. מה דעתך?",
    role: "assistant" as const,
    created_at: "2026-02-15T09:27:00Z",
  },
  {
    id: "m5",
    text: "כן, אני חושב שזה רעיון טוב. אני אנסה עם קריאת סיפור לפני השינה, זה משהו שתמיד אהבתי לעשות איתם.",
    role: "user" as const,
    created_at: "2026-02-15T09:29:00Z",
  },
  {
    id: "m6",
    text: "בסדר גמור, מכניס את זה לסיכום השבועי 📝\nשווה להעלות את מה שסיפרת כאן בטיפול הבא.",
    role: "assistant" as const,
    created_at: "2026-02-15T09:30:00Z",
  },
];

// ─── Mock Weekly Summary ───
const mockSummaryText = `השבוע שלך היה מלא — חזרה ממילואים, הסתגלות מחדש לשגרה, וניסיון למצוא את המקום שלך בתוך כל זה. הנה הנושאים המרכזיים שעלו:

• איזון בית-עבודה: חזרת לעבודה תוך ימים ספורים מהמילואים. בזמן שבעבודה אתה מצליח "לתפקד", בבית התחושה שונה — קושי להיות נוכח רגשית עם המשפחה.

• הסתגלות אחרי מילואים: תיארת תחושת ניתוק ובהייה. זהו תהליך נורמלי — המעבר בין סביבה אחת לשנייה דורש זמן ועיבוד.

• צמיחה אישית ומודעות עצמית: הצלחת לזהות את מה שקורה לך ולדבר על זה. עצם הכתיבה היומית מראה נכונות להתבונן פנימה ולהתמודד.

• רגשות אשמה: עלה נושא האשמה כלפי בני המשפחה — תחושה שאתה "לא מספיק" כהורה ובן זוג. חשוב לזכור שאשמה לא שווה כישלון.

נושאים שכדאי לדבר עליהם בטיפול:
• התהליך של חזרה ממילואים — מה זה מעורר?
• ציפיות מעצמך כהורה וכבן זוג — האם הן ריאליסטיות?
• כלים להיות "נוכח" ברגעים קטנים

⚠️ הסיכום הזה הוא כלי רפלקטיבי ואינו מהווה תחליף לטיפול מקצועי.`;

// ─── Mock Dashboard Insights ───
const mockEmotions = [
  { label: "חוסן", pct: 40, color: "hsl(var(--primary))" },
  { label: "רפלקטיביות", pct: 30, color: "hsl(var(--accent))" },
  { label: "חרדה", pct: 30, color: "hsl(var(--muted-foreground))" },
];

const mockThemes = [
  { icon: Shield, label: "חוסן נפשי", desc: "יכולת גבוהה לתאר קשיים ולהתמודד" },
  { icon: Target, label: "מיקוד במשפחה", desc: "עדיפות ברורה לקשרים משפחתיים" },
  { icon: Brain, label: "מודעות עצמית", desc: "זיהוי דפוסים רגשיים באופן עצמאי" },
  { icon: TrendingUp, label: "התקדמות", desc: "שיפור ביכולת הביטוי לאורך זמן" },
];

const PressDemo = () => {
  const [activeTab, setActiveTab] = useState<"chat" | "summary" | "insights">("chat");

  const tabs = [
    { key: "chat" as const, label: "צ'אט", icon: PenLine },
    { key: "summary" as const, label: "סיכום שבועי", icon: BookOpen },
    { key: "insights" as const, label: "תובנות", icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <AppHeader />

      {/* Tab selector */}
      <div className="flex justify-center gap-2 px-4 py-3 border-b border-border/30">
        {tabs.map(({ key, label, icon: Icon }) => (
          <Button
            key={key}
            variant={activeTab === key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveTab(key)}
            className="gap-1.5 rounded-xl"
          >
            <Icon className="h-4 w-4" />
            {label}
          </Button>
        ))}
      </div>

      {/* ─── Chat Screen ─── */}
      {activeTab === "chat" && (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-2xl mx-auto space-y-5 w-full">
              {mockMessages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2.5 shadow-sm ${
                      message.role === "user"
                        ? "bg-card ml-auto text-foreground border border-border"
                        : "bg-primary/10 mr-auto text-foreground"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.text}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {new Date(message.created_at).toLocaleTimeString("he-IL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Input bar */}
          <div className="bg-card border-t border-border px-3 py-2.5 shrink-0 shadow-sm">
            <div className="max-w-2xl mx-auto flex gap-2 w-full items-end">
              <Textarea
                value=""
                readOnly
                placeholder="מה עובר עליך היום?"
                className="resize-none bg-background border border-border rounded-lg text-base min-h-[44px] max-h-[100px] px-3 py-2.5"
                rows={1}
                style={{ fontSize: "16px" }}
              />
              <Button size="icon" disabled className="shrink-0 h-10 w-10">
                ←
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Weekly Summary Screen ─── */}
      {activeTab === "summary" && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            <div className="bg-card rounded-[20px] p-6 border border-border space-y-6">
              <div className="bg-muted/30 p-4 rounded-[14px] border border-border/50">
                <p className="text-sm text-muted-foreground text-center leading-relaxed">
                  זהו הסיכום השבועי על סמך מה שנכתב השבוע
                </p>
              </div>

              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="text-sm text-muted-foreground">9.2.2026 – 15.2.2026</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2 h-9 rounded-xl">
                    <span className="text-sm">שתף</span>
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 h-9 rounded-xl">
                    <Copy className="h-3.5 w-3.5" />
                    <span className="text-sm">העתק</span>
                  </Button>
                </div>
              </div>

              <div className="prose prose-sm max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-wrap">{mockSummaryText}</p>
              </div>

              {/* Emotion meter mock */}
              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-sm font-medium text-foreground">איך הרגשת השבוע?</p>
                <div className="flex justify-center gap-3">
                  {["😔", "😐", "🙂", "😊", "🤩"].map((emoji, i) => (
                    <button
                      key={i}
                      className={`text-2xl p-2 rounded-full transition-all ${
                        i === 2 ? "bg-primary/20 scale-125 ring-2 ring-primary/40" : "opacity-50"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Insights / Trends Dashboard ─── */}
      {activeTab === "insights" && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-4 py-8 space-y-5">
            {/* Dominant Emotions Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-5 border-0 glass-card tech-border shadow-card rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-2xl bg-primary/10">
                    <Heart className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">רגשות דומיננטיים — פברואר 2026</h3>
                </div>
                <div className="space-y-3">
                  {mockEmotions.map((e) => (
                    <div key={e.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-foreground">{e.label}</span>
                        <span className="text-muted-foreground">{e.pct}%</span>
                      </div>
                      <div className="h-2.5 bg-muted/40 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${e.pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: e.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Key themes */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <Card className="p-5 border-0 glass-card tech-border shadow-card rounded-3xl space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-2xl bg-accent/10">
                    <Brain className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">נושאים מרכזיים</h3>
                </div>
                <div className="space-y-3">
                  {mockThemes.map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex items-start gap-3 p-3 rounded-2xl bg-muted/20">
                      <div className="p-1.5 rounded-xl bg-primary/10 mt-0.5">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{label}</p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Stats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-5 border-0 glass-card tech-border shadow-card rounded-3xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 rounded-2xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">סטטיסטיקה חודשית</h3>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "ימי כתיבה", value: "18" },
                    { label: "רצף מקסימלי", value: "12 ימים" },
                    { label: "סה״כ מילים", value: "4,320" },
                    { label: "ממוצע יומי", value: "240 מילים" },
                  ].map((s) => (
                    <div key={s.label} className="text-center p-3 rounded-2xl bg-muted/20">
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Actionable next step */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="p-5 border-0 glass-card tech-border shadow-card rounded-3xl">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 rounded-2xl bg-accent/10">
                    <Target className="h-5 w-5 text-accent" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">הצעד הבא</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  נסה השבוע לבחור רגע אחד ביום שבו אתה "נוכח" לגמרי עם המשפחה — ללא טלפון, ללא ציפיות. שים לב מה קורה כשאתה נותן לעצמך רשות פשוט להיות שם.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PressDemo;
