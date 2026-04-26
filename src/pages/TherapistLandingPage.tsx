import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import nestLogo from "@/assets/nestai-logo-full.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteContent } from "@/contexts/SiteContentContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  ArrowRight, ArrowLeft, PenLine, FileText, TrendingUp, Lock,
  Download, Stethoscope, CheckCircle2,
} from "lucide-react";
import IOSInstallOverlay from "@/components/IOSInstallOverlay";
import MediaSection from "@/components/landing/MediaSection";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const TherapistLandingPage = () => {
  const navigate = useNavigate();
  const { t, dir, isRTL } = useLanguage();
  const { get } = useSiteContent();
  const [showIOSOverlay, setShowIOSOverlay] = useState(false);
  const { isIOS, isInstalled, promptInstall, canShowAndroidPrompt } = usePWAInstall();

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  /** Read therapist-specific CMS key, with static fallback */
  const tp = (key: string, fallback: string) => get(`tp_${key}`, fallback);

  const handlePWAInstall = async () => {
    if (isIOS && !isInstalled) {
      setShowIOSOverlay(true);
    } else if (canShowAndroidPrompt) {
      await promptInstall();
    } else {
      navigate("/app/professional/intro");
    }
  };

  const features = [
    {
      icon: PenLine,
      title: tp("feature1_title", isRTL ? "יומן רגשי מונחה AI" : "AI-Guided Emotional Journal"),
      description: tp("feature1_desc", isRTL ? "המטופלים מתעדים את החוויות שלהם בשיחה טבעית עם AI שמלווה אותם בין הפגישות" : "Patients document their experiences in natural conversation with AI between sessions"),
    },
    {
      icon: FileText,
      title: tp("feature2_title", isRTL ? "דשבורד מטפל מקצועי" : "Professional Therapist Dashboard"),
      description: tp("feature2_desc", isRTL ? "צפו בסיכומים שבועיים, מגמות רגשיות ותובנות של כל מטופל במקום אחד" : "View weekly summaries, emotional trends and insights for each patient in one place"),
    },
    {
      icon: TrendingUp,
      title: tp("feature3_title", isRTL ? "ניתוח מגמות ודפוסים" : "Trends & Patterns Analysis"),
      description: tp("feature3_desc", isRTL ? "זהו דפוסים רגשיים, שינויים במצב הרוח ונקודות מפנה בתהליך הטיפולי" : "Identify emotional patterns, mood changes and turning points in the therapeutic process"),
    },
    {
      icon: Lock,
      title: tp("feature4_title", isRTL ? "פרטיות והצפנה מלאה" : "Full Privacy & Encryption"),
      description: tp("feature4_desc", isRTL ? "כל המידע מוצפן מקצה לקצה. רק המטפל והמטופל יכולים לגשת לתוכן" : "All data is end-to-end encrypted. Only the therapist and patient can access the content"),
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden" dir={dir}>
      {/* Header */}
      <header className="fixed top-4 left-4 right-4 z-50 bg-background/70 backdrop-blur-xl border border-border/40 rounded-2xl shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/">
              <img src={nestLogo} alt="NestAI.care" className="h-10 sm:h-14 object-contain" />
            </Link>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LanguageSwitcher variant="icon" />
            <Link to="/app/auth?mode=therapist">
              <Button variant="ghost" size="sm">{t.common.login}</Button>
            </Link>
            <Link to="/app/professional/intro">
              <Button size="sm" className="rounded-full px-6">
                {isRTL ? "הרשמה למטפלים" : "Therapist Sign Up"}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-primary/[0.02] to-background" />
          <div className="absolute top-0 left-0 right-0 h-[60%] bg-gradient-to-b from-primary/[0.06] to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-16 w-full">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Stethoscope className="w-4 h-4" />
              {tp("hero_badge", isRTL ? "לקליניקות ומטפלים" : "For Clinics & Therapists")}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-extrabold text-foreground leading-[1.12] tracking-tight">
              {tp("hero_title", isRTL ? "הכלי שמחבר בין הפגישות" : "The tool that connects between sessions")}
              <br />
              <span className="text-primary">
                {tp("hero_highlight", isRTL ? "ומעצים את התהליך הטיפולי" : "and empowers the therapeutic process")}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-[1.9] max-w-2xl mx-auto">
              {tp("hero_subtitle", isRTL
                ? "NestAI מאפשרת למטופלים לתעד את החוויות שלהם בין הפגישות, ומספקת למטפלים תובנות מעמיקות לקראת כל סשן"
                : "NestAI allows patients to document their experiences between sessions, providing therapists with deep insights before each session")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                size="lg"
                className="rounded-full px-12 gap-2 text-lg h-16 shadow-lg hover:shadow-[0_0_24px_-4px_hsl(var(--primary)/0.4)] transition-all duration-300"
                onClick={() => navigate("/app/professional/intro")}
              >
                {isRTL ? "הצטרפו כמטפלים" : "Join as Therapist"}
                <ArrowIcon className="w-5 h-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full px-8 gap-2 text-lg h-14"
                onClick={() => navigate("/app/professional/demo")}
              >
                {isRTL ? "צפו בדמו אינטראקטיבי" : "View Interactive Demo"}
              </Button>
            </div>
            <p className="text-sm font-medium text-primary">
              ✨ {isRTL ? "30 יום ניסיון חינם — ללא כרטיס אשראי" : "30-day free trial — no credit card required"}
            </p>
          </div>
        </div>
      </section>

      {/* Why Section */}
      <section className="py-20 px-6 bg-background">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
            {tp("why_badge", isRTL ? "למה צריך את זה?" : "Why do you need this?")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            {tp("why_title", isRTL ? "מה קורה בין הפגישות?" : "What happens between sessions?")}
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            {tp("why_description", isRTL
              ? "מחקרים מראים ש-80% מהתהליך הטיפולי קורה מחוץ לחדר הטיפול. NestAI עוזרת ללכוד את הרגעים האלה ולהפוך אותם לתובנות שמשפרות את הטיפול"
              : "Research shows that 80% of the therapeutic process happens outside the therapy room. NestAI helps capture those moments and turn them into insights that improve treatment")}
          </p>
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          <div className="bg-card rounded-3xl p-8 md:p-10 border border-border shadow-sm space-y-4">
            <span className="inline-block px-3 py-1.5 bg-destructive/10 text-destructive rounded-full text-sm font-semibold">
              {isRTL ? "האתגר" : "The Challenge"}
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {tp("problem_title", isRTL ? "מטופלים מגיעים לסשן בלי זיכרון מדויק" : "Patients arrive at sessions without accurate recall")}
            </h3>
            <p className="text-foreground/60 leading-relaxed text-base md:text-lg">
              {tp("problem_body", isRTL
                ? "בין פגישה לפגישה, מטופלים שוכחים רגעים חשובים, תובנות נעלמות, ודפוסים רגשיים לא מזוהים. המטפל מתחיל כל סשן מאפס"
                : "Between sessions, patients forget important moments, insights disappear, and emotional patterns go unrecognized. The therapist starts each session from scratch")}
            </p>
          </div>
          <div className="bg-card rounded-3xl p-8 md:p-10 border border-primary/30 shadow-sm space-y-4">
            <span className="inline-block px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold">
              {isRTL ? "הפתרון" : "The Solution"}
            </span>
            <h3 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {tp("solution_title", isRTL ? "יומן AI שמלווה את המטופל ומכין את המטפל" : "AI journal that accompanies the patient and prepares the therapist")}
            </h3>
            <p className="text-foreground/60 leading-relaxed text-base md:text-lg">
              {tp("solution_body", isRTL
                ? "NestAI מלווה את המטופל בתיעוד יומיומי טבעי, מזהה דפוסים ומגמות, ומייצרת סיכומים מקצועיים שמכינים את המטפל לסשן הבא"
                : "NestAI accompanies the patient in natural daily documentation, identifies patterns and trends, and generates professional summaries that prepare the therapist for the next session")}
            </p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              {tp("features_badge", isRTL ? "מה כלול?" : "What's Included?")}
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground">
              {tp("features_title", isRTL ? "הכלים שלכם" : "Your Tools")}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group bg-card rounded-3xl p-8 border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                <p className="text-foreground/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Media */}
      <MediaSection />

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <p className="text-4xl md:text-5xl font-bold text-foreground">
            {tp("cta_title", isRTL ? "מוכנים להתחיל?" : "Ready to get started?")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/app/professional/intro">
              <Button size="lg" className="rounded-full gap-2 px-10 text-lg h-14">
                {isRTL ? "הרשמה למטפלים" : "Therapist Sign Up"}
                <ArrowIcon className="w-5 h-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full gap-2 px-8 text-lg h-14" onClick={handlePWAInstall}>
              <Download className="w-5 h-5" />
              {t.nav.installApp}
            </Button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              {isRTL ? "30 יום ניסיון חינם" : "30-day free trial"}
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              {isRTL ? "ללא כרטיס אשראי" : "No credit card"}
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              {isRTL ? "אפס התערבות קלינית" : "Zero clinical intervention"}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={nestLogo} alt="NestAI" className="h-8 object-contain" />
            <span className="text-sm text-foreground/40">{t.footer.copyright}</span>
          </div>
          <div className="flex gap-6">
            <Link to="/" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
              {isRTL ? "למטופלים" : "For Patients"}
            </Link>
            <Link to="/app/privacy" className="text-sm text-foreground/60 hover:text-foreground transition-colors">
              {t.nav.privacy}
            </Link>
          </div>
        </div>
      </footer>

      <IOSInstallOverlay isOpen={showIOSOverlay} onClose={() => setShowIOSOverlay(false)} />
    </div>
  );
};

export default TherapistLandingPage;
