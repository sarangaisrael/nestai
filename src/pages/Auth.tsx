import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { ensureUserAccessProfile, getRouteForAccessState } from "@/lib/accessControl";
import { buildReferralPath } from "@/lib/referrals";
import { getDefaultRouteForUser } from "@/lib/userRoles";
import { FileText, TrendingUp, Sparkles } from "lucide-react";
// Login-only page — registration is at /register (src/pages/Register.tsx).

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

// ── Inline SVGs ───────────────────────────────────────────────────────────────
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C17.658 14.01 17.64 11.815 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const LockIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
  @keyframes auth-spin { to { transform: rotate(360deg); } }
  .auth-right { display: flex !important; }
  @media (max-width: 768px) {
    .auth-right { display: none !important; }
    .auth-left  { padding: 24px !important; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
const Auth = () => {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotSent,       setForgotSent]       = useState(false);

  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [loading,    setLoading]    = useState(false);
  const [isReady,    setIsReady]    = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const navigate     = useNavigate();
  const location     = useLocation();
  const { t, isRTL } = useLanguage();

  const searchParams       = new URLSearchParams(location.search);
  const referralCode       = searchParams.get("ref")?.trim()  ?? "";
  const requestedNextPath  = searchParams.get("next")?.trim() ?? "";
  const modeParam          = searchParams.get("mode")?.trim() ?? "";
  const hasExplicitAuthMode = modeParam === "patient";

  // ── Auth helpers ────────────────────────────────────────────────────────────
  const getModeDefaultDestination = async (userId: string) => {
    const { data } = await supabase.auth.getUser();
    if (data.user && data.user.id === userId) {
      const accessState = await ensureUserAccessProfile(data.user, "patient");
      return getRouteForAccessState(accessState);
    }
    return "/app/dashboard";
  };

  const getReadableAuthError = (rawMessage?: string) => {
    const normalized = rawMessage?.toLowerCase().trim() ?? "";
    if (normalized.includes("invalid login credentials"))
      return "האימייל או הסיסמה אינם נכונים, או שעדיין אין חשבון עם האימייל הזה.";
    if (normalized.includes("email not confirmed"))
      return "כתובת האימייל עדיין לא אומתה — בדקו את תיבת המייל ואשרו את ההרשמה.";
    return rawMessage || t.auth.errorOccurred;
  };

  const getPostAuthDestination = async (userId: string) => {
    if (referralCode) return buildReferralPath(referralCode);
    if (requestedNextPath.startsWith("/")) return requestedNextPath;
    if (hasExplicitAuthMode) return getModeDefaultDestination(userId);
    return getDefaultRouteForUser(userId);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        void (async () => {
          try {
            const target = await getPostAuthDestination(session.user.id);
            navigate(target, { replace: true });
          } catch { setIsReady(true); }
        })();
      }
    });

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate(await getPostAuthDestination(session.user.id), { replace: true });
        } else {
          setIsReady(true);
        }
      } catch { setIsReady(true); }
    };
    checkSession();
    return () => subscription.unsubscribe();
  }, [navigate, isRTL, referralCode, requestedNextPath]);

  // ── Form handlers ────────────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.nestai.care/reset-password',
      });
      if (error) { setLoginError(error.message); setLoading(false); return; }
      setForgotSent(true);
    } catch (err: any) {
      setLoginError(err?.message || t.errors.somethingWentWrong);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setLoginError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setLoginError(getReadableAuthError(error.message)); setLoading(false); return; }
      setLoading(false);
    } catch (err: any) { setLoginError(err?.message || t.errors.somethingWentWrong); setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/welcome` },
    });
    if (error) setLoginError(getReadableAuthError(error.message));
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (!isReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2.5px solid ${C.border}`, borderTopColor: C.purple, animation: 'auth-spin 0.8s linear infinite' }} />
        <style>{CSS}</style>
      </div>
    );
  }

  // ── Error block ───────────────────────────────────────────────────────────────
  const ErrorBlock = () => loginError ? (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#dc2626', lineHeight: 1.5 }}>
      {loginError}
    </div>
  ) : null;

  // ── Benefits data ─────────────────────────────────────────────────────────────
  const benefits = [
    { Icon: FileText,   title: 'תיעוד בין הפגישות',       sub: 'כותבים מה שעובר עליכם, בלי לשכוח כלום' },
    { Icon: TrendingUp, title: 'מעקב רגשי לאורך זמן',      sub: 'רואים את ההתקדמות בגרפים ברורים' },
    { Icon: Sparkles,   title: 'סיכום לפני כל פגישה',      sub: 'מגיעים מוכנים, צוללים ישר לעומק' },
  ];

  // ── Main render ───────────────────────────────────────────────────────────────
  return (
    <div dir="rtl" style={{ minHeight: '100vh', display: 'flex' }}>
      <style>{CSS}</style>

      {/* ── LEFT — form panel ── */}
      <div
        className="auth-left"
        style={{
          flex: 1, background: C.bg,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '40px 48px', overflowY: 'auto',
        }}
      >
        <div style={{ maxWidth: 520, width: '100%', margin: '0 auto' }}>

          {/* ── Forgot password ── */}
          {isForgotPassword ? (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 21, fontWeight: 800, color: C.dark, margin: '0 0 4px' }}>שכחתי סיסמה</h1>
                <p style={{ fontSize: 13, fontWeight: 500, color: C.muted, margin: 0 }}>נשלח לך קישור לאיפוס לאימייל שלך</p>
              </div>

              {forgotSent ? (
                /* ── Confirmation message ── */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center', padding: '12px 0' }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.dark, margin: 0 }}>
                    שלחנו לך קישור לאיפוס סיסמה לאימייל
                  </p>
                  <p style={{ fontSize: 12, color: C.muted, margin: 0, lineHeight: 1.6 }}>
                    בדקו את תיבת הדואר הנכנס (וגם את ספאם).<br />
                    הקישור תקף ל-60 דקות.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setForgotSent(false); setLoginError(null); }}
                    style={{ color: C.muted, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
                  >
                    חזרה להתחברות
                  </button>
                </div>
              ) : (
                /* ── Email form ── */
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={labelStyle}>אימייל</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" style={inputStyle} />
                  </div>
                  <ErrorBlock />
                  <button type="submit" disabled={loading} style={primaryBtn(loading)}>
                    {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsForgotPassword(false); setLoginError(null); }}
                    style={{ color: C.muted, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', marginTop: 4 }}
                  >
                    חזרה להתחברות
                  </button>
                </form>
              )}
            </>

          /* ── Login ── */
          ) : (
            <>
              {/* Title */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 21, fontWeight: 800, color: C.dark, margin: '0 0 4px', fontFamily: F }}>
                  ברוכים השבים
                </h1>
                <p style={{ fontSize: 13, fontWeight: 500, color: C.muted, margin: 0 }}>
                  ממשיכים מאיפה שעצרתם
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Email */}
                <div>
                  <label style={labelStyle}>אימייל</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" style={inputStyle} />
                </div>

                {/* Password + forgot link */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>סיסמה</label>
                    <button
                      type="button"
                      onClick={() => { setIsForgotPassword(true); setLoginError(null); }}
                      style={{ color: C.muted, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: F }}
                    >
                      שכחת סיסמה?
                    </button>
                  </div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} dir="ltr" style={inputStyle} />
                </div>

                <ErrorBlock />

                <button type="submit" disabled={loading} style={primaryBtn(loading)}>
                  {loading ? 'טוען...' : 'כניסה'}
                </button>
              </form>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                <span style={{ fontSize: 12, color: '#94a3b8', flexShrink: 0 }}>או</span>
                <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              </div>

              {/* Google button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                style={{
                  width: '100%', background: 'white', border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: '11px 0', fontSize: 13,
                  color: '#374151', fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  fontFamily: F,
                }}
              >
                <GoogleIcon />
                כניסה עם Google
              </button>

              {/* Trust badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, color: C.muted, fontSize: 12 }}>
                <LockIcon />
                מאובטח ופרטי — המסע שלכם שמור כאן
              </div>

              {/* Terms / privacy note */}
              <p style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.8, margin: '10px 0 0' }}>
                על ידי המשך, את/ה מסכים/ה ל
                <button type="button" onClick={() => window.open('/privacy', '_blank')}
                  style={{ color: C.muted, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}>
                  תנאי שימוש
                </button>
                ו
                <button type="button" onClick={() => window.open('/privacy', '_blank')}
                  style={{ color: C.muted, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, padding: '0 2px' }}>
                  מדיניות פרטיות
                </button>
              </p>
            </>
          )}

        </div>
      </div>

      {/* ── RIGHT — purple panel ── */}
      <div
        className="auth-right"
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

        {/* Headline */}
        <div style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: 'white', margin: '0 0 8px', letterSpacing: '-0.5px', lineHeight: 1.3 }}>
            כלי שנבנה בשביל<br />התהליך הטיפולי שלך
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.6 }}>
            לא עוד AI כללי — פלטפורמה שמותאמת לבין הפגישות.
          </p>
        </div>

        {/* Benefits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {benefits.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, background: 'rgba(255,255,255,0.12)',
                borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <b.Icon size={16} color={C.indigo} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: '0 0 3px' }}>{b.title}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.5 }}>{b.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Auth;
