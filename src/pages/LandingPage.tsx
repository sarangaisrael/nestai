import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDefaultRouteForUser } from "@/lib/userRoles";
import { Capacitor } from "@capacitor/core";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";

const DEFAULTS = {
  nav_logo: 'NestAI', nav_cta1_text: 'למטפלים', nav_cta2_text: 'התחל בחינם',
  hero_line1: 'הרצף הטיפולי', hero_line2: 'מתחיל כאן',
  hero_subtitle: 'NestAI מאפשרת למטופלים לתעד את היומיום שלהם בין הפגישות — ולמטפל לקבל סיכום מוכן לפני כל מפגש.',
  hero_cta1: 'התחל בחינם ←', hero_cta2: 'למטפלים',
  hero_badge1: 'ללא הרשמה ארוכה', hero_badge2: 'פרטיות מלאה', hero_badge3: 'חינם לניסיון',
  slide1_title: 'לא תישאר לבד עם המחשבות',
  slide1_subtitle: 'האפליקציה מלווה אותך בין הפגישות — בשיחה טבעית, בלי לחץ.',
  slide1_bullet1: 'תיעוד יומי טבעי', slide1_bullet2: 'אין משימות ואין לחץ', slide1_bullet3: 'הכל שמור ומוגן',
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

const LandingPage = () => {
  const navigate = useNavigate();
  const [content, setContent] = useState(DEFAULTS);
  const [slide, setSlide] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Inject Heebo font
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700;800;900&display=swap';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Auth redirects + content fetch
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;

    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // Native Capacitor app — never show the landing page
      if (Capacitor.isNativePlatform()) {
        if (session) {
          const target = await getDefaultRouteForUser(session.user.id);
          navigate(target, { replace: true });
        } else {
          navigate("/app/chat", { replace: true });
        }
        return;
      }

      // PWA installed to home screen — redirect out of landing page
      if (isStandalone) {
        navigate(session ? "/app/dashboard" : "/app", { replace: true });
        return;
      }

      // In the browser, redirect authenticated users straight to their default route
      if (session) {
        const target = await getDefaultRouteForUser(session.user.id);
        navigate(target, { replace: true });
        return;
      }

      // Unauthenticated browser visitor — check for password-reset hash
      const hash = window.location.hash;
      if (hash) {
        const hashParams = new URLSearchParams(hash.substring(1));
        if (hashParams.get("type") === "recovery") {
          navigate(`/app/auth${hash}`, { replace: true });
          return;
        }
      }

      // Fetch landing content from Supabase
      try {
        const { data, error } = await supabase
          .from('landing_content')
          .select('*')
          .eq('id', 1)
          .single();

        if (!error && data) {
          setContent({ ...DEFAULTS, ...data });
        }
      } catch {
        // fall through to defaults
      }

      setIsLoading(false);
    };

    init();
  }, [navigate]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F8F8F6',
          fontFamily: "'Heebo', sans-serif",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '3px solid #D1FAE5',
            borderTopColor: '#10B981',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const slides = [
    {
      title: content.slide1_title,
      subtitle: content.slide1_subtitle,
      bullets: [content.slide1_bullet1, content.slide1_bullet2, content.slide1_bullet3],
      mockup: 'chat' as const,
    },
    {
      title: content.slide3_title,
      subtitle: content.slide3_subtitle,
      bullets: [content.slide3_bullet1, content.slide3_bullet2, content.slide3_bullet3],
      mockup: 'timeline' as const,
    },
  ];

  const currentSlide = slides[slide];

  const ChatMockup = () => (
    <div
      style={{
        borderRadius: 20,
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        maxWidth: 340,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#10B981',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10B981',
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          N
        </div>
        <div>
          <div style={{ color: '#FFFFFF', fontSize: 13, fontWeight: 600 }}>NestAI</div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }}>המרחב שלך</div>
        </div>
      </div>
      {/* Chat body */}
      <div
        style={{
          background: '#F9FAFB',
          padding: '12px',
          minHeight: 200,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {/* AI bubble — right aligned in RTL (mr-auto = logical start) */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px 12px 4px 12px',
              padding: '8px 12px',
              fontSize: 12,
              color: '#374151',
              maxWidth: '85%',
            }}
          >
            איך היה היום? 🌿
          </div>
        </div>
        {/* User bubble */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div
            style={{
              background: '#10B981',
              color: '#FFFFFF',
              borderRadius: '12px 12px 12px 4px',
              padding: '8px 12px',
              fontSize: 12,
              maxWidth: '85%',
            }}
          >
            הרגשתי לחוץ בעבודה
          </div>
        </div>
        {/* AI bubble */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px 12px 4px 12px',
              padding: '8px 12px',
              fontSize: 12,
              color: '#374151',
              maxWidth: '85%',
            }}
          >
            מובן. ספר לי יותר — מה גרם ללחץ?
          </div>
        </div>
        {/* User bubble */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div
            style={{
              background: '#10B981',
              color: '#FFFFFF',
              borderRadius: '12px 12px 12px 4px',
              padding: '8px 12px',
              fontSize: 12,
              maxWidth: '85%',
            }}
          >
            פגישה קשה עם המנהל
          </div>
        </div>
        {/* AI bubble */}
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px 12px 4px 12px',
              padding: '8px 12px',
              fontSize: 12,
              color: '#374151',
              maxWidth: '85%',
            }}
          >
            ✓ שמרתי. נדבר על זה בפגישה הבאה 📝
          </div>
        </div>
      </div>
      {/* Summary badge */}
      <div
        style={{
          background: '#D1FAE5',
          color: '#10B981',
          padding: '6px 12px',
          fontSize: 11,
          fontWeight: 600,
          textAlign: 'center',
        }}
      >
        ✓ סיכום נשלח למטפל
      </div>
    </div>
  );

  const SummaryMockup = () => (
    <div
      style={{
        borderRadius: 20,
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        maxWidth: 340,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div style={{ background: '#D1FAE5', padding: '12px 16px' }}>
        <div style={{ color: '#10B981', fontWeight: 700, fontSize: 13 }}>📋 סיכום שבועי</div>
        <div style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>שבוע 28 אפריל–4 מאי</div>
      </div>
      {/* Body */}
      <div style={{ background: '#FFFFFF', padding: '12px 16px' }}>
        {/* Mood section */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 12, color: '#374151', fontWeight: 600, marginBottom: 6 }}>מצב רוח כללי</div>
          <div
            style={{
              background: '#D1FAE5',
              width: '100%',
              height: 8,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: '#10B981',
                width: '72%',
                height: '100%',
              }}
            />
          </div>
        </div>
        {/* Insight rows */}
        {[
          { label: 'ימים מתועדים', value: '5/7' },
          { label: 'דירוג ממוצע', value: '4.1/5' },
          { label: 'נושאים עיקריים', value: 'עבודה, קשרים' },
        ].map((row, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#374151',
              padding: '4px 0',
              borderBottom: '0.5px solid #F3F4F6',
            }}
          >
            <span>{row.label}</span>
            <span style={{ fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
        {/* Therapist note */}
        <div
          style={{
            background: '#F9FAFB',
            borderRadius: 8,
            padding: 8,
            fontSize: 11,
            color: '#6B7280',
            border: '1px solid #E5E7EB',
            marginTop: 10,
          }}
        >
          🩺 טרום-פגישה: המטופל דיווח על לחץ בעבודה וקושי בשינה.
        </div>
      </div>
    </div>
  );

  const TimelineMockup = () => (
    <div
      style={{
        borderRadius: 20,
        background: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        maxWidth: 340,
        margin: '0 auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#F9FAFB',
          padding: '12px 16px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 13, color: '#1A1A2E' }}>📅 ציר הזמן</div>
      </div>
      {/* Body */}
      <div style={{ padding: '12px 16px' }}>
        {[
          { date: "יום ב' 29/4", title: 'פגישה עם ד"ר כהן', tag: 'פגישה', tagBg: '#D1FAE5', tagColor: '#10B981' },
          { date: "יום ג' 30/4", title: 'תיעדתי: לחץ בעבודה', tag: 'תיעוד', tagBg: '#D1FAE5', tagColor: '#10B981' },
          { date: "יום ד' 1/5", title: 'ניהלתי שיחה קשה', tag: 'תיעוד', tagBg: '#D1FAE5', tagColor: '#10B981' },
          { date: "יום ה' 2/5", title: 'הרגשתי טוב יותר', tag: 'תיעוד', tagBg: '#D1FAE5', tagColor: '#10B981' },
          { date: "יום ו' 3/5", title: 'פגישה עם ד"ר כהן', tag: 'פגישה', tagBg: '#ECFDF5', tagColor: '#059669' },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              marginBottom: i < 4 ? 16 : 0,
              borderRight: '2px solid #D1FAE5',
              paddingRight: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, whiteSpace: 'nowrap', marginBottom: 2 }}>
                {item.date}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#1A1A2E', marginBottom: 4 }}>
                {item.title}
              </div>
              <span
                style={{
                  background: item.tagBg,
                  color: item.tagColor,
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 50,
                  display: 'inline-block',
                }}
              >
                {item.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div dir="rtl" style={{ fontFamily: "'Heebo', sans-serif", minHeight: '100vh', background: '#F8F8F6' }}>

      {/* ── Navbar ── */}
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: '#FFFFFF',
          boxShadow: '0 1px 0 rgba(0,0,0,0.06)',
          height: 64,
        }}
      >
        <div
          style={{
            maxWidth: '64rem',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            height: '100%',
          }}
        >
          {/* Logo */}
          <span style={{ color: '#1A1A2E', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
            Nest<span style={{ color: '#10B981' }}>AI</span>
          </span>

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => navigate('/for-therapists')}
              style={{
                border: '1.5px solid #10B981',
                color: '#10B981',
                background: 'transparent',
                borderRadius: 50,
                padding: '8px 18px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Heebo', sans-serif",
              }}
            >
              {content.nav_cta1_text}
            </button>
            <button
              onClick={() => navigate('/app')}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                borderRadius: 50,
                border: 'none',
                padding: '9px 18px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: "'Heebo', sans-serif",
              }}
            >
              {content.nav_cta2_text}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          paddingTop: 120,
          paddingBottom: 80,
          paddingLeft: 24,
          paddingRight: 24,
          textAlign: 'center',
          background: '#F8F8F6',
        }}
      >
        <h1 style={{ margin: 0 }}>
          <span
            style={{
              display: 'block',
              fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
              fontWeight: 800,
              color: '#1A1A2E',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: 0,
            }}
          >
            {content.hero_line1}
          </span>
          <span
            style={{
              display: 'block',
              fontSize: 'clamp(2.8rem, 6vw, 4.5rem)',
              fontWeight: 800,
              color: '#10B981',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginTop: 4,
            }}
          >
            {content.hero_line2}
          </span>
        </h1>

        <p
          style={{
            maxWidth: 560,
            margin: '24px auto 0',
            fontSize: '1.1rem',
            color: '#6B7280',
            lineHeight: 1.7,
          }}
        >
          {content.hero_subtitle}
        </p>

        {/* CTA Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 12,
            marginTop: 36,
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => navigate('/app')}
            style={{
              background: '#10B981',
              color: '#FFFFFF',
              borderRadius: 50,
              border: 'none',
              padding: '14px 28px',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.2s',
              fontFamily: "'Heebo', sans-serif",
            }}
          >
            {content.hero_cta1}
          </button>
          <button
            onClick={() => navigate('/for-therapists')}
            style={{
              border: '1.5px solid #10B981',
              color: '#10B981',
              background: 'transparent',
              borderRadius: 50,
              padding: '13px 24px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: "'Heebo', sans-serif",
            }}
          >
            {content.hero_cta2}
          </button>
        </div>

        {/* Badge Row */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 24,
            marginTop: 28,
            flexWrap: 'wrap',
          }}
        >
          {[content.hero_badge1, content.hero_badge2, content.hero_badge3].map((badge, i) => (
            <span key={i} style={{ fontSize: 13, color: '#6B7280', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Check size={14} style={{ color: '#10B981' }} />
              {badge}
            </span>
          ))}
        </div>
      </section>

      {/* ── Slider ── */}
      <section
        style={{
          paddingTop: 80,
          paddingBottom: 80,
          paddingLeft: 24,
          paddingRight: 24,
          background: '#FFFFFF',
        }}
      >
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <h2
            style={{
              textAlign: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1A1A2E',
              marginBottom: 48,
            }}
          >
            איך זה עובד
          </h2>

          {/* Slider wrapper */}
          <div style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ transition: 'opacity 0.3s ease', opacity: 1 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                {/* Text column */}
                <div>
                  <span
                    style={{
                      background: '#D1FAE5',
                      color: '#10B981',
                      borderRadius: 50,
                      padding: '4px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'inline-block',
                      marginBottom: 16,
                    }}
                  >
                    שלב {slide + 1} / 2
                  </span>
                  <h3
                    style={{
                      fontSize: 'clamp(1.6rem, 3vw, 2rem)',
                      fontWeight: 800,
                      color: '#1A1A2E',
                      marginBottom: 12,
                      lineHeight: 1.2,
                    }}
                  >
                    {currentSlide.title}
                  </h3>
                  <p style={{ fontSize: '1rem', color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
                    {currentSlide.subtitle}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {currentSlide.bullets.map((bullet, i) => (
                      <li
                        key={i}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 8,
                          marginBottom: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            background: '#10B981',
                            borderRadius: '50%',
                            marginTop: 7,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ fontSize: 15, color: '#374151', fontWeight: 500 }}>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Mockup column */}
                <div>
                  {currentSlide.mockup === 'chat' && <ChatMockup />}
                  {currentSlide.mockup === 'summary' && <SummaryMockup />}
                  {currentSlide.mockup === 'timeline' && <TimelineMockup />}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 16,
              marginTop: 32,
            }}
          >
            {/* Prev (RTL = ChevronRight) */}
            <button
              onClick={() => setSlide(s => Math.max(0, s - 1))}
              disabled={slide === 0}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1.5px solid #E5E7EB',
                background: '#FFFFFF',
                cursor: slide === 0 ? 'default' : 'pointer',
                opacity: slide === 0 ? 0.4 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={18} color="#374151" />
            </button>

            {/* Dots */}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {[0, 1].map(i => (
                <button
                  key={i}
                  onClick={() => setSlide(i)}
                  style={{
                    width: i === slide ? 24 : 8,
                    height: 8,
                    borderRadius: i === slide ? 4 : '50%',
                    background: i === slide ? '#10B981' : '#E5E7EB',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    transition: 'all 0.2s ease',
                  }}
                />
              ))}
            </div>

            {/* Next (RTL = ChevronLeft) */}
            <button
              onClick={() => setSlide(s => Math.min(1, s + 1))}
              disabled={slide === 1}
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                border: '1.5px solid #E5E7EB',
                background: '#FFFFFF',
                cursor: slide === 1 ? 'default' : 'pointer',
                opacity: slide === 1 ? 0.4 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={18} color="#374151" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Tools Section ── */}
      <section
        style={{
          background: '#F8F8F6',
          paddingTop: 80,
          paddingBottom: 80,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <div style={{ maxWidth: '64rem', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2
              style={{
                fontSize: 'clamp(1.6rem, 3vw, 2rem)',
                fontWeight: 800,
                color: '#1A1A2E',
                marginBottom: 12,
              }}
            >
              {content.tools_title}
            </h2>
            <p style={{ fontSize: '1rem', color: '#6B7280', lineHeight: 1.7 }}>
              {content.tools_subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: content.tool1_icon, title: content.tool1_title, text: content.tool1_text },
              { icon: content.tool2_icon, title: content.tool2_title, text: content.tool2_text },
              { icon: content.tool3_icon, title: content.tool3_title, text: content.tool3_text },
            ].map((tool, i) => (
              <div
                key={i}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 16,
                  padding: 28,
                  border: '1px solid #E5E7EB',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)';
                }}
              >
                {/* Icon circle */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: '50%',
                    background: '#D1FAE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.4rem',
                    marginBottom: 20,
                    flexShrink: 0,
                  }}
                >
                  {tool.icon}
                </div>
                <h3
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#1A1A2E',
                    marginBottom: 10,
                  }}
                >
                  {tool.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: '#6B7280',
                    lineHeight: 1.75,
                    margin: 0,
                    flexGrow: 1,
                  }}
                >
                  {tool.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Audience Cards ── */}
      <section
        style={{
          background: '#F8F8F6',
          paddingTop: 80,
          paddingBottom: 80,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <h2
          style={{
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1A1A2E',
            marginBottom: 40,
          }}
        >
          בחר את הנתיב שלך
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Card 1 — Therapist */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: 32,
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>🧠</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1A1A2E', marginBottom: 12 }}>
              {content.card1_title}
            </h3>
            <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
              {content.card1_body}
            </p>
            <button
              onClick={() => navigate('/for-therapists')}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                borderRadius: 50,
                border: 'none',
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                fontFamily: "'Heebo', sans-serif",
              }}
            >
              {content.card1_cta}
            </button>
          </div>

          {/* Card 2 — Patient */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: 32,
              border: '1px solid #E5E7EB',
              borderTop: '3px solid #10B981',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>💬</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1A1A2E', marginBottom: 12 }}>
              {content.card2_title}
            </h3>
            <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
              {content.card2_body}
            </p>
            <button
              onClick={() => navigate('/app')}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                borderRadius: 50,
                border: 'none',
                padding: '12px 24px',
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                width: '100%',
                fontFamily: "'Heebo', sans-serif",
              }}
            >
              {content.card2_cta}
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          background: '#FFFFFF',
          borderTop: '1px solid #E5E7EB',
          paddingTop: 32,
          paddingBottom: 32,
          paddingLeft: 24,
          paddingRight: 24,
        }}
      >
        <div
          style={{
            maxWidth: '64rem',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          {/* Links (left side in RTL layout = logical end) */}
          <div style={{ display: 'flex', gap: 20 }}>
            <Link
              to="/app/privacy"
              style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}
            >
              מדיניות פרטיות
            </Link>
            <a href="#" style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>
              תנאי שימוש
            </a>
            <a href="#" style={{ fontSize: 13, color: '#9CA3AF', textDecoration: 'none' }}>
              צור קשר
            </a>
          </div>

          {/* Copyright (right side in RTL layout = logical start) */}
          <span style={{ fontSize: 13, color: '#9CA3AF' }}>
            {content.footer_text}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
