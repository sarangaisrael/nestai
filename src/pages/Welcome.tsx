import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePWAInstallPrompt } from "@/contexts/PWAInstallContext";

// ── Shared style tokens ───────────────────────────────────────────────────────
const C = {
  purple:    '#534AB7',
  purplePan: '#4C44B8',
  bg:        '#F7F5FF',
  border:    '#AFA9EC',
  muted:     '#7F77DD',
  dark:      '#1a1a2e',
  indigo:    '#a5b4fc',
};

const CSS = `
  .welcome-right { display: flex !important; }
  @media (max-width: 768px) {
    .welcome-right { display: none !important; }
    .welcome-left  { padding: 24px !important; }
  }
`;

// ── Right-panel steps ─────────────────────────────────────────────────────────
const welcomeSteps = [
  { title: 'נרשמת בהצלחה',  sub: 'החשבון שלך נוצר',         state: 'done'   as const },
  { title: 'אימות האימייל',  sub: 'אומת בהצלחה',              state: 'done'   as const },
  { title: 'התאמה אישית',    sub: 'עוד שנייה ואתם בפנים',     state: 'active' as const },
];

// ── Store icons ───────────────────────────────────────────────────────────────
const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const AndroidIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zm-2.5-1C2.67 17 2 17.67 2 18.5v5c0 .83.67 1.5 1.5 1.5S5 24.33 5 23.5v-5C5 17.67 4.33 17 3.5 17zm17 0c-.83 0-1.5.67-1.5 1.5v5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5c0-.83-.67-1.5-1.5-1.5zm-4.97-14.58l1.06-1.06c.19-.19.19-.51 0-.7-.19-.19-.51-.19-.7 0l-1.2 1.2C13.96 1.3 13.02 1 12 1c-1.03 0-1.96.3-2.74.87L8.07.66c-.19-.19-.51-.19-.7 0-.19.19-.19.51 0 .7l1.06 1.06C7.62 3.29 7 4.57 7 6h10c0-1.43-.62-2.71-1.47-3.58zM10 4H9V3h1v1zm5 0h-1V3h1v1z"/>
  </svg>
);

// ── Answer option type ────────────────────────────────────────────────────────
type TraumaAnswer = 'yes' | 'no' | 'skip' | null;

const OPTIONS: { value: TraumaAnswer; label: string }[] = [
  { value: 'yes',  label: 'כן' },
  { value: 'no',   label: 'לא' },
  { value: 'skip', label: 'מעדיף/ה לא לציין' },
];

// ─────────────────────────────────────────────────────────────────────────────
const Welcome = () => {
  const navigate = useNavigate();
  const [answer,  setAnswer]  = useState<TraumaAnswer>(null);
  const [saving,  setSaving]  = useState(false);
  const { triggerInstall } = usePWAInstallPrompt();

  const handleContinue = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const hasTrauma = answer === 'yes' ? true : answer === 'no' ? false : null;
        await supabase.from("user_preferences").upsert(
          { user_id: session.user.id, has_trauma: hasTrauma },
          { onConflict: 'user_id' }
        );
      }
    } catch (err) {
      console.error("[Welcome] save error:", err);
      // Navigate regardless — don't block the user
    } finally {
      navigate("/app/dashboard", { replace: true });
    }
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex' }}>
      <style>{CSS}</style>

      {/* ── LEFT — question panel ── */}
      <div
        className="welcome-left"
        style={{
          flex: 1, background: C.bg,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '40px 48px', overflowY: 'auto',
        }}
      >
        <div style={{
          maxWidth: 400, width: '100%', margin: '0 auto',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        }}>
          {/* Icon */}
          <div style={{
            width: 64, height: 64, background: '#d1fae5', borderRadius: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 20, flexShrink: 0,
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 900, color: C.dark, margin: '0 0 6px' }}>
            עוד שאלה אחת
          </h1>
          <p style={{ fontSize: 12, color: C.muted, margin: '0 0 24px', lineHeight: 1.6 }}>
            כדי להתאים לך את החוויה בצורה הטובה ביותר
          </p>

          {/* Question box */}
          <div style={{
            width: '100%', background: 'white',
            border: `1px solid ${C.border}`, borderRadius: 14,
            padding: 16, marginBottom: 20, textAlign: 'right',
          }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.dark, margin: '0 0 14px', lineHeight: 1.5 }}>
              האם את/ה מתמודד/ת עם פוסט טראומה?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAnswer(opt.value)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
                    textAlign: 'right', width: '100%',
                    background: answer === opt.value ? '#ede9fe' : '#f8fafc',
                    border: answer === opt.value ? '1.5px solid #6366f1' : '1.5px solid transparent',
                    transition: 'all 0.12s',
                  }}
                >
                  {/* Radio circle */}
                  <span style={{
                    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                    border: answer === opt.value ? '5px solid #6366f1' : `2px solid ${C.border}`,
                    display: 'inline-block', background: 'white',
                    transition: 'border 0.12s',
                  }} />
                  <span style={{
                    fontSize: 13, fontWeight: answer === opt.value ? 700 : 500,
                    color: answer === opt.value ? '#4f46e5' : '#334155',
                  }}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Continue button */}
          <button
            type="button"
            onClick={handleContinue}
            disabled={saving}
            style={{
              width: '100%', background: saving ? '#a5b4fc' : C.purple,
              color: 'white', border: 'none', borderRadius: 12,
              padding: '13px 0', fontSize: 15, fontWeight: 800,
              cursor: saving ? 'not-allowed' : 'pointer',
              marginBottom: 24, transition: 'background 0.15s',
            }}
          >
            {saving ? 'שומר...' : 'המשך לאפליקציה'}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 320, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: '#ddd6fe' }} />
            <span style={{ fontSize: 11, color: '#a0aec0', flexShrink: 0, whiteSpace: 'nowrap' }}>זמין גם במובייל</span>
            <div style={{ flex: 1, height: 1, background: '#ddd6fe' }} />
          </div>

          {/* Store buttons */}
          <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 340 }}>
            <a
              href="https://apps.apple.com/il/app/nestai-care/id6760186559"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                background: '#111', color: 'white', borderRadius: 12,
                padding: '10px 14px', textDecoration: 'none', justifyContent: 'center',
                boxSizing: 'border-box',
              }}
            >
              <AppleIcon />
              <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
                <div style={{ fontSize: 9, opacity: 0.75 }}>הורד באמצעות</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>App Store</div>
              </div>
            </a>
            <button
              type="button"
              onClick={triggerInstall}
              style={{
                flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                background: '#111', color: 'white', borderRadius: 12,
                padding: '10px 14px', border: 'none', cursor: 'pointer',
                justifyContent: 'center', boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
            >
              <AndroidIcon />
              <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
                <div style={{ fontSize: 9, opacity: 0.75 }}>הורד באמצעות</div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Android (PWA)</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT — purple panel ── */}
      <div
        className="welcome-right"
        style={{
          background: C.purplePan, padding: '40px 48px',
          flexDirection: 'column', width: '42%', minWidth: 340,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 56 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.indigo, display: 'inline-block' }} />
          <span style={{ fontSize: 15, fontWeight: 900, color: 'white', letterSpacing: '-0.3px' }}>NestAI</span>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {welcomeSteps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: step.state === 'done' ? '#6366f1' : 'transparent',
                border: step.state === 'done' ? 'none' : '1.5px solid rgba(255,255,255,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {step.state === 'done' ? (
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'white' }}>0{i + 1}</span>
                )}
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: '0 0 3px' }}>{step.title}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5 }}>{step.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Welcome;
