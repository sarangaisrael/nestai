import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDefaultRouteForUser } from "@/lib/userRoles";
import { Capacitor } from "@capacitor/core";
import { ChevronRight, ChevronLeft, Check, BookOpen, Calendar } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { he as heLocale } from "date-fns/locale";

/* ── Brand tokens ──────────────────────────── */
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

const DEFAULTS_HE = {
  nav_logo: 'NestAI', nav_cta1_text: 'למטפלים', nav_cta2_text: 'התחל בחינם',
  hero_line1: 'הרצף הטיפולי', hero_line2: 'מתחיל כאן',
  hero_subtitle: 'NestAI מאפשרת למטופלים לתעד את היומיום שלהם בין הפגישות — ולמטפל לקבל סיכום מוכן לפני כל מפגש.',
  hero_cta1: 'התחל בחינם ←', hero_cta2: 'למטפלים',
  hero_badge1: 'ללא הרשמה ארוכה', hero_badge2: 'פרטיות מלאה', hero_badge3: 'הצפנה מקצה לקצה',
  slide1_title: 'לא תישאר לבד עם המחשבות',
  slide1_subtitle: 'האפליקציה מלווה אותך בין הפגישות — בשיחה טבעית, בלי לחץ.',
  slide1_bullet1: 'תיעוד יומי טבעי', slide1_bullet2: 'אין משימות ואין לחץ', slide1_bullet3: 'הכל שמור ומוגן',
  slide2_title: 'סיכום חכם לפני כל פגישה',
  slide2_subtitle: 'לפני כל מפגש, המטפל מקבל סיכום מוכן על מה שעבר על המטופל — בלי לבקש, בלי להכין.',
  slide2_bullet1: 'סיכום שבועי אוטומטי', slide2_bullet2: 'מגמות ודפוסים רגשיים', slide2_bullet3: 'נושאים שכדאי לדון בהם',
  slide3_title: 'הברית שמחזיקה את הטיפול',
  slide3_subtitle: 'הרצף בין הפגישות הוא מה שמחזיק את התהליך הטיפולי.',
  slide3_bullet1: 'מחזקת את הקשר בין מטפל למטופל', slide3_bullet2: 'הנתונים שייכים למטופל', slide3_bullet3: 'בנויה על אמון',
  card1_title: 'למטפלים', card1_body: 'קבל סיכום מוכן לפני כל פגישה. המטופל מתעד ואתה מתמקד בטיפול.', card1_cta: 'הצטרף כמטפל ←',
  card2_title: 'למטופלים', card2_body: 'תיעוד פשוט ויומיומי. לא תישאר לבד עם המחשבות.', card2_cta: 'התחל בחינם ←',
  tools_title: 'הכלים שילוו אותך',
  tools_subtitle: 'פשוט, יומיומי, ומדויק לתהליך הטיפולי',
  tool1_icon: '📝', tool1_title: 'תיעוד יומי', tool1_text: 'רשום מה עבר עליך בין הפגישות — מחשבה, רגש, או רגע שרצית לשמור. בלי לחץ, בלי משימות.',
  tool2_icon: '📊', tool2_title: 'דוח מגמות', tool2_text: 'זיהוי אוטומטי של דפוסים חוזרים לאורך זמן — נושאים, רגשות, ואירועים שחוזרים בין הפגישות.',
  tool3_icon: '🗓️', tool3_title: 'סיכום לפני פגישה', tool3_text: 'לפני כל מפגש, המטפל מקבל סיכום מוכן — בלי לבקש, בלי להכין. המטופל מתעד, אתה מתמקד.',
  footer_text: '© 2025 NestAI.care — הפלטפורמה מספקת כלים לתיעוד בלבד.',
};

const DEFAULTS_EN = {
  nav_logo: 'NestAI', nav_cta1_text: 'For Therapists', nav_cta2_text: 'Get Started Free',
  hero_line1: 'Therapeutic Continuity', hero_line2: 'Starts Here',
  hero_subtitle: 'NestAI allows patients to document their daily life between sessions — giving the therapist a ready summary before each meeting.',
  hero_cta1: 'Get Started Free →', hero_cta2: 'For Therapists',
  hero_badge1: 'No lengthy signup', hero_badge2: 'Full privacy', hero_badge3: 'End-to-end encryption',
  slide1_title: "You won't be alone with your thoughts",
  slide1_subtitle: 'The app accompanies you between sessions — in natural conversation, without pressure.',
  slide1_bullet1: 'Natural daily documentation', slide1_bullet2: 'No tasks, no pressure', slide1_bullet3: 'Everything saved and protected',
  slide2_title: 'Smart summary before every session',
  slide2_subtitle: "Before each meeting, your therapist gets a ready summary of what you went through — no asking, no preparing.",
  slide2_bullet1: 'Automatic weekly summary', slide2_bullet2: 'Emotional trends and patterns', slide2_bullet3: 'Topics worth discussing',
  slide3_title: 'The bond that sustains therapy',
  slide3_subtitle: 'Continuity between sessions is what sustains the therapeutic process.',
  slide3_bullet1: 'Strengthens the therapist-patient bond', slide3_bullet2: 'Data belongs to the patient', slide3_bullet3: 'Built on trust',
  card1_title: 'For Therapists', card1_body: 'Get a ready summary before every session. The patient documents and you focus on therapy.', card1_cta: 'Join as Therapist →',
  card2_title: 'For Patients', card2_body: "Simple daily documentation. You won't be alone with your thoughts.", card2_cta: 'Get Started Free →',
  tools_title: 'The tools that will accompany you',
  tools_subtitle: 'Simple, daily, and precise to the therapeutic process',
  tool1_icon: '📝', tool1_title: 'Daily Documentation', tool1_text: 'Record what you went through between sessions — a thought, a feeling, or a moment you wanted to keep. No pressure, no tasks.',
  tool2_icon: '📊', tool2_title: 'Trends Report', tool2_text: 'Automatic identification of recurring patterns over time — themes, emotions, and events that recur between sessions.',
  tool3_icon: '🗓️', tool3_title: 'Pre-Session Summary', tool3_text: 'Before each meeting, the therapist gets a ready summary — no asking, no preparing. The patient documents, you focus.',
  footer_text: '© 2025 NestAI.care — The platform provides documentation tools only.',
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { dir, language, t } = useLanguage();
  const [cmsOverride, setCmsOverride] = useState<Record<string, string>>({});
  const content = language === 'he' ? { ...DEFAULTS_HE, ...cmsOverride } : DEFAULTS_EN;
  const [slide, setSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [blogPosts, setBlogPosts] = useState<Array<{ id: string; slug: string; title: string; excerpt: string | null; cover_image: string | null; created_at: string }>>([]);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (Capacitor.isNativePlatform()) {
        navigate(session ? await getDefaultRouteForUser(session.user.id) : '/app/chat', { replace: true });
        return;
      }
      if (isStandalone) {
        navigate(session ? '/app/dashboard' : '/app', { replace: true });
        return;
      }
      if (session) {
        navigate(await getDefaultRouteForUser(session.user.id), { replace: true });
        return;
      }
      const hash = window.location.hash;
      if (hash) {
        const hp = new URLSearchParams(hash.substring(1));
        if (hp.get('type') === 'recovery') {
          navigate(`/app/auth${hash}`, { replace: true });
          return;
        }
      }

      try {
        const { data, error } = await supabase.from('landing_content').select('*').eq('id', 1).single();
        if (!error && data) setCmsOverride(data);
      } catch { /* use defaults */ }

      // Fetch latest 3 blog posts (silently, no error shown)
      try {
        const { data: bpData } = await supabase
          .from('blog_posts')
          .select('id, slug, title, excerpt, cover_image, created_at')
          .eq('published', true)
          .order('created_at', { ascending: false })
          .limit(3);
        if (bpData) setBlogPosts(bpData as any);
      } catch { /* silent */ }

      setIsLoading(false);
    };
    init();
  }, [navigate]);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg, fontFamily: "'Heebo', sans-serif" }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${C.cardBorder}`, borderTopColor: C.accent, animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const slides = [
    { title: content.slide1_title, subtitle: content.slide1_subtitle, bullets: [content.slide1_bullet1, content.slide1_bullet2, content.slide1_bullet3], mockup: 'chat' as const },
    { title: content.slide2_title, subtitle: content.slide2_subtitle, bullets: [content.slide2_bullet1, content.slide2_bullet2, content.slide2_bullet3], mockup: 'summary' as const },
    { title: content.slide3_title, subtitle: content.slide3_subtitle, bullets: [content.slide3_bullet1, content.slide3_bullet2, content.slide3_bullet3], mockup: 'trends' as const },
  ];
  const currentSlide = slides[slide];

  /* ── Mockups ── */
  const ChatMockup = () => (
    <div style={{ borderRadius: 20, background: C.card, border: `1px solid ${C.cardBorder}`, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden', maxWidth: 340, margin: '0 auto' }}>
      <div style={{ background: C.accent, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>N</div>
        <div>
          <div style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>NestAI</div>
          <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>המרחב שלך</div>
        </div>
      </div>
      <div style={{ background: '#F8FAFC', padding: 12, minHeight: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { ai: true,  text: 'איך היה היום? 🌿' },
          { ai: false, text: 'הרגשתי לחוץ בעבודה' },
          { ai: true,  text: 'מובן. ספר לי יותר — מה גרם ללחץ?' },
          { ai: false, text: 'פגישה קשה עם המנהל' },
          { ai: true,  text: '✓ שמרתי. נדבר על זה בפגישה הבאה 📝' },
        ].map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.ai ? 'flex-start' : 'flex-end' }}>
            <div style={{ background: msg.ai ? '#ffffff' : C.accent, border: msg.ai ? `1px solid ${C.cardBorder}` : 'none', borderRadius: msg.ai ? '12px 12px 4px 12px' : '12px 12px 12px 4px', padding: '8px 12px', fontSize: 12, color: msg.ai ? C.text : '#fff', maxWidth: '85%' }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
      <div style={{ background: '#EFF6FF', color: C.accent, padding: '6px 12px', fontSize: 11, fontWeight: 600, textAlign: 'center', borderTop: `1px solid ${C.cardBorder}` }}>
        ✓ סיכום נשלח למטפל
      </div>
    </div>
  );

  const TrendsMockup = () => {
    const bars = [
      { day: "א׳", h: 40,  color: '#BFDBFE' },
      { day: "ב׳", h: 55,  color: '#93C5FD' },
      { day: "ג׳", h: 45,  color: '#60A5FA' },
      { day: "ד׳", h: 65,  color: '#3B82F6' },
      { day: "ה׳", h: 75,  color: '#2563EB' },
      { day: "ו׳", h: 85,  color: '#1D4ED8' },
      { day: "ש׳", h: 95,  color: '#1E40AF' },
    ];
    return (
      <div style={{ borderRadius: 16, background: '#ffffff', border: `1px solid ${C.cardBorder}`, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 20, maxWidth: 340, margin: '0 auto', direction: 'rtl' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>דוח מגמות שבועי</span>
          <span style={{ fontSize: 12, color: C.textSec }}>מאי 2025</span>
        </div>

        {/* Metric cards */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'חרדה',  value: '↓ 34%', sub: 'לעומת שבוע שעבר' },
            { label: 'שינה',  value: '↑ 18%', sub: 'שיפור מתמשך' },
          ].map((m, i) => (
            <div key={i} style={{ flex: 1, background: '#F0FDF4', borderRadius: 10, padding: '10px 12px', border: '1px solid #D1FAE5' }}>
              <div style={{ fontSize: 11, color: C.textSec, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#16A34A', lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: 10, color: C.textSec, marginTop: 4 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: C.textSec, marginBottom: 10 }}>מצב רוח — 7 ימים אחרונים</div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 72 }}>
            {bars.map((b, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ width: '100%', height: `${b.h}%`, background: b.color, borderRadius: '4px 4px 2px 2px', transition: 'height 0.3s ease' }} />
                <span style={{ fontSize: 9, color: C.textSec, whiteSpace: 'nowrap' }}>{b.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Insight box */}
        <div style={{ background: '#E6F1FB', borderRadius: 10, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1E3A5F', marginBottom: 4 }}>תובנה שבועית</div>
          <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6 }}>
            מצב הרוח עולה בעקביות לקראת סוף השבוע — דפוס שחוזר על עצמו 3 שבועות ברצף.
          </div>
        </div>
      </div>
    );
  };

  const SummaryMockup = () => (
    <div style={{ borderRadius: 16, background: '#ffffff', border: `1px solid ${C.cardBorder}`, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: 20, maxWidth: 340, margin: '0 auto', direction: 'rtl' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>סיכום שבועי</span>
        <span style={{ background: '#EFF6FF', color: C.accent, borderRadius: 50, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>✓ מוכן לפגישה</span>
      </div>
      {/* Summary text lines */}
      <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
        {[
          'הרגשתי לחץ בעבודה — קשה עם המנהל',
          'שלושה לילות עם שינה קצרה',
          'רגע טוב: ביקור משפחתי ביום ה׳',
        ].map((line, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: i < 2 ? 10 : 0 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, marginTop: 6, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>{line}</span>
          </div>
        ))}
      </div>
      {/* Themes row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {['לחץ', 'שינה', 'משפחה'].map((tag, i) => (
          <span key={i} style={{ background: '#EFF6FF', color: C.accent, borderRadius: 50, padding: '3px 12px', fontSize: 11, fontWeight: 600 }}>{tag}</span>
        ))}
      </div>
      {/* AI note */}
      <div style={{ background: '#E6F1FB', borderRadius: 10, padding: '10px 12px' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#1E3A5F', marginBottom: 4 }}>המלצה לפגישה</div>
        <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6 }}>
          שווה לדון ביחסים עם סמכות בעבודה — נושא שחזר 3 שבועות ברצף.
        </div>
      </div>
    </div>
  );

  /* ── Shared button styles ── */
  const btnPrimary: React.CSSProperties = { background: C.accent, color: '#fff', borderRadius: 50, border: 'none', padding: '14px 28px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Heebo', sans-serif" };
  const btnOutline: React.CSSProperties = { border: `1px solid ${C.accent}`, color: C.accent, background: 'transparent', borderRadius: 50, padding: '13px 24px', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'Heebo', sans-serif" };
  const btnOutlineSm: React.CSSProperties = { border: `1px solid ${C.accent}`, color: C.accent, background: 'transparent', borderRadius: 50, padding: '8px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Heebo', sans-serif" };
  const sectionPad: React.CSSProperties = { paddingTop: 80, paddingBottom: 80, paddingLeft: 24, paddingRight: 24 };

  return (
    <div dir={dir} style={{ fontFamily: "'Heebo', sans-serif", minHeight: '100vh', background: C.bg, color: C.text }}>

      {/* ── Navbar ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: C.navBg, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.navBorder}`, height: 64 }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: '100%' }}>

          {/* Right: logo */}
          <img src="/logo.png" alt="NestAI" style={{ display: 'block', height: 36, maxHeight: 36, width: 'auto' }} />

          {/* Left: language switcher + login */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <LanguageSwitcher variant="icon" />
            <button onClick={() => navigate('/app/auth')} style={{ background: 'none', border: 'none', color: C.text, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: "'Heebo', sans-serif" }}>
              {t.common.login}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ ...sectionPad, paddingTop: 144, textAlign: 'center', background: C.bg }}>
        <h1 style={{ margin: 0 }}>
          <span style={{ display: 'block', fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 800, color: C.text, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            {content.hero_line1}
          </span>
          <span style={{ display: 'block', fontSize: 'clamp(2.8rem, 6vw, 4.5rem)', fontWeight: 800, color: C.accent, lineHeight: 1.1, letterSpacing: '-0.03em', marginTop: 4 }}>
            {content.hero_line2}
          </span>
        </h1>

        <p style={{ maxWidth: 560, margin: '24px auto 0', fontSize: '1.1rem', color: C.textSec, lineHeight: 1.7 }}>
          {content.hero_subtitle}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 36, flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/app')} style={btnPrimary}>{content.hero_cta1}</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 28, flexWrap: 'wrap' }}>
          {[content.hero_badge1, content.hero_badge2, content.hero_badge3].map((badge, i) => (
            <span key={i} style={{ fontSize: 13, color: C.textSec, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={14} style={{ color: C.accent }} />
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* ── Slider ── */}
      <section style={{ ...sectionPad, background: C.bgAlt }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: C.text, marginBottom: 48 }}>
            {t.landing.howItWorks}
          </h2>

          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ transition: 'opacity 0.3s ease', opacity: 1 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {/* Text column */}
                <div>
                  <span style={{ background: '#EFF6FF', color: C.accent, borderRadius: 50, padding: '4px 12px', fontSize: 12, fontWeight: 600, display: 'inline-block', marginBottom: 16 }}>
                    {t.landing.step} {slide + 1} / 3
                  </span>
                  <h3 style={{ fontSize: 'clamp(1.6rem, 3vw, 2rem)', fontWeight: 800, color: C.text, marginBottom: 12, lineHeight: 1.2 }}>
                    {currentSlide.title}
                  </h3>
                  <p style={{ fontSize: '1rem', color: C.textSec, lineHeight: 1.7, marginBottom: 24 }}>
                    {currentSlide.subtitle}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {currentSlide.bullets.map((bullet, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                        <div style={{ width: 8, height: 8, background: C.accent, borderRadius: '50%', marginTop: 7, flexShrink: 0 }} />
                        <span style={{ fontSize: 15, color: C.textSec, fontWeight: 500 }}>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mockup column */}
                <div>
                  {currentSlide.mockup === 'chat' && <ChatMockup />}
                  {currentSlide.mockup === 'summary' && <SummaryMockup />}
                  {currentSlide.mockup === 'trends' && <TrendsMockup />}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 32 }}>
            <button onClick={() => setSlide(s => Math.max(0, s - 1))} disabled={slide === 0}
              style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${C.cardBorder}`, background: C.card, cursor: slide === 0 ? 'default' : 'pointer', opacity: slide === 0 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={18} color={C.textSec} />
            </button>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <button key={i} onClick={() => setSlide(i)}
                  style={{ width: i === slide ? 24 : 8, height: 8, borderRadius: i === slide ? 4 : '50%', background: i === slide ? C.accent : C.cardBorder, border: 'none', cursor: 'pointer', padding: 0, transition: 'all 0.2s ease' }} />
              ))}
            </div>

            <button onClick={() => setSlide(s => Math.min(2, s + 1))} disabled={slide === 2}
              style={{ width: 40, height: 40, borderRadius: '50%', border: `1.5px solid ${C.cardBorder}`, background: C.card, cursor: slide === 2 ? 'default' : 'pointer', opacity: slide === 2 ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronLeft size={18} color={C.textSec} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Tools ── */}
      <section style={{ ...sectionPad, background: C.bg }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2rem)', fontWeight: 800, color: C.text, marginBottom: 12 }}>
              {content.tools_title}
            </h2>
            <p style={{ fontSize: '1rem', color: C.textSec, lineHeight: 1.7 }}>
              {content.tools_subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: content.tool1_icon, title: content.tool1_title, text: content.tool1_text },
              { icon: content.tool2_icon, title: content.tool2_title, text: content.tool2_text },
              { icon: content.tool3_icon, title: content.tool3_title, text: content.tool3_text },
            ].map((tool, i) => (
              <div key={i}
                style={{ background: C.card, borderRadius: 16, padding: 28, border: `1px solid ${C.cardBorder}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; }}
              >
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', marginBottom: 20, flexShrink: 0 }}>
                  {tool.icon}
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: C.text, marginBottom: 10 }}>{tool.title}</h3>
                <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.75, margin: 0, flexGrow: 1 }}>{tool.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ ...sectionPad, background: C.bgAlt, textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: C.text, marginBottom: 16 }}>
          {content.card2_title || 'מוכן להתחיל?'}
        </h2>
        <p style={{ fontSize: 15, color: C.textSec, lineHeight: 1.7, marginBottom: 28, maxWidth: 480, margin: '0 auto 28px' }}>
          {content.card2_body}
        </p>
        <button onClick={() => navigate('/app')}
          style={{ background: C.accent, color: '#fff', borderRadius: 50, border: 'none', padding: '14px 36px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Heebo', sans-serif" }}>
          {content.card2_cta}
        </button>
      </section>

      {/* ── Blog preview ── */}
      {blogPosts.length > 0 && (
        <section style={{ paddingTop: 80, paddingBottom: 80, paddingLeft: 24, paddingRight: 24, background: C.bg }}>
          <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#EFF6FF', borderRadius: 50, padding: '5px 14px', marginBottom: 10 }}>
                  <BookOpen size={14} color={C.accent} />
                  <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>בלוג</span>
                </div>
                <h2 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, color: C.text, margin: 0 }}>
                  מהבלוג שלנו
                </h2>
              </div>
              <Link
                to="/blog"
                style={{ fontSize: 14, color: C.accent, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
              >
                לכל המאמרים ←
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {blogPosts.map(post => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <article
                    style={{
                      background: C.card,
                      borderRadius: 16,
                      border: `1px solid ${C.cardBorder}`,
                      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.11)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'; }}
                  >
                    {post.cover_image ? (
                      <div style={{ height: 160, overflow: 'hidden', flexShrink: 0 }}>
                        <img src={post.cover_image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ height: 110, background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <BookOpen size={32} color={C.accent} strokeWidth={1.5} />
                      </div>
                    )}
                    <div style={{ padding: '18px 20px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
                        <Calendar size={12} color={C.textSec} />
                        <span style={{ fontSize: 11, color: C.textSec }}>
                          {(() => { try { return format(new Date(post.created_at), "d בMMMM yyyy", { locale: heLocale }); } catch { return ""; } })()}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, margin: '0 0 8px', lineHeight: 1.4 }}>
                        {post.title}
                      </h3>
                      {post.excerpt && (
                        <p style={{
                          fontSize: 13, color: C.textSec, lineHeight: 1.7, margin: '0 0 12px', flexGrow: 1,
                          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                        }}>
                          {post.excerpt}
                        </p>
                      )}
                      <span style={{ fontSize: 13, color: C.accent, fontWeight: 600, marginTop: 'auto' }}>קרא עוד ←</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer style={{ background: '#1A1A2E', borderTop: `1px solid #2a2a45`, paddingTop: 32, paddingBottom: 32, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link to="/app/privacy" style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>{t.nav.privacy}</Link>
            <a href="#" style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>{t.landing.termsOfUse}</a>
            <a href="#" style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>{t.landing.contact}</a>
          </div>
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>{content.footer_text}</span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
