import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

// ── Shared style tokens ───────────────────────────────────────────────────────
const F = "inherit";
const C = {
  purple:    '#534AB7',
  purplePan: '#4C44B8',
  bg:        '#F7F5FF',
  border:    '#AFA9EC',
  muted:     '#7F77DD',
  dark:      '#1a1a2e',
  indigo:    '#a5b4fc',
};
const inputStyle: React.CSSProperties = {
  width: '100%', background: 'white', border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#111',
  outline: 'none', boxSizing: 'border-box', fontFamily: F,
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: C.purple,
  display: 'block', marginBottom: 4,
};
const primaryBtn = (loading?: boolean): React.CSSProperties => ({
  background: C.purple, color: 'white', border: 'none',
  borderRadius: 10, padding: '12px 0', width: '100%',
  fontSize: 14, fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer',
  opacity: loading ? 0.65 : 1, fontFamily: F, marginTop: 4,
});

const CSS = `
  @keyframes rp-spin { to { transform: rotate(360deg); } }
  .rp-right { display: flex !important; }
  @media (max-width: 768px) {
    .rp-right { display: none !important; }
    .rp-left  { padding: 24px !important; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
type PageState = 'checking' | 'ready' | 'error' | 'done';

const ResetPassword = () => {
  const navigate = useNavigate();

  const [pageState,       setPageState]       = useState<PageState>('checking');
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading,         setLoading]         = useState(false);
  const [errorMsg,        setErrorMsg]        = useState<string | null>(null);
  const [hashError,       setHashError]       = useState<string | null>(null);

  // ── On mount: let Supabase SDK process the URL hash tokens ────────────────
  useEffect(() => {
    // Parse any error embedded in the hash by Supabase
    const hash       = window.location.hash;
    const hashParams = new URLSearchParams(hash.substring(1));
    const errDesc    = hashParams.get('error_description') || hashParams.get('error');

    if (errDesc) {
      const friendly = errDesc === 'Email link is invalid or has expired'
        ? 'קישור האיפוס פג תוקף או כבר נוצל. חזרו לדף הכניסה ובקשו קישור חדש.'
        : errDesc;
      setHashError(friendly);
      setPageState('error');
      // Clean hash from URL
      window.history.replaceState(null, '', window.location.pathname);
      return;
    }

    // Supabase SDK picks up the #access_token hash and fires PASSWORD_RECOVERY.
    // We also check for an existing recovery session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPageState('ready');
        window.history.replaceState(null, '', window.location.pathname);
      }
    });

    // If the SDK already processed the hash before our listener registered,
    // check for an active session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setPageState('ready');
        window.history.replaceState(null, '', window.location.pathname);
      }
      // If no session yet, wait for the onAuthStateChange event above.
      // Set a fallback timeout so we don't spin forever.
    });

    const fallback = setTimeout(() => {
      setPageState(prev => prev === 'checking' ? 'error' : prev);
      setHashError('לא הצלחנו לאמת את הקישור. ייתכן שפג תוקפו — נסו לבקש קישור חדש.');
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, []);

  // ── Submit new password ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg("הסיסמאות לא תואמות");
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg("הסיסמה חייבת להכיל לפחות 6 תווים");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { setErrorMsg(error.message); return; }
      await supabase.auth.signOut();
      setPageState('done');
    } catch (err: any) {
      setErrorMsg(err?.message || "אירעה שגיאה, נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  // ── Inner panels ──────────────────────────────────────────────────────────
  const renderLeft = () => {
    /* Spinner while verifying token */
    if (pageState === 'checking') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2.5px solid ${C.border}`, borderTopColor: C.purple, animation: 'rp-spin 0.8s linear infinite' }} />
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>מאמתים את הקישור...</p>
        </div>
      );
    }

    /* Error state */
    if (pageState === 'error') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.dark, margin: 0 }}>קישור לא תקין</p>
          <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6 }}>{hashError}</p>
          <button
            type="button"
            onClick={() => navigate('/app/auth')}
            style={primaryBtn()}
          >
            חזרה לדף הכניסה
          </button>
        </div>
      );
    }

    /* Success state */
    if (pageState === 'done') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <p style={{ fontSize: 15, fontWeight: 800, color: C.dark, margin: 0 }}>הסיסמה עודכנה בהצלחה</p>
          <p style={{ fontSize: 12, color: C.muted, margin: 0 }}>כעת ניתן להתחבר עם הסיסמה החדשה</p>
          <button
            type="button"
            onClick={() => navigate('/app/auth')}
            style={primaryBtn()}
          >
            כניסה לחשבון
          </button>
        </div>
      );
    }

    /* Ready — show the form */
    return (
      <>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: C.dark, margin: '0 0 4px', fontFamily: F }}>
            סיסמה חדשה
          </h1>
          <p style={{ fontSize: 13, fontWeight: 500, color: C.muted, margin: 0 }}>
            בחרו סיסמה חדשה לחשבון שלכם
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>סיסמה חדשה</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={6}
              dir="ltr"
              placeholder="לפחות 6 תווים"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>אימות סיסמה</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              dir="ltr"
              style={inputStyle}
            />
          </div>

          {errorMsg && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#dc2626', lineHeight: 1.5 }}>
              {errorMsg}
            </div>
          )}

          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? 'שומר...' : 'שמור סיסמה'}
          </button>
        </form>
      </>
    );
  };

  // ── Page ──────────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex' }}>
      <style>{CSS}</style>

      {/* ── LEFT — form panel ── */}
      <div
        className="rp-left"
        style={{
          flex: 1, background: C.bg,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '40px 48px', overflowY: 'auto',
        }}
      >
        <div style={{ maxWidth: 520, width: '100%', margin: '0 auto' }}>
          {renderLeft()}
        </div>
      </div>

      {/* ── RIGHT — purple panel ── */}
      <div
        className="rp-right"
        style={{
          background: C.purplePan, padding: '40px 48px',
          flexDirection: 'column',
          width: '42%', minWidth: 340,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 56 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.indigo, display: 'inline-block' }} />
          <span style={{ fontFamily: "'Righteous', sans-serif", fontSize: 19, color: '#fff' }}>
            Nest<span style={{ color: '#818cf8' }}>AI</span>
          </span>
        </div>

        {/* Copy */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.3 }}>
            כמעט שם —<br />רק עוד שלב אחד
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>
            בחרו סיסמה חזקה שתהיה קל לכם לזכור.
          </p>
        </div>

        {/* Tips */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { emoji: '🔒', text: 'לפחות 6 תווים' },
            { emoji: '🔡', text: 'שלבו אותיות ומספרים' },
            { emoji: '🛡️', text: 'אל תשתמשו בסיסמה שכבר ידועה' },
          ].map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 18 }}>{tip.emoji}</span>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: 0 }}>{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
