import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDefaultRouteForUser } from "@/lib/userRoles";
import { Capacitor } from "@capacitor/core";

const F = "'Heebo', sans-serif";

const CSS = `
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── Responsive ── */
  .lp-hero {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 48px;
    padding: 72px 48px;
    align-items: center;
    max-width: 1100px;
    margin: 0 auto;
  }
  .lp-steps-header {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-items: start;
    margin-bottom: 40px;
  }
  .lp-steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
  }
  .lp-step-card {
    padding: 32px 28px;
    background: #ffffff;
    border: 0.5px solid #e2e8f0;
  }
  .lp-step-card:not(:last-child) {
    border-left: none;
  }
  .lp-step-card:first-child {
    border-radius: 20px 0 0 20px;
  }
  .lp-step-card:last-child {
    border-radius: 0 20px 20px 0;
    border-left: 0.5px solid #e2e8f0;
  }
  .lp-cta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 32px;
  }
  .lp-footer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .lp-mockup-wrap {
    display: flex;
    justify-content: center;
  }
  .lp-hero-btns {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }
  .lp-cta-btn-full { width: auto; }

  @media (max-width: 768px) {
    .lp-hero {
      grid-template-columns: 1fr;
      padding: 52px 24px 48px;
      gap: 40px;
    }
    .lp-steps-header {
      grid-template-columns: 1fr;
    }
    .lp-steps-grid {
      grid-template-columns: 1fr;
    }
    .lp-step-card:first-child { border-radius: 20px 20px 0 0; }
    .lp-step-card:last-child  { border-radius: 0 0 20px 20px; border-left: 0.5px solid #e2e8f0; border-top: none; }
    .lp-step-card:not(:last-child) { border-left: 0.5px solid #e2e8f0; border-bottom: none; }
    .lp-cta-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 20px;
    }
    .lp-cta-btn-full { width: 100%; text-align: center; }
    .lp-footer-row { flex-direction: column; gap: 12px; align-items: flex-start; }
    .lp-mockup-wrap { order: 1; }
    .lp-hero-text  { order: 0; }
    .lp-nav { padding: 14px 24px !important; }
    .lp-steps-section { padding: 52px 24px !important; }
    .lp-cta-section { margin: 0 16px !important; padding: 40px 24px !important; }
    .lp-footer { padding: 20px 24px !important; }
  }
`;

/* ── Phone Mockup ─────────────────────────────────────────────────────────── */
const PhoneMockup = () => (
  <div style={{
    border: '6px solid #111',
    borderRadius: 32,
    background: '#f8fafc',
    padding: 20,
    maxWidth: 300,
    width: '100%',
    fontFamily: F,
    boxSizing: 'border-box',
  }}>
    {/* Notch pill */}
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
      <div style={{ width: 48, height: 4, borderRadius: 2, background: '#d1d5db' }} />
    </div>

    {/* App header */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {['#e5e7eb', '#e5e7eb'].map((bg, i) => (
          <div key={i} style={{ width: 24, height: 24, borderRadius: 7, background: bg }} />
        ))}
      </div>
      <span style={{ fontSize: 13, fontWeight: 900, color: '#111' }}>NestAI</span>
    </div>

    {/* Write card */}
    <div style={{
      background: '#3730a3', borderRadius: 14, padding: '14px 14px 12px',
      marginBottom: 10,
    }}>
      {/* Tag */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        background: 'rgba(255,255,255,0.15)', borderRadius: 50,
        padding: '2px 8px', marginBottom: 8,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#a5b4fc', flexShrink: 0 }} />
        <span style={{ fontSize: 8, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          רגע של הקשבה
        </span>
      </div>
      {/* Question */}
      <p style={{ fontSize: 11, fontWeight: 800, color: '#fff', margin: '0 0 8px', lineHeight: 1.4 }}>
        מה עברת מאז הפגישה האחרונה?
      </p>
      {/* Input row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.12)', borderRadius: 8,
        padding: '7px 8px',
      }}>
        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', flex: 1 }}>כתוב כאן...</span>
        <div style={{
          width: 22, height: 22, borderRadius: 6, background: '#1e1b4b',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path d="M4.5 8V1M4.5 1L2 3.5M4.5 1L7 3.5" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>

    {/* 2 mini cards */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
      {/* Summary card */}
      <div style={{ background: '#fffbeb', border: '1.5px solid #fde68a', borderRadius: 10, padding: '10px 10px 8px' }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>📋</span>
        <p style={{ fontSize: 9, fontWeight: 800, color: '#92400e', margin: '6px 0 2px' }}>סיכום</p>
        <p style={{ fontSize: 8, color: '#b45309', margin: 0 }}>שבועי</p>
      </div>
      {/* Trends card */}
      <div style={{ background: '#ecfdf5', border: '1.5px solid #6ee7b7', borderRadius: 10, padding: '10px 10px 8px' }}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>📈</span>
        <p style={{ fontSize: 9, fontWeight: 800, color: '#065f46', margin: '6px 0 2px' }}>מגמות</p>
        <p style={{ fontSize: 8, color: '#059669', margin: 0 }}>חודשי</p>
      </div>
    </div>

    {/* Streak bar */}
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10,
      padding: '8px 10px',
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: '#c2410c' }}>ימים ברצף 🔥</span>
      <span style={{
        fontSize: 12, fontWeight: 900, color: '#d97706',
        background: '#fef3c7', borderRadius: 6, padding: '1px 7px',
      }}>7</span>
    </div>
  </div>
);

// ── CMS content type + defaults ──────────────────────────────────────────────
type LandingContent = {
  nav_cta2_text: string;
  hero_eyebrow: string;
  hero_eyebrow2: string;
  hero_line1: string;
  hero_line2: string;
  hero_subtitle: string;
  hero_cta1: string;
  hero_badge1: string;
  hero_badge2: string;
  hero_badge3: string;
  steps_title: string;
  steps_subtitle: string;
  step1_title: string;
  step1_body: string;
  step2_title: string;
  step2_body: string;
  step3_title: string;
  step3_body: string;
  cta_section_title: string;
  cta_section_sub: string;
  cta_section_button: string;
};

const DEFAULT_CONTENT: LandingContent = {
  nav_cta2_text:      'מתחילים לכתוב בחינם',
  hero_eyebrow:       'מרחב לעיבוד ומעקב של התהליך הטיפולי',
  hero_eyebrow2:      '100% חינם לתמיד',
  hero_line1:         'הטיפול נמשך גם',
  hero_line2:         'בין הפגישות.',
  hero_subtitle:      'תעד את מה שעובר עליך, עקוב אחרי התקדמות, וקבל סיכום שמעצים כל מפגש.',
  hero_cta1:          'מתחילים לכתוב בחינם',
  hero_badge1:        'ללא כרטיס אשראי',
  hero_badge2:        'פרטיות מלאה',
  hero_badge3:        'מוצפן',
  steps_title:        '3 צעדים פשוטים בדרך לטיפול אפקטיבי יותר',
  steps_subtitle:     'מהרגע שאתה פותח את האפליקציה עד לפגישה הבאה — הכל קורה בשביל שתגיע מוכן ומחובר לעצמך.',
  step1_title:        'כתיבה חופשית',
  step1_body:         'כותבים שתי דקות ביום את מה שיושב על הלב, בלי לפחד לשכוח שום דבר במפגש.',
  step2_title:        'ראה את המגמות',
  step2_body:         'עקוב אחרי דפוסים חוזרים וראה את ההתקדמות הרגשית שלך לאורך זמן.',
  step3_title:        'מפסיקים לבזבז זמן יקר',
  step3_body:         'מקבלים סיכום מדויק ישירות לנייד, ומגיעים לקליניקה מוכנים לצלול ישר לעומק.',
  cta_section_title:  'מוכן/ה להתחיל?',
  cta_section_sub:    'הצטרף לאלפי משתמשים שמגיעים לכל פגישה מוכנים יותר.',
  cta_section_button: 'מתחילים לכתוב בחינם',
};
// ─────────────────────────────────────────────────────────────────────────────

/* ── Main component ─────────────────────────────────────────────────────────── */
const LandingPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [content, setContent] = useState<LandingContent>(DEFAULT_CONTENT);

  /* ── Auth redirect + CMS (unchanged logic) ── */
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

      setIsLoading(false);
    };
    init();
  }, [navigate]);

  // Fetch CMS content non-blocking — defaults render immediately, DB text swaps in.
  // Column mapping: semantic name → actual landing_content DB column
  //   hero_eyebrow       ← hero_cta2       (repurposed)
  //   hero_eyebrow2      ← nav_cta1_text   (repurposed)
  //   steps_title        ← tools_title     (repurposed)
  //   steps_subtitle     ← tools_subtitle  (repurposed)
  //   step1_title/body   ← slide1_title / slide1_subtitle
  //   step2_title/body   ← slide2_title / slide2_subtitle
  //   step3_title/body   ← slide3_title / slide3_subtitle
  //   cta_section_title  ← card1_title     (repurposed)
  //   cta_section_sub    ← card1_body      (repurposed)
  //   cta_section_button ← card1_cta       (repurposed)
  useEffect(() => {
    supabase
      .from('landing_content')
      .select('*')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (!data) return;
        const d = data as Record<string, string>;
        const pick = (col: string, fallback: string) =>
          d[col]?.trim() ? d[col] : fallback;
        setContent({
          nav_cta2_text:      pick('nav_cta2_text',   DEFAULT_CONTENT.nav_cta2_text),
          hero_eyebrow:       pick('hero_cta2',       DEFAULT_CONTENT.hero_eyebrow),
          hero_eyebrow2:      pick('nav_cta1_text',   DEFAULT_CONTENT.hero_eyebrow2),
          hero_line1:         pick('hero_line1',      DEFAULT_CONTENT.hero_line1),
          hero_line2:         pick('hero_line2',      DEFAULT_CONTENT.hero_line2),
          hero_subtitle:      pick('hero_subtitle',   DEFAULT_CONTENT.hero_subtitle),
          hero_cta1:          pick('hero_cta1',       DEFAULT_CONTENT.hero_cta1),
          hero_badge1:        pick('hero_badge1',     DEFAULT_CONTENT.hero_badge1),
          hero_badge2:        pick('hero_badge2',     DEFAULT_CONTENT.hero_badge2),
          hero_badge3:        pick('hero_badge3',     DEFAULT_CONTENT.hero_badge3),
          steps_title:        pick('tools_title',     DEFAULT_CONTENT.steps_title),
          steps_subtitle:     pick('tools_subtitle',  DEFAULT_CONTENT.steps_subtitle),
          step1_title:        pick('slide1_title',    DEFAULT_CONTENT.step1_title),
          step1_body:         pick('slide1_subtitle', DEFAULT_CONTENT.step1_body),
          step2_title:        pick('slide2_title',    DEFAULT_CONTENT.step2_title),
          step2_body:         pick('slide2_subtitle', DEFAULT_CONTENT.step2_body),
          step3_title:        pick('slide3_title',    DEFAULT_CONTENT.step3_title),
          step3_body:         pick('slide3_subtitle', DEFAULT_CONTENT.step3_body),
          cta_section_title:  pick('card1_title',     DEFAULT_CONTENT.cta_section_title),
          cta_section_sub:    pick('card1_body',      DEFAULT_CONTENT.cta_section_sub),
          cta_section_button: pick('card1_cta',       DEFAULT_CONTENT.cta_section_button),
        });
      });
  }, []);

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff', fontFamily: F }}>
        <style>{CSS}</style>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2.5px solid #e0e7ff', borderTopColor: '#6366f1', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  /* ── Shared button styles ── */
  const btnPrimary: React.CSSProperties = {
    background: '#111', color: '#fff', border: 'none',
    borderRadius: 22, padding: '11px 22px',
    fontSize: 13, fontWeight: 800, cursor: 'pointer',
    fontFamily: F, whiteSpace: 'nowrap',
  };
  const btnOutline: React.CSSProperties = {
    background: 'transparent', color: '#374151',
    border: '1.5px solid #e2e8f0',
    borderRadius: 22, padding: '10px 20px',
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
    fontFamily: F, whiteSpace: 'nowrap',
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#ffffff', fontFamily: F, maxWidth: 1200, margin: '0 auto' }}>
      <style>{CSS}</style>

      {/* ── Navbar ── */}
      <nav className="lp-nav" style={{
        background: '#ffffff', borderBottom: '0.5px solid #f1f5f9',
        padding: '18px 52px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Right: logo (first in DOM = right side in RTL flex) */}
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F }}
        >
          <span style={{ fontSize: 17, fontWeight: 900, color: '#111', letterSpacing: '-0.5px' }}>NestAI</span>
        </button>
        {/* Left: auth links (second in DOM = left side in RTL flex) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/app/auth')}
            style={{ background: 'none', border: 'none', fontSize: 13, color: '#888', cursor: 'pointer', fontFamily: F }}
          >
            התחברות
          </button>
          <button
            onClick={() => navigate('/app')}
            style={{ ...btnPrimary, padding: '8px 18px', borderRadius: 20 }}
          >
            {content.nav_cta2_text}
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        {/* Text column (right in RTL grid) */}
        <div className="lp-hero-text" style={{ maxWidth: 480 }}>
          {/* Eyebrow */}
          <p style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', margin: '0 0 4px', letterSpacing: '0.02em' }}>
            {content.hero_eyebrow}
          </p>
          <p style={{ fontSize: 12, fontWeight: 500, color: '#94a3b8', margin: '0 0 18px' }}>
            {content.hero_eyebrow2}
          </p>

          {/* H1 */}
          <h1 style={{
            fontSize: 50, fontWeight: 900, color: '#111',
            lineHeight: 1.05, letterSpacing: '-2.5px',
            margin: '0 0 20px', fontFamily: F,
          }}>
            {content.hero_line1}{' '}
            <span style={{ color: '#6366f1' }}>{content.hero_line2}</span>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 16, color: '#64748b', lineHeight: 1.75,
            maxWidth: 400, margin: '0 0 32px',
          }}>
            {content.hero_subtitle}
          </p>

          {/* CTA buttons */}
          <div className="lp-hero-btns" style={{ marginBottom: 28 }}>
            <button onClick={() => navigate('/app')} style={btnPrimary}>
              {content.hero_cta1}
            </button>
            <button style={btnOutline}>
              איך זה עובד?
            </button>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
            {[content.hero_badge1, content.hero_badge2, content.hero_badge3].map(label => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#94a3b8' }}>
                <span style={{ color: '#10b981', fontWeight: 700 }}>✓</span>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Phone mockup (left in RTL grid) */}
        <div className="lp-mockup-wrap">
          <PhoneMockup />
        </div>
      </section>

      {/* ── Steps section ── */}
      <section className="lp-steps-section" style={{ background: '#f9fafb', padding: '72px 52px' }}>
        {/* Header */}
        <div className="lp-steps-header">
          <h2 style={{ fontSize: 36, fontWeight: 900, color: '#111', letterSpacing: '-1.5px', margin: 0, fontFamily: F }}>
            {content.steps_title}
          </h2>
          <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, margin: 0 }}>
            {content.steps_subtitle}
          </p>
        </div>

        {/* Cards */}
        <div className="lp-steps-grid">
          {[
            { num: '01', title: content.step1_title, body: content.step1_body },
            { num: '02', title: content.step2_title, body: content.step2_body },
            { num: '03', title: content.step3_title, body: content.step3_body },
          ].map(step => (
            <div key={step.num} className="lp-step-card">
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', margin: '0 0 16px', letterSpacing: '0.05em' }}>
                {step.num}
              </p>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '0 0 10px', fontFamily: F }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65, margin: 0 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA section ── */}
      <section className="lp-cta-section" style={{
        margin: '64px 52px',
        background: '#111', borderRadius: 28,
        padding: '64px 52px',
      }}>
        <div className="lp-cta-row">
          {/* Text right */}
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', margin: '0 0 10px', fontFamily: F, letterSpacing: '-1px' }}>
              {content.cta_section_title}
            </h2>
            <p style={{ fontSize: 15, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              {content.cta_section_sub}
            </p>
          </div>
          {/* Button left */}
          <button
            className="lp-cta-btn-full"
            onClick={() => navigate('/app')}
            style={{
              background: '#6366f1', color: '#ffffff', border: 'none',
              borderRadius: 22, padding: '14px 32px',
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              fontFamily: F, whiteSpace: 'nowrap', flexShrink: 0,
            }}
          >
            {content.cta_section_button}
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer" style={{
        padding: '24px 52px',
        borderTop: '0.5px solid #f1f5f9',
      }}>
        <div className="lp-footer-row">
          {/* Links right */}
          <div style={{ display: 'flex', gap: 20 }}>
            {[
              { label: 'תנאי שימוש', href: '#' },
              { label: 'פרטיות', href: '/app/privacy' },
              { label: 'צור קשר', href: '#' },
            ].map(link => (
              <a
                key={link.label}
                href={link.href}
                style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'none' }}
              >
                {link.label}
              </a>
            ))}
          </div>
          {/* Copyright left */}
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            © 2026 NestAI. כל הזכויות שמורות.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
