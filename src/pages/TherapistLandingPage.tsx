import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteContent } from "@/contexts/SiteContentContext";
import {
  ArrowRight, ArrowLeft, PenLine, FileText, TrendingUp, Lock,
  Download, Stethoscope, CheckCircle2, Check,
} from "lucide-react";
import IOSInstallOverlay from "@/components/IOSInstallOverlay";
import MediaSection from "@/components/landing/MediaSection";
import { usePWAInstall } from "@/hooks/usePWAInstall";

/* ── Brand tokens (matches LandingPage) ─────── */
const C = {
  bg:         '#F8F8F6',
  bgAlt:      '#F0F4F8',
  card:       '#ffffff',
  cardBorder: '#E5E7EB',
  text:       '#1A1A2E',
  textSec:    '#6B7280',
  accent:     '#4a9eff',
  navBg:      'rgba(248,248,246,0.9)',
  navBorder:  '#E5E7EB',
};

const TherapistLandingPage = () => {
  const navigate = useNavigate();
  const { t, dir, isRTL } = useLanguage();
  const { get } = useSiteContent();
  const [showIOSOverlay, setShowIOSOverlay] = useState(false);
  const { isIOS, isInstalled, promptInstall, canShowAndroidPrompt } = usePWAInstall();

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const tp = (key: string, fallback: string) => get(`tp_${key}`, fallback);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

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

  /* ── Shared button styles ── */
  const btnPrimary: React.CSSProperties = { background: C.accent, color: '#fff', borderRadius: 50, border: 'none', padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Heebo', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 8 };
  const btnPrimaryLg: React.CSSProperties = { ...btnPrimary, padding: '16px 40px', fontSize: 17 };
  const btnOutline: React.CSSProperties = { border: `1px solid ${C.accent}`, color: C.accent, background: 'transparent', borderRadius: 50, padding: '13px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'Heebo', sans-serif", display: 'inline-flex', alignItems: 'center', gap: 8 };
  const btnOutlineSm: React.CSSProperties = { border: `1px solid ${C.accent}`, color: C.accent, background: 'transparent', borderRadius: 50, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Heebo', sans-serif" };
  const sectionPad: React.CSSProperties = { paddingTop: 80, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 };

  return (
    <div dir={dir} style={{ fontFamily: "'Heebo', sans-serif", minHeight: '100vh', background: C.bg, color: C.text }}>

      {/* ── Navbar ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: C.navBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.navBorder}`, height: 64 }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '100%' }}>

          {/* Right: logo */}
          <Link to="/">
            <img src="/logo.png" alt="NestAI" style={{ display: 'block', height: 36, maxHeight: 36, width: 'auto' }} />
          </Link>

          {/* Left: login + signup */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/app/auth?mode=therapist')} style={{ background: 'none', border: 'none', color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'Heebo', sans-serif" }}>
              {t.common.login}
            </button>
            <button onClick={() => navigate('/app/professional/intro')} style={btnOutlineSm}>
              {isRTL ? "הרשמה למטפלים" : "Therapist Sign Up"}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ ...sectionPad, paddingTop: 144, textAlign: 'center', background: C.bg }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#EFF6FF', color: C.accent, borderRadius: 50, padding: '6px 16px', fontSize: 13, fontWeight: 600, marginBottom: 28 }}>
          <Stethoscope size={15} />
          {tp("hero_badge", isRTL ? "לקליניקות ומטפלים" : "For Clinics & Therapists")}
        </div>

        <h1 style={{ margin: 0 }}>
          <span style={{ display: 'block', fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 800, color: C.text, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            {tp("hero_title", isRTL ? "הכלי שמחבר בין הפגישות" : "The tool that connects between sessions")}
          </span>
          <span style={{ display: 'block', fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 800, color: C.accent, lineHeight: 1.1, letterSpacing: '-0.03em', marginTop: 4 }}>
            {tp("hero_highlight", isRTL ? "ומעצים את התהליך הטיפולי" : "and empowers the therapeutic process")}
          </span>
        </h1>

        <p style={{ maxWidth: 600, margin: '24px auto 0', fontSize: '1.1rem', color: C.textSec, lineHeight: 1.8 }}>
          {tp("hero_subtitle", isRTL
            ? "NestAI מאפשרת למטופלים לתעד את החוויות שלהם בין הפגישות, ומספקת למטפלים תובנות מעמיקות לקראת כל סשן"
            : "NestAI allows patients to document their experiences between sessions, providing therapists with deep insights before each session")}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/app/professional/intro')} style={btnPrimaryLg}>
            {isRTL ? "הצטרפו כמטפלים" : "Join as Therapist"}
            <ArrowIcon size={18} />
          </button>
          <button onClick={() => navigate('/app/professional/demo')} style={btnOutline}>
            {isRTL ? "צפו בדמו אינטראקטיבי" : "View Interactive Demo"}
          </button>
        </div>

        <p style={{ marginTop: 20, fontSize: 14, fontWeight: 600, color: C.accent }}>
          ✨ {isRTL ? "30 יום ניסיון חינם — ללא כרטיס אשראי" : "30-day free trial — no credit card required"}
        </p>
      </section>

      {/* ── Why Section ── */}
      <section style={{ ...sectionPad, background: C.bgAlt }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: '#EFF6FF', color: C.accent, borderRadius: 50, padding: '6px 16px', fontSize: 13, fontWeight: 600, marginBottom: 20 }}>
            {tp("why_badge", isRTL ? "למה צריך את זה?" : "Why do you need this?")}
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)', fontWeight: 800, color: C.text, marginBottom: 20, lineHeight: 1.2 }}>
            {tp("why_title", isRTL ? "מה קורה בין הפגישות?" : "What happens between sessions?")}
          </h2>
          <p style={{ fontSize: '1.1rem', color: C.textSec, lineHeight: 1.8, maxWidth: '42rem', margin: '0 auto' }}>
            {tp("why_description", isRTL
              ? "מחקרים מראים ש-80% מהתהליך הטיפולי קורה מחוץ לחדר הטיפול. NestAI עוזרת ללכוד את הרגעים האלה ולהפוך אותם לתובנות שמשפרות את הטיפול"
              : "Research shows that 80% of the therapeutic process happens outside the therapy room. NestAI helps capture those moments and turn them into insights that improve treatment")}
          </p>
        </div>
      </section>

      {/* ── Problem / Solution ── */}
      <section style={{ ...sectionPad, background: C.bg }}>
        <div style={{ maxWidth: '56rem', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>

          {/* Problem */}
          <div style={{ background: C.card, borderRadius: 20, padding: 36, border: `1px solid ${C.cardBorder}`, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <span style={{ display: 'inline-block', background: '#FEF2F2', color: '#DC2626', borderRadius: 50, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
              {isRTL ? "האתגר" : "The Challenge"}
            </span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: C.text, marginBottom: 14, lineHeight: 1.3 }}>
              {tp("problem_title", isRTL ? "מטופלים מגיעים לסשן בלי זיכרון מדויק" : "Patients arrive at sessions without accurate recall")}
            </h3>
            <p style={{ fontSize: 15, color: C.textSec, lineHeight: 1.75 }}>
              {tp("problem_body", isRTL
                ? "בין פגישה לפגישה, מטופלים שוכחים רגעים חשובים, תובנות נעלמות, ודפוסים רגשיים לא מזוהים. המטפל מתחיל כל סשן מאפס"
                : "Between sessions, patients forget important moments, insights disappear, and emotional patterns go unrecognized. The therapist starts each session from scratch")}
            </p>
          </div>

          {/* Solution */}
          <div style={{ background: C.card, borderRadius: 20, padding: 36, border: `1px solid ${C.cardBorder}`, borderTop: `3px solid ${C.accent}`, boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
            <span style={{ display: 'inline-block', background: '#EFF6FF', color: C.accent, borderRadius: 50, padding: '4px 14px', fontSize: 12, fontWeight: 700, marginBottom: 20 }}>
              {isRTL ? "הפתרון" : "The Solution"}
            </span>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: C.text, marginBottom: 14, lineHeight: 1.3 }}>
              {tp("solution_title", isRTL ? "יומן AI שמלווה את המטופל ומכין את המטפל" : "AI journal that accompanies the patient and prepares the therapist")}
            </h3>
            <p style={{ fontSize: 15, color: C.textSec, lineHeight: 1.75 }}>
              {tp("solution_body", isRTL
                ? "NestAI מלווה את המטופל בתיעוד יומיומי טבעי, מזהה דפוסים ומגמות, ומייצרת סיכומים מקצועיים שמכינים את המטפל לסשן הבא"
                : "NestAI accompanies the patient in natural daily documentation, identifies patterns and trends, and generates professional summaries that prepare the therapist for the next session")}
            </p>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ ...sectionPad, background: C.bgAlt }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ display: 'inline-block', background: '#EFF6FF', color: C.accent, borderRadius: 50, padding: '6px 16px', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              {tp("features_badge", isRTL ? "מה כלול?" : "What's Included?")}
            </span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: C.text }}>
              {tp("features_title", isRTL ? "הכלים שלכם" : "Your Tools")}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}>
            {features.map((feature, i) => (
              <div key={i}
                style={{ background: C.card, borderRadius: 16, padding: 28, border: `1px solid ${C.cardBorder}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, flexShrink: 0 }}>
                  <feature.icon size={22} color={C.accent} />
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: C.text, marginBottom: 10 }}>{feature.title}</h3>
                <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.75, margin: 0, flexGrow: 1 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Media ── */}
      <div style={{ background: C.bg }}>
        <MediaSection />
      </div>

      {/* ── CTA ── */}
      <section style={{ ...sectionPad, background: C.bgAlt, textAlign: 'center' }}>
        <div style={{ maxWidth: '48rem', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 800, color: C.text, marginBottom: 32, lineHeight: 1.2 }}>
            {tp("cta_title", isRTL ? "מוכנים להתחיל?" : "Ready to get started?")}
          </h2>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
            <button onClick={() => navigate('/app/professional/intro')} style={btnPrimaryLg}>
              {isRTL ? "הרשמה למטפלים" : "Therapist Sign Up"}
              <ArrowIcon size={18} />
            </button>
            <button onClick={handlePWAInstall} style={btnOutline}>
              <Download size={16} />
              {t.nav.installApp}
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
            {[
              isRTL ? "30 יום ניסיון חינם" : "30-day free trial",
              isRTL ? "ללא כרטיס אשראי" : "No credit card",
              isRTL ? "אפס התערבות קלינית" : "Zero clinical intervention",
            ].map((label, i) => (
              <span key={i} style={{ fontSize: 13, color: C.textSec, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={14} style={{ color: C.accent }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#1A1A2E', borderTop: '1px solid #2a2a45', paddingTop: 32, paddingBottom: 32, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link to="/" style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>
              {isRTL ? "למטופלים" : "For Patients"}
            </Link>
            <Link to="/app/privacy" style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>
              {t.nav.privacy}
            </Link>
          </div>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>{t.footer.copyright}</span>
        </div>
      </footer>

      <IOSInstallOverlay isOpen={showIOSOverlay} onClose={() => setShowIOSOverlay(false)} />
    </div>
  );
};

export default TherapistLandingPage;
