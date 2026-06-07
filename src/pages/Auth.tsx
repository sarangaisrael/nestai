import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { ensureUserAccessProfile, getRouteForAccessState } from "@/lib/accessControl";
import { buildReferralPath } from "@/lib/referrals";
import { getDefaultRouteForUser } from "@/lib/userRoles";
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
  .auth-right { display: flex !important; }
  @media (max-width: 768px) {
    .auth-right { display: none !important; }
    .auth-left  { padding: 24px !important; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
const Auth = () => {
  const [isLogin,             setIsLogin]             = useState(true);
  const [registrationDone,    setRegistrationDone]    = useState(false);
  const [isForgotPassword,    setIsForgotPassword]    = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [fullName,         setFullName]         = useState("");
  const [email,            setEmail]            = useState("");
  const [password,         setPassword]         = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [loading,          setLoading]          = useState(false);
  const [resendLoading,    setResendLoading]     = useState(false);
  const [isReady,          setIsReady]          = useState(false);
  const [loginError,       setLoginError]       = useState<string | null>(null);
  const [acceptedPrivacy,  setAcceptedPrivacy]  = useState(false);
  const [therapyType,      setTherapyType]      = useState<string>("");
  const [summaryFocus,     setSummaryFocus]     = useState<string[]>(["emotions", "thoughts", "behaviors", "changes"]);

  const navigate     = useNavigate();
  const location     = useLocation();
  const { toast }    = useToast();
  const { t, dir, isRTL } = useLanguage();

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

  const isResettingRef = useRef(isResettingPassword);
  useEffect(() => { isResettingRef.current = isResettingPassword; }, [isResettingPassword]);

  useEffect(() => {
    const hash       = window.location.hash;
    const hashParams = new URLSearchParams(hash.substring(1));
    const hashType   = hashParams.get('type');
    const isRecovery = hashType === 'recovery';
    const hashError  = hashParams.get('error_description') || hashParams.get('error');

    if (hashError) {
      setLoginError(
        hashError === 'Email link is invalid or has expired'
          ? 'קישור האיפוס פג תוקף או כבר נוצל. שלחו קישור חדש.'
          : hashError
      );
      window.history.replaceState(null, '', window.location.pathname);
      setIsReady(true);
      return;
    }

    if (isRecovery) {
      setIsResettingPassword(true);
      isResettingRef.current = true;
      setIsReady(true);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
        isResettingRef.current = true;
        setIsReady(true);
      } else if (event === 'SIGNED_IN') {
        if (!isResettingRef.current) {
          void (async () => {
            try {
              const target = await getPostAuthDestination(session.user.id);
              navigate(target, { replace: true });
            } catch { setIsReady(true); }
          })();
        } else {
          setIsReady(true);
        }
      }
    });

    if (isRecovery) return () => subscription.unsubscribe();

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (isResettingRef.current) { setIsReady(true); }
          else { navigate(await getPostAuthDestination(session.user.id), { replace: true }); }
        } else { setIsReady(true); }
      } catch { setIsReady(true); }
    };
    checkSession();
    return () => subscription.unsubscribe();
  }, [navigate, isRTL, referralCode, requestedNextPath]);

  // ── Form handlers ────────────────────────────────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setLoginError(null);
    if (newPassword !== confirmPassword) {
      setLoginError("הסיסמאות לא תואמות"); setLoading(false); return;
    }
    if (newPassword.length < 6) {
      setLoginError("הסיסמה חייבת להכיל לפחות 6 תווים"); setLoading(false); return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { setLoginError(error.message); setLoading(false); return; }
      setLoading(false);
      toast({ title: "הסיסמה עודכנה", description: "הסיסמה החדשה נשמרה בהצלחה" });
      await supabase.auth.signOut();
      setIsResettingPassword(false);
      setNewPassword(""); setConfirmPassword("");
    } catch (err: any) { setLoginError(err?.message || t.errors.somethingWentWrong); setLoading(false); }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setLoginError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app/auth`,
      });
      if (error) { setLoginError(error.message); setLoading(false); return; }
      setLoading(false);
      toast({ title: "נשלח בהצלחה", description: "קישור לאיפוס סיסמה נשלח לאימייל שלך" });
      setIsForgotPassword(false);
    } catch (err: any) { setLoginError(err?.message || t.errors.somethingWentWrong); setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setLoginError(null);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { setLoginError(getReadableAuthError(error.message)); setLoading(false); return; }
        setLoading(false);
        toast({ title: t.auth.loginSuccess, description: t.auth.welcomeBack });
      } else {
        if (!acceptedPrivacy) {
          setLoginError(t.privacy.mustAcceptPrivacy); setLoading(false); return;
        }
        if (summaryFocus.length === 0) {
          setLoading(false); return;
        }
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/welcome`,
            data: { intended_role: "patient", full_name: fullName },
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
      }
    } catch (err: any) { setLoginError(err?.message || t.errors.somethingWentWrong); setLoading(false); }
  };

  const handleGoogleAuth = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app/dashboard` },
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

  const switchTab = (login: boolean) => {
    setIsLogin(login);
    setLoginError(null);
    setTherapyType("");
    setSummaryFocus(["emotions", "thoughts", "behaviors", "changes"]);
    setAcceptedPrivacy(false);
    setFullName("");
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

  // ── Registration done (email verification pending) ───────────────────────────
  if (registrationDone) {
    const regSteps = [
      { title: 'נרשמת בהצלחה',    sub: 'החשבון שלך נוצר',       state: 'done'     as const },
      { title: 'אימות האימייל',    sub: 'ממתינים לאישור שלך',    state: 'active'   as const },
      { title: 'כניסה לאפליקציה', sub: 'המסע מתחיל',             state: 'inactive' as const },
    ];
    return (
      <div dir="rtl" style={{ minHeight: '100vh', display: 'flex' }}>
        <style>{CSS}</style>

        {/* ── LEFT ── */}
        <div
          className="auth-left"
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
              onClick={() => setRegistrationDone(false)}
              style={{ color: C.muted, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginTop: 28, textDecoration: 'underline' }}
            >
              חזרה להתחברות
            </button>
          </div>
        </div>

        {/* ── RIGHT ── */}
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
            <span style={{ fontSize: 15, fontWeight: 900, color: 'white', letterSpacing: '-0.3px' }}>NestAI</span>
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

          {/* ── Reset password ── */}
          {isResettingPassword ? (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 21, fontWeight: 800, color: C.dark, margin: '0 0 4px' }}>סיסמה חדשה</h1>
                <p style={{ fontSize: 13, fontWeight: 500, color: C.muted, margin: 0 }}>בחרו סיסמה חדשה לחשבון שלכם</p>
              </div>
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>סיסמה חדשה</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} dir="ltr" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>אימות סיסמה</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} dir="ltr" style={inputStyle} />
                </div>
                <ErrorBlock />
                <button type="submit" disabled={loading} style={primaryBtn(loading)}>
                  {loading ? 'שומר...' : 'שמור סיסמה'}
                </button>
              </form>
            </>

          /* ── Forgot password ── */
          ) : isForgotPassword ? (
            <>
              <div style={{ marginBottom: 28 }}>
                <h1 style={{ fontSize: 21, fontWeight: 800, color: C.dark, margin: '0 0 4px' }}>שכחתי סיסמה</h1>
                <p style={{ fontSize: 13, fontWeight: 500, color: C.muted, margin: 0 }}>נשלח לך קישור לאיפוס לאימייל שלך</p>
              </div>
              <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>אימייל</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" style={inputStyle} />
                </div>
                <ErrorBlock />
                <button type="submit" disabled={loading} style={primaryBtn(loading)}>
                  {loading ? 'שולח...' : 'שלח קישור לאיפוס'}
                </button>
                <button type="button" onClick={() => { setIsForgotPassword(false); setLoginError(null); }}
                  style={{ color: C.muted, fontSize: 13, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'center', marginTop: 4 }}>
                  חזרה להתחברות
                </button>
              </form>
            </>

          /* ── Login / Register ── */
          ) : (
            <>
              {/* Tabs */}
              <div style={{ background: 'white', border: `1px solid ${C.border}`, borderRadius: 10, padding: 4, display: 'flex', gap: 4, marginBottom: 28 }}>
                {[{ label: 'התחברות', val: true }, { label: 'הרשמה', val: false }].map(tab => (
                  <button
                    key={String(tab.val)}
                    type="button"
                    onClick={() => switchTab(tab.val)}
                    style={{
                      flex: 1, background: isLogin === tab.val ? C.purple : 'transparent',
                      color: isLogin === tab.val ? 'white' : C.muted,
                      borderRadius: 7, padding: 8, fontSize: 13, fontWeight: 700,
                      border: 'none', cursor: 'pointer', fontFamily: F, transition: 'background 0.15s',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Title */}
              <div style={{ marginBottom: 24 }}>
                <h1 style={{ fontSize: 21, fontWeight: 800, color: C.dark, margin: '0 0 4px', fontFamily: F }}>
                  {isLogin ? 'ברוכים השבים' : 'מתחילים את המסע'}
                </h1>
                <p style={{ fontSize: 13, fontWeight: 500, color: C.muted, margin: 0 }}>
                  {isLogin ? 'ממשיכים מאיפה שעצרתם' : 'כמה פרטים קטנים ואתם בפנים'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Full name — register only */}
                {!isLogin && (
                  <div>
                    <label style={labelStyle}>שם מלא</label>
                    <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required style={inputStyle} />
                  </div>
                )}

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

                {/* Forgot link — login only */}
                {isLogin && (
                  <button type="button" onClick={() => { setIsForgotPassword(true); setLoginError(null); }}
                    style={{ color: C.muted, fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'right', padding: 0, alignSelf: 'flex-start' }}>
                    שכחתי סיסמה
                  </button>
                )}

                {/* Privacy consent — register only */}
                {!isLogin && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                    <input
                      type="checkbox" id="privacy-auth"
                      checked={acceptedPrivacy} onChange={e => setAcceptedPrivacy(e.target.checked)}
                      style={{ marginTop: 2, accentColor: C.purple, flexShrink: 0, cursor: 'pointer' }}
                    />
                    <label htmlFor="privacy-auth" style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, cursor: 'pointer' }}>
                      קראתי ואני מסכים/ה{' '}
                      <button type="button" onClick={() => window.open('/app/privacy', '_blank')}
                        style={{ color: C.purple, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 12 }}>
                        למדיניות הפרטיות
                      </button>
                    </label>
                  </div>
                )}

                <ErrorBlock />

                <button type="submit" disabled={loading} style={primaryBtn(loading)}>
                  {loading ? 'טוען...' : isLogin ? 'כניסה' : 'יצירת חשבון בחינם'}
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
                {isLogin ? 'כניסה עם Google' : 'הרשמה עם Google'}
              </button>

              {/* Trust badge */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, color: C.muted, fontSize: 12 }}>
                <LockIcon />
                מאובטח ופרטי — המסע שלכם שמור כאן
              </div>
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
          <span style={{ fontSize: 15, fontWeight: 900, color: 'white', letterSpacing: '-0.3px' }}>NestAI</span>
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
