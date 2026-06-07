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

  /* ── Comparison table ── */
  .lp-comparison-section {
    padding: 72px 52px;
    background: #ffffff;
  }
  .lp-comparison-scroll {
    overflow-x: auto;
  }
  .lp-comparison-table {
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
    min-width: 520px;
  }

  /* ── Testimonials ── */
  .lp-testimonials-section {
    padding: 72px 52px;
    background: #ffffff;
    max-width: 1200px;
    margin: 0 auto;
  }
  .lp-testimonials-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  /* ── Features ── */
  .lp-features-section {
    padding: 72px 52px;
    background: #ffffff;
  }
  .lp-features-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
  }
  .lp-features-screen {
    height: 300px;
  }

  /* ── Pricing ── */
  .lp-pricing-section {
    padding: 72px 52px;
    background: #f9fafb;
  }
  .lp-pricing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    max-width: 680px;
    margin: 0 auto;
  }

  @media (max-width: 768px) {
    .lp-testimonials-section { padding: 52px 24px !important; max-width: 100% !important; }
    .lp-testimonials-grid    { grid-template-columns: 1fr; }
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
    .lp-comparison-section { padding: 52px 24px !important; }
    .lp-features-section   { padding: 52px 24px !important; }
    .lp-features-grid      { grid-template-columns: 1fr; }
    .lp-features-screen    { height: 280px !important; }
    .lp-pricing-section    { padding: 52px 24px !important; }
    .lp-pricing-grid       { grid-template-columns: 1fr; }
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
  // Comparison
  show_comparison: boolean;
  comparison_tag: string;
  comparison_title: string;
  comparison_subtitle: string;
  comparison_row1_feature: string;
  comparison_row1_chatgpt: string;
  comparison_row1_nestai: string;
  comparison_row2_feature: string;
  comparison_row2_chatgpt: string;
  comparison_row2_nestai: string;
  comparison_row3_feature: string;
  comparison_row3_chatgpt: string;
  comparison_row3_nestai: string;
  comparison_row4_feature: string;
  comparison_row4_chatgpt: string;
  comparison_row4_nestai: string;
  comparison_row5_feature: string;
  comparison_row5_chatgpt: string;
  comparison_row5_nestai: string;
  // Pricing
  show_pricing: boolean;
  // Testimonials
  show_testimonials: boolean;
  testimonial_1_quote: string;
  testimonial_1_name: string;
  testimonial_1_role: string;
  testimonial_2_quote: string;
  testimonial_2_name: string;
  testimonial_2_role: string;
  testimonial_3_quote: string;
  testimonial_3_name: string;
  testimonial_3_role: string;
  testimonial_4_quote: string;
  testimonial_4_name: string;
  testimonial_4_role: string;
};

const DEFAULT_CONTENT: LandingContent = {
  nav_cta2_text:      'מתחילים לכתוב בחינם',
  hero_eyebrow:       'מרחב לעיבוד ומעקב של התהליך הטיפולי',
  hero_eyebrow2:      'חינם בתקופת הבטא 🎉',
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
  // Comparison
  show_comparison:          false,
  comparison_tag:           'למה לא פשוט ChatGPT?',
  comparison_title:         'לא כל AI מתאים לתהליך טיפולי',
  comparison_subtitle:      'ההבדל בין כלי כללי לכלי שנבנה בשביל זה',
  comparison_row1_feature:  'זיכרון לאורך זמן',
  comparison_row1_chatgpt:  'מתחיל מאפס בכל שיחה',
  comparison_row1_nestai:   'עוקב לאורך כל התהליך',
  comparison_row2_feature:  'סיכום לפגישה',
  comparison_row2_chatgpt:  'לא קיים',
  comparison_row2_nestai:   'אוטומטי לפני כל מפגש',
  comparison_row3_feature:  'מותאם לטיפול',
  comparison_row3_chatgpt:  'כלי כללי לכל מטרה',
  comparison_row3_nestai:   'נבנה בשביל התהליך הטיפולי',
  comparison_row4_feature:  'פרטיות והצפנה',
  comparison_row4_chatgpt:  'נתונים עשויים לשמש לאימון',
  comparison_row4_nestai:   'מוצפן, לא נשמר לאימון AI',
  comparison_row5_feature:  'מעקב מגמות רגשיות',
  comparison_row5_chatgpt:  'לא קיים',
  comparison_row5_nestai:   'גרפים ותובנות לאורך זמן',
  // Pricing
  show_pricing:        true,
  // Testimonials
  show_testimonials:   false,
  testimonial_1_quote: 'NestAI שינה לי את כל חוויית הטיפול. אני מגיעה לכל פגישה עם ראש מסודר — במקום לנסות לזכור בזמן אמת מה קרה לי השבוע.',
  testimonial_1_name:  'מ. כהן',
  testimonial_1_role:  'בטיפול CBT כבר שנה',
  testimonial_2_quote: 'סוף סוף יש לי מקום לרשום את מה שעובר עליי בין הפגישות. הסיכום השבועי עוזר לי לא לאבד את הניתוחים שלי כשאני כבר בחדר עם המטפלת.',
  testimonial_2_name:  'י. לוי',
  testimonial_2_role:  'בתהליך טיפולי אינטנסיבי',
  testimonial_3_quote: 'המטופלים שמגיעים עם NestAI מגיעים מוכנים יותר. אני רואה הבדל בעומק השיחות — הם לא מבזבזים 10 דקות על מה קרה השבוע אלא צוללים ישר לעומק.',
  testimonial_3_name:  'ד"ר מיכל אברהם',
  testimonial_3_role:  'פסיכולוגית קלינית תל אביב',
  testimonial_4_quote: 'ממליץ על NestAI לכל המטופלים שלי שרוצים להעמיק את התהליך. הכלי הזה יוצר רצף אמיתי בין הפגישות ומאפשר לנו לעבוד ביעילות הרבה יותר גבוהה.',
  testimonial_4_name:  'אורי שפירא MSW',
  testimonial_4_role:  'עובד סוציאלי קליני חיפה',
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
          // Comparison
          show_comparison:          (data as any).show_comparison === true,
          comparison_tag:           pick('comparison_tag',          DEFAULT_CONTENT.comparison_tag),
          comparison_title:         pick('comparison_title',        DEFAULT_CONTENT.comparison_title),
          comparison_subtitle:      pick('comparison_subtitle',     DEFAULT_CONTENT.comparison_subtitle),
          comparison_row1_feature:  pick('comparison_row1_feature', DEFAULT_CONTENT.comparison_row1_feature),
          comparison_row1_chatgpt:  pick('comparison_row1_chatgpt', DEFAULT_CONTENT.comparison_row1_chatgpt),
          comparison_row1_nestai:   pick('comparison_row1_nestai',  DEFAULT_CONTENT.comparison_row1_nestai),
          comparison_row2_feature:  pick('comparison_row2_feature', DEFAULT_CONTENT.comparison_row2_feature),
          comparison_row2_chatgpt:  pick('comparison_row2_chatgpt', DEFAULT_CONTENT.comparison_row2_chatgpt),
          comparison_row2_nestai:   pick('comparison_row2_nestai',  DEFAULT_CONTENT.comparison_row2_nestai),
          comparison_row3_feature:  pick('comparison_row3_feature', DEFAULT_CONTENT.comparison_row3_feature),
          comparison_row3_chatgpt:  pick('comparison_row3_chatgpt', DEFAULT_CONTENT.comparison_row3_chatgpt),
          comparison_row3_nestai:   pick('comparison_row3_nestai',  DEFAULT_CONTENT.comparison_row3_nestai),
          comparison_row4_feature:  pick('comparison_row4_feature', DEFAULT_CONTENT.comparison_row4_feature),
          comparison_row4_chatgpt:  pick('comparison_row4_chatgpt', DEFAULT_CONTENT.comparison_row4_chatgpt),
          comparison_row4_nestai:   pick('comparison_row4_nestai',  DEFAULT_CONTENT.comparison_row4_nestai),
          comparison_row5_feature:  pick('comparison_row5_feature', DEFAULT_CONTENT.comparison_row5_feature),
          comparison_row5_chatgpt:  pick('comparison_row5_chatgpt', DEFAULT_CONTENT.comparison_row5_chatgpt),
          comparison_row5_nestai:   pick('comparison_row5_nestai',  DEFAULT_CONTENT.comparison_row5_nestai),
          // Testimonials — direct column names
          show_pricing:        (data as any).show_pricing !== false,
          show_testimonials:   (data as any).show_testimonials === true,
          testimonial_1_quote: pick('testimonial_1_quote', DEFAULT_CONTENT.testimonial_1_quote),
          testimonial_1_name:  pick('testimonial_1_name',  DEFAULT_CONTENT.testimonial_1_name),
          testimonial_1_role:  pick('testimonial_1_role',  DEFAULT_CONTENT.testimonial_1_role),
          testimonial_2_quote: pick('testimonial_2_quote', DEFAULT_CONTENT.testimonial_2_quote),
          testimonial_2_name:  pick('testimonial_2_name',  DEFAULT_CONTENT.testimonial_2_name),
          testimonial_2_role:  pick('testimonial_2_role',  DEFAULT_CONTENT.testimonial_2_role),
          testimonial_3_quote: pick('testimonial_3_quote', DEFAULT_CONTENT.testimonial_3_quote),
          testimonial_3_name:  pick('testimonial_3_name',  DEFAULT_CONTENT.testimonial_3_name),
          testimonial_3_role:  pick('testimonial_3_role',  DEFAULT_CONTENT.testimonial_3_role),
          testimonial_4_quote: pick('testimonial_4_quote', DEFAULT_CONTENT.testimonial_4_quote),
          testimonial_4_name:  pick('testimonial_4_name',  DEFAULT_CONTENT.testimonial_4_name),
          testimonial_4_role:  pick('testimonial_4_role',  DEFAULT_CONTENT.testimonial_4_role),
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
            onClick={() => navigate('/app/auth')}
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
            <button onClick={() => navigate('/app/auth')} style={btnPrimary}>
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

      {/* ── Features section ── */}
      <section className="lp-features-section">
        <div className="lp-features-grid">

          {/* ── Column 01: Chat ── */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', letterSpacing: '0.15em', margin: '0 0 8px', fontFamily: F }}>01</p>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: '0 0 8px', fontFamily: F }}>
              צ'אט שמבין אותך
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, margin: '0 0 16px', fontFamily: F }}>
              מקשיב, שואל, ועוזר לעבד — בלי לשפוט, בלי להמתין לפגישה.
            </p>
            <div className="lp-features-screen" style={{
              borderRadius: 16, border: '0.5px solid #e2e8f0',
              overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0,
            }}>
              {/* Header */}
              <div style={{
                background: '#0f172a', padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'white', fontFamily: F }}>NestAI</span>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
              </div>
              {/* Chat body */}
              <div style={{
                flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column',
                gap: 7, padding: 12, overflow: 'hidden',
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{
                    background: '#6366f1', color: 'white',
                    borderRadius: '12px 12px 12px 2px',
                    padding: '7px 11px', fontSize: 11, alignSelf: 'flex-start',
                    maxWidth: '82%', fontFamily: F, lineHeight: 1.5,
                  }}>היה לי יום קשה. הרגשתי לא מוערך.</div>
                  <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: F, alignSelf: 'flex-start', paddingRight: 4 }}>14:32</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{
                    background: 'white', color: '#0f172a',
                    border: '0.5px solid #e2e8f0',
                    borderRadius: '12px 12px 2px 12px',
                    padding: '7px 11px', fontSize: 11, alignSelf: 'flex-end',
                    maxWidth: '82%', fontFamily: F, lineHeight: 1.5,
                  }}>מה קרה שגרם לך להרגיש ככה?</div>
                  <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: F, alignSelf: 'flex-end', paddingLeft: 4 }}>14:32</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{
                    background: '#6366f1', color: 'white',
                    borderRadius: '12px 12px 12px 2px',
                    padding: '7px 11px', fontSize: 11, alignSelf: 'flex-start',
                    maxWidth: '82%', fontFamily: F, lineHeight: 1.5,
                  }}>הבוס ביקר אותי בפומבי.</div>
                  <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: F, alignSelf: 'flex-start', paddingRight: 4 }}>14:33</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div style={{
                    background: 'white', color: '#0f172a',
                    border: '0.5px solid #e2e8f0',
                    borderRadius: '12px 12px 2px 12px',
                    padding: '7px 11px', fontSize: 11, alignSelf: 'flex-end',
                    maxWidth: '82%', fontFamily: F, lineHeight: 1.5,
                  }}>שמרתי לסיכום השבועי שלך.</div>
                  <span style={{ fontSize: 9, color: '#94a3b8', fontFamily: F, alignSelf: 'flex-end', paddingLeft: 4 }}>14:33</span>
                </div>
              </div>
              {/* Input row */}
              <div style={{
                background: 'white', borderTop: '0.5px solid #e2e8f0',
                padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              }}>
                <div style={{
                  flex: 1, background: '#f8fafc', border: '0.5px solid #e2e8f0',
                  borderRadius: 20, padding: '6px 12px',
                  fontSize: 10, color: '#94a3b8', fontFamily: F,
                }}>
                  כתוב הודעה...
                </div>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 9V3M6 3L3 6M6 3L9 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ── Column 02: Weekly summary ── */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', letterSpacing: '0.15em', margin: '0 0 8px', fontFamily: F }}>02</p>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: '0 0 8px', fontFamily: F }}>
              סיכום שבועי אוטומטי
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, margin: '0 0 16px', fontFamily: F }}>
              מגיע לפני כל פגישה — מרוכז, מדויק, מוכן.
            </p>
            <div className="lp-features-screen" style={{
              borderRadius: 16, border: '0.5px solid #e2e8f0',
              overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0,
            }}>
              {/* Header */}
              <div style={{ background: '#0f172a', padding: '10px 14px', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'white', fontFamily: F }}>סיכומים שבועיים</span>
              </div>
              {/* Body */}
              <div style={{
                flex: 1, background: 'white', display: 'flex', flexDirection: 'column',
                padding: 12, overflow: 'hidden',
              }}>
                <p style={{ fontSize: 9, color: '#94a3b8', margin: '0 0 5px', fontFamily: F }}>21.5 — 28.5.2026</p>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', fontFamily: F }}>
                  שבוע עם עומס רגשי בעבודה
                </p>
                <p style={{ fontSize: 10, color: '#64748b', lineHeight: 1.6, margin: '0 0 10px', fontFamily: F }}>
                  עלה פעמיים נושא חוסר הכרה. תחושת הערך העצמי נפגעה. ישנה הפחתה ברמת החרדה.
                </p>
                {/* Tags */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                  {['ביקורת בעבודה', 'ערך עצמי', 'חרדה'].map(tag => (
                    <span key={tag} style={{
                      background: '#ede9fe', color: '#6d28d9',
                      fontSize: 9, fontWeight: 700, fontFamily: F,
                      padding: '3px 8px', borderRadius: 50,
                    }}>{tag}</span>
                  ))}
                </div>
                {/* Mood bar */}
                <div style={{
                  background: '#f8fafc', borderRadius: 10, padding: '8px 10px',
                  border: '0.5px solid #e2e8f0', marginTop: 'auto',
                }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#64748b', margin: '0 0 6px', fontFamily: F }}>
                    מד הרגשות השבועי
                  </p>
                  <div style={{ background: '#e2e8f0', borderRadius: 50, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: '62%', height: '100%', background: '#6366f1', borderRadius: 50 }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 8, color: '#94a3b8', fontFamily: F }}>שלילי</span>
                    <span style={{ fontSize: 8, color: '#94a3b8', fontFamily: F }}>חיובי</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Column 03: Monthly trends ── */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#6366f1', letterSpacing: '0.15em', margin: '0 0 8px', fontFamily: F }}>03</p>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: '0 0 8px', fontFamily: F }}>
              מגמות חודשיות
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, margin: '0 0 16px', fontFamily: F }}>
              רואים את ההתקדמות לאורך זמן — ההוכחה שהתהליך עובד.
            </p>
            <div className="lp-features-screen" style={{
              borderRadius: 16, border: '0.5px solid #e2e8f0',
              overflow: 'hidden', display: 'flex', flexDirection: 'column', flexShrink: 0,
            }}>
              {/* Header */}
              <div style={{ background: '#0f172a', padding: '10px 14px', flexShrink: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'white', fontFamily: F }}>סיכום חודשי</span>
              </div>
              {/* Body */}
              <div style={{
                flex: 1, background: 'white', display: 'flex', flexDirection: 'column',
                padding: 12, overflow: 'hidden',
              }}>
                <p style={{ fontSize: 9, color: '#94a3b8', margin: '0 0 5px', fontFamily: F }}>מאי 2026</p>
                <p style={{ fontSize: 12, fontWeight: 800, color: '#0f172a', margin: '0 0 6px', fontFamily: F }}>
                  חודש של שינוי הדרגתי
                </p>
                <p style={{ fontSize: 10, color: '#64748b', lineHeight: 1.6, margin: '0 0 auto', fontFamily: F }}>
                  חרדה ירדה ב-28%. נושא הגבולות עלה 4 פעמים. עלייה ביכולת לזהות רגשות.
                </p>
                {/* Trend bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
                  {([
                    { label: 'חרדה',    pct: 35, color: '#10b981', change: '↓28%' },
                    { label: 'מצב רוח', pct: 72, color: '#6366f1', change: '↑72%' },
                    { label: 'עצמאות',  pct: 58, color: '#f59e0b', change: '↑58%' },
                    { label: 'שינה',    pct: 45, color: '#6366f1', change: '↑45%' },
                  ] as { label: string; pct: number; color: string; change: string }[]).map(({ label, pct, color, change }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 9, color: '#64748b', fontFamily: F }}>{label}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color, fontFamily: F }}>{change}</span>
                      </div>
                      <div style={{ background: '#f1f5f9', borderRadius: 50, height: 5, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 50 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Comparison section ── */}
      {content.show_comparison && (() => {
        const rows: { feature: string; chatgptIcon: '✗' | '—'; chatgptText: string; nestaiText: string }[] = [
          { feature: content.comparison_row1_feature, chatgptIcon: '✗', chatgptText: content.comparison_row1_chatgpt, nestaiText: content.comparison_row1_nestai },
          { feature: content.comparison_row2_feature, chatgptIcon: '✗', chatgptText: content.comparison_row2_chatgpt, nestaiText: content.comparison_row2_nestai },
          { feature: content.comparison_row3_feature, chatgptIcon: '✗', chatgptText: content.comparison_row3_chatgpt, nestaiText: content.comparison_row3_nestai },
          { feature: content.comparison_row4_feature, chatgptIcon: '—', chatgptText: content.comparison_row4_chatgpt, nestaiText: content.comparison_row4_nestai },
          { feature: content.comparison_row5_feature, chatgptIcon: '✗', chatgptText: content.comparison_row5_chatgpt, nestaiText: content.comparison_row5_nestai },
        ];
        return (
          <section className="lp-comparison-section">
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                background: '#fef2f2', color: '#dc2626',
                border: '1px solid #fecaca',
                borderRadius: 50, padding: '4px 14px',
                fontSize: 12, fontWeight: 700,
                marginBottom: 16, fontFamily: F,
              }}>
                {content.comparison_tag}
              </span>
              <h2 style={{
                fontSize: 32, fontWeight: 900, color: '#111',
                margin: '0 0 8px', fontFamily: F, letterSpacing: '-1px',
              }}>
                {content.comparison_title}
              </h2>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: 0, fontFamily: F }}>
                {content.comparison_subtitle}
              </p>
            </div>

            {/* Table */}
            <div className="lp-comparison-scroll">
              <div className="lp-comparison-table">
                {/* Header row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr' }}>
                  <div style={{ padding: '14px 20px', background: '#f8fafc', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: F }}>
                    תכונה
                  </div>
                  <div style={{ padding: '14px 20px', background: '#f8fafc', fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: F }}>
                    ChatGPT
                  </div>
                  <div style={{ padding: '14px 20px', background: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#ffffff', fontFamily: F }}>NestAI</span>
                  </div>
                </div>

                {/* Data rows */}
                {rows.map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ padding: '16px 20px' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontFamily: F }}>{row.feature}</span>
                    </div>
                    <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: row.chatgptIcon === '—' ? '#cbd5e1' : '#ef4444', flexShrink: 0, lineHeight: '1.45' }}>{row.chatgptIcon}</span>
                      <span style={{ fontSize: 13, color: '#6b7280', fontFamily: F, lineHeight: 1.5 }}>{row.chatgptText}</span>
                    </div>
                    <div style={{ padding: '16px 20px', background: '#fafbff', display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981', flexShrink: 0, lineHeight: '1.45' }}>✓</span>
                      <span style={{ fontSize: 13, color: '#374151', fontFamily: F, lineHeight: 1.5 }}>{row.nestaiText}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
              <button
                onClick={() => navigate('/app/auth')}
                style={{
                  background: '#6366f1', color: '#ffffff', border: 'none',
                  borderRadius: 22, padding: '13px 32px',
                  fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  fontFamily: F,
                }}
              >
                מתחילים לכתוב בחינם
              </button>
            </div>
          </section>
        );
      })()}

      {/* ── Testimonials section ── */}
      {content.show_testimonials && (() => {
        const cards = [
          {
            bg: '#faf5ff', accent: '#7c3aed',
            avatarBg: '#ede9fe', avatarColor: '#6d28d9', initials: 'מ.כ',
            quote: content.testimonial_1_quote,
            name: content.testimonial_1_name,
            role: content.testimonial_1_role,
            badge: 'מטופלת',
          },
          {
            bg: '#eff6ff', accent: '#2563eb',
            avatarBg: '#dbeafe', avatarColor: '#1e40af', initials: 'י.ל',
            quote: content.testimonial_2_quote,
            name: content.testimonial_2_name,
            role: content.testimonial_2_role,
            badge: 'מטופל',
          },
          {
            bg: '#f0fdf4', accent: '#059669',
            avatarBg: '#d1fae5', avatarColor: '#065f46', initials: 'ד.מ',
            quote: content.testimonial_3_quote,
            name: content.testimonial_3_name,
            role: content.testimonial_3_role,
            badge: 'מטפלת',
          },
          {
            bg: '#fffbeb', accent: '#d97706',
            avatarBg: '#fef3c7', avatarColor: '#92400e', initials: 'א.ש',
            quote: content.testimonial_4_quote,
            name: content.testimonial_4_name,
            role: content.testimonial_4_role,
            badge: 'מטפל',
          },
        ];
        return (
          <section className="lp-testimonials-section">
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                background: '#dcfce7', color: '#16a34a',
                borderRadius: 50, padding: '4px 14px',
                fontSize: 12, fontWeight: 700,
                marginBottom: 16, fontFamily: F,
              }}>
                מה אומרים עלינו
              </span>
              <h2 style={{
                fontSize: 32, fontWeight: 900, color: '#111',
                margin: '0 0 8px', fontFamily: F, letterSpacing: '-1px',
              }}>
                אנשים שכבר בתהליך
              </h2>
              <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>
                מטופלים ומטפלים שמשתמשים ב-NestAI
              </p>
            </div>

            {/* 2×2 grid */}
            <div className="lp-testimonials-grid">
              {cards.map((card, i) => (
                <div key={i} style={{
                  position: 'relative', overflow: 'hidden',
                  borderRadius: 24, background: card.bg,
                  padding: '28px 28px 24px', boxSizing: 'border-box',
                }}>
                  {/* Accent shape — top-right corner */}
                  <div style={{
                    position: 'absolute', top: 0, right: 0,
                    width: 80, height: 80,
                    borderRadius: '0 24px 0 80px',
                    background: card.accent, opacity: 0.15,
                    pointerEvents: 'none',
                  }} />

                  {/* Large quote mark */}
                  <div style={{
                    fontSize: 56, fontWeight: 900, lineHeight: 1,
                    color: card.accent, opacity: 0.25,
                    marginBottom: 8, fontFamily: F, userSelect: 'none',
                  }}>
                    "
                  </div>

                  {/* Quote text */}
                  <p style={{
                    fontSize: 14, color: '#374151', lineHeight: 1.8,
                    margin: '0 0 20px', position: 'relative', fontFamily: F,
                  }}>
                    {card.quote}
                  </p>

                  {/* Thin divider */}
                  <div style={{
                    borderTop: `0.5px solid ${card.accent}`,
                    opacity: 0.3, marginBottom: 16,
                  }} />

                  {/* Author row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Square avatar with initials */}
                    <div style={{
                      width: 40, height: 40, borderRadius: 14, flexShrink: 0,
                      background: card.avatarBg, color: card.avatarColor,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 800, fontFamily: F,
                    }}>
                      {card.initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: 0, fontFamily: F }}>
                        {card.name}
                      </p>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0, fontFamily: F }}>
                        {card.role}
                      </p>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: card.accent,
                      border: `1px solid ${card.accent}`,
                      borderRadius: 50, padding: '2px 10px',
                      opacity: 0.85, flexShrink: 0, fontFamily: F,
                    }}>
                      {card.badge}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })()}

      {/* ── Pricing section ── */}
      {content.show_pricing && (() => {
        const features = [
          'גישה מלאה לכל הפיצ\'רים',
          'תיעוד יומי ללא הגבלה',
          'סיכום שבועי אוטומטי',
          'מעקב מגמות רגשיות',
          'צ\'אט AI בין הפגישות',
        ];
        const CheckCircle = () => (
          <div style={{
            width: 20, height: 20, background: '#ede9fe', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6L5 9L10 3" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        );
        const WaSvg = () => (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884zm8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
        );
        const waBtn: React.CSSProperties = {
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          background: '#25D366', color: 'white', border: 'none',
          borderRadius: 10, padding: '12px 0', width: '100%',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
          textDecoration: 'none', fontFamily: F,
        };
        return (
          <section className="lp-pricing-section">
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                background: '#ede9fe', color: '#6d28d9',
                border: '1px solid #c4b5fd',
                borderRadius: 50, padding: '4px 14px',
                fontSize: 12, fontWeight: 700,
                marginBottom: 16, fontFamily: F,
              }}>
                תמחור
              </span>
              <h2 style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', margin: '0 0 8px', fontFamily: F, letterSpacing: '-1px' }}>
                פשוט. שקוף. משתלם.
              </h2>
              <p style={{ fontSize: 14, color: '#64748b', margin: 0, fontFamily: F }}>
                כל הפיצ׳רים בשתי התוכניות — ההבדל הוא רק משך הגישה.
              </p>
            </div>

            {/* 2-card grid */}
            <div className="lp-pricing-grid">
              {/* Card 1 — quarterly */}
              <div style={{
                border: '1.5px solid #e2e8f0', borderRadius: 22, background: 'white',
                padding: 30, display: 'flex', flexDirection: 'column', gap: 20,
              }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', margin: '0 0 10px', fontFamily: F }}>תוכנית רבעונית</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
                    <span style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', fontFamily: F, lineHeight: 1 }}>₪20</span>
                    <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: F }}>ל-3 חודשים</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#6366f1', margin: 0, fontFamily: F }}>כ-6.6 ש״ח בחודש</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle />
                      <span style={{ fontSize: 13, color: '#374151', fontFamily: F }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a
                    href="https://wa.me/9720537000277?text=היי, אני מעוניין/ת בתוכנית הרבעונית של NestAI (₪20 ל-3 חודשים)"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={waBtn}
                  >
                    <WaSvg />
                    צרו קשר בוואטסאפ
                  </a>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, textAlign: 'center', fontFamily: F }}>
                    נחזור אליכם תוך 24 שעות
                  </p>
                </div>
              </div>

              {/* Card 2 — yearly (featured) */}
              <div style={{
                border: '2px solid #6366f1', borderRadius: 22, background: 'white',
                padding: 30, display: 'flex', flexDirection: 'column', gap: 20,
                position: 'relative', overflow: 'hidden',
              }}>
                {/* "הכי משתלם" badge */}
                <div style={{
                  position: 'absolute', top: 0, right: 0,
                  background: '#6366f1', color: 'white',
                  fontSize: 10, fontWeight: 800,
                  padding: '5px 14px',
                  borderRadius: '0 0 0 12px',
                  fontFamily: F,
                }}>
                  הכי משתלם
                </div>
                <div style={{ paddingTop: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8', margin: '0 0 10px', fontFamily: F }}>תוכנית שנתית</p>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 2 }}>
                    <span style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', fontFamily: F, lineHeight: 1 }}>₪45</span>
                    <span style={{ fontSize: 13, color: '#94a3b8', fontFamily: F }}>לשנה</span>
                  </div>
                  <p style={{ fontSize: 11, color: '#6366f1', margin: 0, fontFamily: F }}>פחות מ-4 ש״ח בחודש</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <CheckCircle />
                      <span style={{ fontSize: 13, color: '#374151', fontFamily: F }}>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a
                    href="https://wa.me/9720537000277?text=היי, אני מעוניין/ת בתוכנית השנתית של NestAI (₪45 לשנה)"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={waBtn}
                  >
                    <WaSvg />
                    צרו קשר בוואטסאפ
                  </a>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, textAlign: 'center', fontFamily: F }}>
                    נחזור אליכם תוך 24 שעות
                  </p>
                </div>
              </div>
            </div>

            {/* Footer note */}
            <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', margin: '32px 0 0', lineHeight: 1.8, fontFamily: F }}>
              המחירים ייכנסו לתוקף בקרוב.<br />
              משתמשים קיימים יקבלו הודעה מראש.
            </p>
          </section>
        );
      })()}

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
            onClick={() => navigate('/app/auth')}
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
