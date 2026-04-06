import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import { useToast } from "@/hooks/use-toast";
import { InstallButton } from "@/components/InstallButton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLanguage } from "@/contexts/LanguageContext";
import { ensureUserAccessProfile, getRouteForAccessState } from "@/lib/accessControl";
import { buildReferralPath } from "@/lib/referrals";
import { getDefaultRouteForUser } from "@/lib/userRoles";
import { ArrowRight, Info } from "lucide-react";

import logo from "@/assets/nestai-logo-full.png";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [isReady, setIsReady] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  
  const [therapyType, setTherapyType] = useState<string>("");
  const [summaryFocus, setSummaryFocus] = useState<string[]>(["emotions", "thoughts", "behaviors", "changes"]);
  const [therapistCode, setTherapistCode] = useState("");
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t, dir, isRTL } = useLanguage();
  const searchParams = new URLSearchParams(location.search);
  const referralCode = searchParams.get("ref")?.trim() ?? "";
  const requestedNextPath = searchParams.get("next")?.trim() ?? "";
  const modeParam = searchParams.get("mode");
  const hasExplicitAuthMode = modeParam === "patient" || modeParam === "therapist";
  const authMode = modeParam === "therapist" ? "therapist" : "patient";
  const isTherapistAuth = authMode === "therapist";

  const getModeDefaultDestination = async (userId: string) => {
    const { data } = await supabase.auth.getUser();
    if (data.user && data.user.id === userId) {
      const accessState = await ensureUserAccessProfile(data.user, isTherapistAuth ? "therapist" : "patient");
      return getRouteForAccessState(accessState);
    }

    return isTherapistAuth ? "/app/professional/dashboard" : "/app/dashboard";
  };

  const getReadableAuthError = (rawMessage?: string) => {
    const normalized = rawMessage?.toLowerCase().trim() ?? "";

    if (normalized.includes("invalid login credentials")) {
      if (isTherapistAuth) {
        return isRTL
          ? "פרטי ההתחברות לא תואמים לחשבון מטפל/ת. אם זה חשבון מטופל/ת, עברו ל׳כניסת מטופלים׳. אם עדיין אין לכם גישת מטפל/ת, אפשר להגיש בקשה במסך המטפלים."
          : "These details don't match a therapist account. If this is a patient account, switch to Patient login. If you don't have therapist access yet, apply from the therapist screen.";
      }

      return isRTL
        ? "האימייל או הסיסמה אינם נכונים, או שעדיין אין חשבון עם האימייל הזה. אפשר לנסות שוב, להירשם, או לאפס סיסמה."
        : "The email or password is incorrect, or there isn't an account with this email yet. Try again, sign up, or reset your password.";
    }

    if (normalized.includes("email not confirmed")) {
      return isRTL
        ? "החשבון קיים, אבל כתובת האימייל עדיין לא אומתה. בדקו את תיבת המייל ואשרו את ההרשמה לפני ההתחברות."
        : "Your account exists, but the email address hasn't been confirmed yet. Please verify it from your inbox before signing in.";
    }

    return rawMessage || t.auth.errorOccurred;
  };

  const getValidatedNextPath = async (userId: string) => {
    if (!requestedNextPath.startsWith("/")) {
      return null;
    }

    return requestedNextPath;
  };

  const getPostAuthDestination = async (userId: string) => {
    if (referralCode) {
      return buildReferralPath(referralCode);
    }

    const validatedNextPath = await getValidatedNextPath(userId);
    if (validatedNextPath) {
      return validatedNextPath;
    }

    if (hasExplicitAuthMode) {
      return getModeDefaultDestination(userId);
    }

    return getDefaultRouteForUser(userId);
  };

  const destinationNotice = isTherapistAuth
    ? {
        title: isRTL ? "אחרי ההתחברות" : "After login",
        description: isRTL
          ? "מטפלים נכנסים לדאשבורד המטפלים. בהרשמה תקבלו 30 ימי ניסיון וקוד מטפל לשיתוף עם מטופלים."
          : "Therapists enter the therapist dashboard. On sign up you'll get a 30-day trial and a therapist code to share with patients.",
      }
    : {
        title: isRTL ? "אחרי ההתחברות" : "After login",
        description: isRTL
          ? "הכניסה ממסך זה מובילה לאזור המטופלים. אפשר להירשם עצמאית או להזין קוד מטפל כדי לקבל גישה דרך המטפל/ת."
          : "This screen leads to the patient area. You can sign up independently or enter a therapist code to be covered by your therapist.",
      };

  const normalizedTherapistCode = therapistCode.trim();

  useEffect(() => {
    if (isTherapistAuth) {
      setIsLogin(true);
      setIsForgotPassword(false);
      setLoginError(null);
    }
  }, [isTherapistAuth]);

  // Use a ref to track recovery state to avoid stale closure issues
  const isResettingRef = useRef(isResettingPassword);
  useEffect(() => {
    isResettingRef.current = isResettingPassword;
  }, [isResettingPassword]);

  useEffect(() => {
    // Check hash for recovery token - do this FIRST before anything else
    const hash = window.location.hash;
    const hashParams = new URLSearchParams(hash.substring(1));
    const hashType = hashParams.get('type');
    
    // Also check for access_token + type=recovery in hash (Supabase format)
    const accessToken = hashParams.get('access_token');
    const isRecovery = hashType === 'recovery';
    
    // Check for error in hash (e.g., expired or already-used link)
    const hashError = hashParams.get('error_description') || hashParams.get('error');
    if (hashError) {
      setLoginError(
        hashError === 'Email link is invalid or has expired'
          ? (isRTL ? 'קישור האיפוס פג תוקף או כבר נוצל. נסה לשלוח קישור חדש.' : 'Reset link has expired or was already used. Please request a new one.')
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

    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
        isResettingRef.current = true;
        setIsReady(true);
      } else if (event === 'SIGNED_IN') {
        // Only navigate to dashboard if NOT in password reset flow
        if (!isResettingRef.current) {
          void (async () => {
            try {
              const target = await getPostAuthDestination(session.user.id);
              navigate(target, { replace: true });
            } catch (err) {
              console.error("Post-auth redirect error:", err);
              setIsReady(true);
            }
          })();
        } else {
          // We're in recovery flow - just make sure the page is ready
          setIsReady(true);
        }
      }
    });

    // If we already detected recovery from hash, skip session check
    if (isRecovery) {
      return () => subscription.unsubscribe();
    }

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (isResettingRef.current) {
            setIsReady(true);
          } else {
            const target = await getPostAuthDestination(session.user.id);
            navigate(target, { replace: true });
          }
        } else {
          setIsReady(true);
        }
      } catch (err) {
        console.error("Session check error:", err);
        setIsReady(true);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, [navigate, isRTL, referralCode, requestedNextPath]);

  const toggleFocus = (focus: string) => {
    setSummaryFocus(prev => 
      prev.includes(focus) ? prev.filter(f => f !== focus) : [...prev, focus]
    );
  };

  const focusLabels: Record<string, Record<string, string>> = {
    he: { emotions: "רגשות", thoughts: "מחשבות", behaviors: "התנהגויות", changes: "שינויים" },
    en: { emotions: "Emotions", thoughts: "Thoughts", behaviors: "Behaviors", changes: "Changes" }
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }




  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    if (newPassword !== confirmPassword) {
      setLoginError(isRTL ? "הסיסמאות לא תואמות" : "Passwords don't match");
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setLoginError(isRTL ? "הסיסמה חייבת להכיל לפחות 6 תווים" : "Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setLoginError(error.message || t.auth.errorOccurred);
        setLoading(false);
        return;
      }
      setLoading(false);
      toast({
        title: isRTL ? "הסיסמה עודכנה" : "Password updated",
        description: isRTL ? "הסיסמה החדשה נשמרה בהצלחה" : "Your new password has been saved",
      });
      await supabase.auth.signOut();
      setIsResettingPassword(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setLoginError(err?.message || t.errors.somethingWentWrong);
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/app/auth`,
      });
      if (error) {
        setLoginError(error.message || t.auth.errorOccurred);
        setLoading(false);
        return;
      }
      setLoading(false);
      toast({
        title: isRTL ? "נשלח בהצלחה" : "Email sent",
        description: isRTL ? "קישור לאיפוס סיסמה נשלח לכתובת המייל שלך" : "A password reset link has been sent to your email",
      });
      setIsForgotPassword(false);
    } catch (err: any) {
      setLoginError(err?.message || t.errors.somethingWentWrong);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setLoginError(getReadableAuthError(error.message));
          setLoading(false);
          return;
        }
        setLoading(false);
        toast({ title: t.auth.loginSuccess, description: t.auth.welcomeBack });
      } else {
        if (!acceptedPrivacy) {
          setLoginError(t.privacy.mustAcceptPrivacy);
          setLoading(false);
          return;
        }
        if (summaryFocus.length === 0) {
          toast({
            title: t.errors.somethingWentWrong,
            description: isRTL ? "חובה לבחור לפחות תחום התמקדות אחד" : "You must select at least one focus area",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        if (!isTherapistAuth && normalizedTherapistCode && !/^\d{6}$/.test(normalizedTherapistCode)) {
          setLoginError(isRTL ? "קוד מטפל חייב להכיל 6 ספרות" : "Therapist code must contain 6 digits");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${referralCode ? buildReferralPath(referralCode) : "/app/dashboard"}`,
            data: {
              intended_role: isTherapistAuth ? "therapist" : "patient",
              therapist_code: !isTherapistAuth && normalizedTherapistCode ? normalizedTherapistCode : null,
            },
          },
        });
        if (error) {
          setLoginError(getReadableAuthError(error.message));
          setLoading(false);
          return;
        }
        if (data.user) {
          await ensureUserAccessProfile(data.user, isTherapistAuth ? "therapist" : "patient");
          await supabase.from("user_preferences").upsert({
            user_id: data.user.id,
            therapy_type: therapyType || null,
            summary_focus: summaryFocus,
          }, { onConflict: 'user_id' });
        }
        setLoading(false);
        toast({
          title: t.auth.signupSuccess,
          description: isRTL
            ? (isTherapistAuth ? "החשבון נפתח עם 30 ימי ניסיון. קוד המטפל שלך מוכן בדאשבורד." : "החשבון נפתח עם 30 ימי ניסיון.")
            : (isTherapistAuth ? "Your account starts with a 30-day trial. Your therapist code is ready in the dashboard." : "Your account starts with a 30-day trial."),
        });
        const accessState = await ensureUserAccessProfile(data.user, isTherapistAuth ? "therapist" : "patient");
        const target = requestedNextPath.startsWith("/")
          ? requestedNextPath
          : hasExplicitAuthMode
            ? getRouteForAccessState(accessState)
            : await getPostAuthDestination(data.user.id);
        navigate(target);
      }
    } catch (err: any) {
      setLoginError(err?.message || t.errors.somethingWentWrong);
      setLoading(false);
    }
  };

  const lang = isRTL ? 'he' : 'en';
  const switchToPatientAuth = () => navigate("/app/auth?mode=patient");
  const switchToTherapistAuth = () => navigate("/app/auth?mode=therapist&next=/app/professional/dashboard");
  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/app");
  };

          

  return (
    <div className="min-h-screen flex" dir={dir}>
      {/* Hero image side */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img src="/images/auth-hero.jpg" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className={`absolute bottom-12 ${isRTL ? 'right-10' : 'left-10'} text-white space-y-2 max-w-md`}>
          <h2 className="text-3xl font-bold leading-tight">
            {isRTL ? "התחילו את המסע שלכם" : "Start Your Journey"}
          </h2>
          <p className="text-white/80 text-base">
            {isRTL 
              ? "מרחב בטוח לכתוב בו מה שעובר, גם ברגעים עמוסים רגשית"
              : "A safe space to write what's on your mind, even during emotionally challenging moments"
            }
          </p>
        </div>
      </div>

      {/* Form side */}
        <div className="flex-1 flex flex-col bg-muted/30 relative overflow-y-auto">
          {/* Top header bar */}
          <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/30" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
            <div className="flex items-center justify-between px-4 h-14">
              <Button type="button" variant="ghost" size="sm" onClick={handleBack} className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowRight className={`h-4 w-4 ${isRTL ? '' : 'rotate-180'}`} />
                {isRTL ? "חזרה" : "Back"}
              </Button>
              <img src={logo} alt="NestAI" className="h-8 w-auto absolute left-1/2 -translate-x-1/2" />
              <div className="flex gap-2">
                <LanguageSwitcher />
                <InstallButton />
              </div>
            </div>
          </div>

          <div style={{ height: "calc(env(safe-area-inset-top, 0px) + 56px)" }} />

          <div className="flex-1 flex items-center justify-center p-6 pt-10">

        <div className="w-full max-w-md space-y-6 animate-slide-up">

          <div className="text-center space-y-2">
            <div className="inline-flex w-full rounded-full border border-border bg-background p-1">
              <button
                type="button"
                onClick={switchToPatientAuth}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${!isTherapistAuth ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {isRTL ? "כניסת מטופלים" : "Patient login"}
              </button>
              <button
                type="button"
                onClick={switchToTherapistAuth}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${isTherapistAuth ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
              >
                {isRTL ? "כניסת מטפלים" : "Therapist login"}
              </button>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isTherapistAuth
                ? (isRTL ? "מטפלים — התחברות והרשמה" : "Therapist Sign In & Sign Up")
                : (isRTL ? "מטופלים — התחברות והרשמה" : "Patient Sign In & Sign Up")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isTherapistAuth
                ? (isRTL ? "הרשמה וכניסה למטפלים עם 30 ימי ניסיון, ולאחר מכן חידוש ידני." : "Therapist sign in and sign up with a 30-day trial, then manual renewal.")
                : isLogin
                  ? (isRTL ? "התחברו כדי להמשיך במסע שלכם" : "Sign in to continue your journey")
                  : (isRTL ? "צרו חשבון כדי להתחיל — עם או בלי קוד מטפל" : "Create an account to get started — with or without a therapist code")}
            </p>
            <div className="flex items-start gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3 text-start">
              <div className="mt-0.5 shrink-0 rounded-full bg-background p-1.5 text-muted-foreground">
                <Info className="h-4 w-4" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">{destinationNotice.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{destinationNotice.description}</p>
              </div>
            </div>
          </div>

        {isResettingPassword ? (
          <form onSubmit={handleResetPassword} className="space-y-4 bg-card p-8 rounded-2xl shadow-card border border-border/30">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {isRTL ? "בחר סיסמה חדשה" : "Choose a New Password"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL ? "הזן סיסמה חדשה לחשבון שלך" : "Enter a new password for your account"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium text-foreground">
                {isRTL ? "סיסמה חדשה" : "New Password"}
              </Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={6} className="h-10 text-sm" dir="ltr" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                {isRTL ? "אימות סיסמה" : "Confirm Password"}
              </Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} className="h-10 text-sm" dir="ltr" />
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-medium mt-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" disabled={loading}>
              {loading ? t.common.loading : (isRTL ? "שמור סיסמה חדשה" : "Save New Password")}
            </Button>

            {loginError && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
                <p className="text-xs text-destructive font-medium">{loginError}</p>
              </div>
            )}
          </form>
        ) : isForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="space-y-4 bg-card p-8 rounded-2xl shadow-card border border-border/30">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {isRTL ? "שכחת סיסמה?" : "Forgot Password?"}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL ? "הזן את כתובת המייל שלך ונשלח לך קישור לאיפוס" : "Enter your email and we'll send you a reset link"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">{t.common.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 text-sm" dir="ltr" />
            </div>

            <Button type="submit" className="w-full h-11 text-sm font-medium mt-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" disabled={loading}>
              {loading ? t.common.loading : (isRTL ? "שלח קישור לאיפוס" : "Send Reset Link")}
            </Button>

            {loginError && (
              <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
                <p className="text-xs text-destructive font-medium">{loginError}</p>
              </div>
            )}

            <button type="button" onClick={() => { setIsForgotPassword(false); setLoginError(null); }} className="w-full text-center text-sm text-primary hover:underline transition-colors pt-2">
              {isRTL ? "חזרה להתחברות" : "Back to login"}
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Email/Password form */}
            <form onSubmit={handleSubmit} className="space-y-4 bg-card p-6 rounded-2xl shadow-card border border-border/30">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">{t.common.email}</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="h-10 text-sm" dir="ltr" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">{t.common.password}</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="h-10 text-sm" dir="ltr" />
              </div>

              {isLogin && (
                <>
                  <div className={`flex items-center gap-2 ${isRTL ? '' : 'flex-row-reverse justify-end'}`}>
                    <Label htmlFor="remember" className="text-sm cursor-pointer text-muted-foreground">
                      {isRTL ? "זכור אותי" : "Remember me"}
                    </Label>
                    <Checkbox id="remember" checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked as boolean)} />
                  </div>
                  <button type="button" onClick={() => { setIsForgotPassword(true); setLoginError(null); }} className="text-sm text-primary hover:underline transition-colors">
                    {isRTL ? "שכחתי סיסמה" : "Forgot password?"}
                  </button>
                </>
              )}

              {!isLogin && (
                <>
                  {/* Therapy Type */}
                  <div className="space-y-3 pt-2">
                    <Label className="text-sm font-medium text-foreground">{t.auth.therapyTypeLabel}</Label>
                    <RadioGroup value={therapyType} onValueChange={setTherapyType} className="space-y-2">
                      {[
                        { value: "cbt", label: t.dashboard.cbt },
                        { value: "psychodynamic", label: t.dashboard.psychodynamic },
                        { value: "other", label: isRTL ? "אחר" : "Other" },
                      ].map(opt => (
                        <div key={opt.value} className={`flex items-center gap-2 p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer ${isRTL ? '' : 'flex-row-reverse'}`}>
                          <Label htmlFor={`signup-${opt.value}`} className={`text-sm cursor-pointer flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{opt.label}</Label>
                          <RadioGroupItem value={opt.value} id={`signup-${opt.value}`} />
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Summary Focus */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">{t.auth.summaryFocusLabel}</Label>
                    <div className="space-y-2">
                      {["emotions", "thoughts", "behaviors", "changes"].map((value) => (
                        <div key={value} className={`flex items-center gap-2 p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all ${isRTL ? '' : 'flex-row-reverse'}`}>
                          <Label htmlFor={`signup-focus-${value}`} className={`text-sm cursor-pointer flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>{focusLabels[lang][value]}</Label>
                          <Checkbox id={`signup-focus-${value}`} checked={summaryFocus.includes(value)} onCheckedChange={() => toggleFocus(value)} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {!isTherapistAuth && (
                    <div className="space-y-2">
                      <Label htmlFor="therapist-code" className="text-sm font-medium text-foreground">
                        {isRTL ? "קוד מטפל (אופציונלי)" : "Therapist code (optional)"}
                      </Label>
                      <Input
                        id="therapist-code"
                        inputMode="numeric"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={therapistCode}
                        onChange={(e) => setTherapistCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder={isRTL ? "למשל 123456" : "e.g. 123456"}
                        dir="ltr"
                        className="h-10 text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        {isRTL
                          ? "אם המטפל/ת שלך פעיל/ה, הגישה שלך תישאר פתוחה בחינם."
                          : "If your therapist is active, your access will remain free."}
                      </p>
                    </div>
                  )}

                  {/* Privacy Policy Consent */}
                  <div className="space-y-3 pt-2">
                    <div 
                      className={`flex items-start gap-3 p-3 border rounded-lg transition-all ${acceptedPrivacy ? 'border-primary bg-primary/5' : 'border-border hover:border-primary hover:bg-primary/5'} ${isRTL ? '' : 'flex-row-reverse'}`}
                    >
                      <Label className={`text-sm flex-1 select-none ${isRTL ? 'text-right' : 'text-left'}`}>
                        {t.privacy.acceptPrivacyPolicy}
                        {' '}
                        <button
                          type="button"
                          className="text-primary hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open('/app/privacy', '_blank');
                          }}
                        >
                          ({isRTL ? 'קרא עוד' : 'read more'})
                        </button>
                      </Label>
                      <Checkbox
                        id="privacy-consent"
                        checked={acceptedPrivacy}
                        onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
                      />
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" className="w-full h-11 text-sm font-medium mt-4 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" disabled={loading}>
                {loading ? t.common.loading : isLogin ? t.common.login : t.common.signup}
              </Button>

              {loginError && (
                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-center">
                  <p className="text-xs text-destructive font-medium">{loginError}</p>
                </div>
              )}

              {!isTherapistAuth && (
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setLoginError(null);
                    setTherapyType("");
                    setSummaryFocus(["emotions", "thoughts", "behaviors", "changes"]);
                    setAcceptedPrivacy(false);
                    setTherapistCode("");
                  }}
                  className="w-full text-center text-sm text-primary hover:underline transition-colors pt-2"
                >
                  {isLogin 
                    ? (isRTL ? "עדיין אין חשבון? אפשר להירשם כאן" : "Don't have an account? Sign up here")
                    : (isRTL ? "כבר יש חשבון? אפשר להתחבר" : "Already have an account? Log in here")
                  }
                </button>
              )}
            </form>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 pt-4">
          <Link to="/app/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {t.nav.privacy}
          </Link>
          <div className="text-xs text-muted-foreground">
            {t.footer.copyright}
          </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
