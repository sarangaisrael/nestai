import { useNavigate } from "react-router-dom";

// ── Shared style tokens (mirrors Auth.tsx) ────────────────────────────────────
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

// ── Steps used on the right panel ─────────────────────────────────────────────
const welcomeSteps = [
  { title: 'נרשמת בהצלחה',    sub: 'החשבון שלך נוצר',     state: 'done'   as const },
  { title: 'אימות האימייל',    sub: 'אומת בהצלחה',          state: 'done'   as const },
  { title: 'כניסה לאפליקציה', sub: 'לחץ/י כדי להתחיל',     state: 'active' as const },
];

const AppleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex' }}>
      <style>{CSS}</style>

      {/* ── LEFT ── */}
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
          {/* Green check icon */}
          <div style={{
            width: 72, height: 72, background: '#d1fae5', borderRadius: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 28, flexShrink: 0,
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 900, color: C.dark, margin: '0 0 10px' }}>
            ברוך הבא 🎉
          </h1>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: '0 0 32px', maxWidth: 300 }}>
            האימייל אומת בהצלחה.<br />המסע הטיפולי שלך מתחיל עכשיו.
          </p>

          {/* Login button */}
          <button
            type="button"
            onClick={() => navigate('/app/auth')}
            style={{
              background: C.purple, color: 'white', border: 'none',
              borderRadius: 12, padding: '13px 0',
              width: '100%', maxWidth: 220,
              fontSize: 15, fontWeight: 800, cursor: 'pointer',
              marginBottom: 28,
            }}
          >
            התחברות
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', maxWidth: 280, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: '#ddd6fe' }} />
            <span style={{ fontSize: 11, color: '#a0aec0', flexShrink: 0, whiteSpace: 'nowrap' }}>זמין גם במובייל</span>
            <div style={{ flex: 1, height: 1, background: '#ddd6fe' }} />
          </div>

          {/* App Store button */}
          <a
            href="https://apps.apple.com/il/app/nestai-care/id6760186559"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: '#111', color: 'white',
              borderRadius: 12, padding: '11px 22px',
              textDecoration: 'none',
              width: '100%', maxWidth: 220, boxSizing: 'border-box',
              justifyContent: 'center',
            }}
          >
            <AppleIcon />
            <div style={{ textAlign: 'right', lineHeight: 1.3 }}>
              <div style={{ fontSize: 10, opacity: 0.75 }}>הורד באמצעות</div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>App Store</div>
            </div>
          </a>
        </div>
      </div>

      {/* ── RIGHT ── */}
      <div
        className="welcome-right"
        style={{
          background: C.purplePan, padding: '40px 48px',
          flexDirection: 'column',
          width: '42%', minWidth: 340,
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
            <div
              key={i}
              style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}
            >
              {/* Indicator */}
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
              {/* Text */}
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
