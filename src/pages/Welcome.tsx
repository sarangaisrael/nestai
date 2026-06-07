import { useEffect } from "react";
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
  @keyframes welcome-spin     { to { transform: rotate(360deg); } }
  @keyframes welcome-progress { from { width: 0%; } to { width: 100%; } }
  .welcome-right { display: flex !important; }
  @media (max-width: 768px) {
    .welcome-right { display: none !important; }
    .welcome-left  { padding: 24px !important; }
  }
`;

// ── Steps used on the right panel ─────────────────────────────────────────────
const welcomeSteps = [
  { title: 'נרשמת בהצלחה',    sub: 'החשבון שלך נוצר',    state: 'done'   as const },
  { title: 'אימות האימייל',    sub: 'האימייל אומת',        state: 'done'   as const },
  { title: 'כניסה לאפליקציה', sub: 'המסע מתחיל',           state: 'active' as const },
];

// ─────────────────────────────────────────────────────────────────────────────
const Welcome = () => {
  const navigate = useNavigate();

  // Auto-redirect after 4 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/app/dashboard", { replace: true });
    }, 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

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
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, margin: '0 0 36px', maxWidth: 300 }}>
            האימייל אומת בהצלחה.<br />המסע הטיפולי שלך מתחיל עכשיו.
          </p>

          {/* Progress bar */}
          <div style={{ width: '100%', maxWidth: 320 }}>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 10px', textAlign: 'center' }}>
              עוברים לאפליקציה...
            </p>
            <div style={{
              background: '#e0e7ff', borderRadius: 50, height: 6, overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', background: '#6366f1', borderRadius: 50,
                animation: 'welcome-progress 4s linear forwards',
              }} />
            </div>
          </div>
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
