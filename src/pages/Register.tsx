import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ensureUserAccessProfile } from "@/lib/accessControl";
import { FileText, TrendingUp, Sparkles } from "lucide-react";

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
  .reg-right { display: flex !important; }
  @media (max-width: 768px) {
    .reg-right { display: none !important; }
    .reg-left  { padding: 24px !important; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
const Register = () => {
  const [registrationDone, setRegistrationDone] = useState(false);
  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [loading,          setLoading]          = useState(false);
  const [resendLoading,    setResendLoading]     = useState(false);
  const [loginError,       setLoginError]       = useState<string | null>(null);
  const [therapyType,      setTherapyType]      = useState<string>("");
  const [summaryFocus]                          = useState<string[]>(["emotions", "thoughts", "behaviors", "changes"]);

  const navigate  = useNavigate();
  const location  = useLocation();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(location.search);
  const referralCode = searchParams.get("ref")?.trim() ?? "";

  const getReadableAuthError = (rawMessage?: string) => {
    const normalized = rawMessage?.toLowerCase().trim() ?? "";
    if (normalized.includes("invalid login credentials"))
      return "האימייל או הסיסמה אינם נכונים, או שעדיין אין חשבון עם האימייל הזה.";
    if (normalized.includes("email not confirmed"))
      return "כתובת האימייל עדיין לא אומתה — בדקו את תיבת המייל ואשרו את ההרשמה.";
    return rawMessage || "שגיאה בהרשמה";
  };

  // ── Form handler ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setLoginError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: `${window.location.origin}/welcome`,
          data: { intended_role: "patient" },
        },
      });
      if (error) { setLoginError(getReadableAuthError(error.message)); setLoading(false); return; }
      if (data.user) {
        await ensureUserAccessProfile(data.user, "patient");
        await supabase.from("user_preferences").upsert({
          user_id: data.user.id,
          therapy_type: therapyType || null,
          summary_focus: summaryFocus,
        }, { onConflict: 'user_id' });
      }
      setLoading(false);
      setRegistrationDone(true);
    } catch (err: any) { setLoginError(err?.message || "שגיאה בהרשמה"); setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/welcome` },
    });
    if (error) setLoginError(getReadableAuthError(error.message));
  };

  const handleResend = async () => {
    setResendLoading(true);
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setResendLoading(false);
    if (error) {
      toast({ title: 'שגיאה בשליחה', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'נשלח מחדש', description: 'קישור האימות נשלח שוב לאימייל שלך' });
    }
  };

  // ── Registration done (email verification pending) ───────────────────────────
  if (registrationDone) {
    const regSteps = [
      { title: 'נרשמת בהצלחה',    sub: 'החשבון שלך נוצר',    state: 'done'     as const },
      { title: 'אימות האימייל',    sub: 'ממתינים לאישור שלך', state: 'active'   as const },
      { title: 'כניסה לאפליקציה', sub: 'המסע מתחיל',          state: 'inactive' as const },
    ];
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex' }}>
        <style>{CSS}</style>

        {/* ── LEFT ── */}
        <div
          className="reg-left"
          style={{
            flex: 1, background: C.bg,
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: '40px 48px', overflowY: 'auto',
          }}
        >
          <div style={{ maxWidth: 400, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            {/* Mail icon */}
            <div style={{
              width: 64, height: 64, background: '#ede9fe', borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, flexShrink: 0,
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 900, color: C.dark, margin: '0 0 8px' }}>
              בדקו את תיבת הדואר
            </h1>
            <p style={{ fontSize: 14, color: C.muted, margin: '0 0 14px', lineHeight: 1.6 }}>
              שלחנו קישור אימות לכתובת:
            </p>

            {/* Email badge */}
            <div style={{
              background: 'white', border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '8px 18px', fontSize: 13, color: C.dark, marginBottom: 22, fontWeight: 600,
            }}>
              {email}
            </div>

            {/* Resend note */}
            <p style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.8, margin: 0 }}>
              לא קיבלת?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading}
                style={{ color: '#6366f1', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0 }}
              >
                {resendLoading ? 'שולח...' : 'שלח שוב'}
              </button>
              {' '}| בדוק גם בתיקיית הספאם
            </p>

            <button
              type="button"
              onClick={() => navigate('/app/auth')}
              style={{ color: C.muted, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginTop: 28, textDecoration: 'underline' }}
            >
              חזרה להתחברות
            </button>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div
          className="reg-right"
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

          {/* Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {regSteps.map((step, i) => (
              <div
                key={i}
                style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  opacity: step.state === 'inactive' ? 0.4 : 1,
                }}
              >
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
        className="reg-left"
        style={{
          flex: 1, background: C.bg,
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '40px 48px', overflowY: 'auto',
        }}
      >
        <div style={{ maxWidth: 520, width: '100%', margin: '0 auto' }}>

          {/* Title */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 21, fontWeight: 800, color: C.dark, margin: '0 0 4px', fontFamily: F }}>
              מתחילים את המסע
            </h1>
            <p style={{ fontSize: 13, fontWeight: 500, color: C.muted, margin: 0 }}>
              כמה פרטים קטנים ואתם בפנים
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Email */}
            <div>
              <label style={labelStyle}>אימייל</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" style={inputStyle} />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>סיסמה</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} dir="ltr" style={inputStyle} />
            </div>

            <ErrorBlock />

            <button type="submit" disabled={loading} style={primaryBtn(loading)}>
              {loading ? 'טוען...' : 'יצירת חשבון בחינם'}
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
            הרשמה עם Google
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

        </div>
      </div>

      {/* ── RIGHT — purple panel ── */}
      <div
        className="reg-right"
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

export default Register;
