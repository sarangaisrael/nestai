import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowLeft, Shield, TrendingDown, Brain, Loader2, Stethoscope, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { isApprovedTherapist } from "@/lib/userRoles";
import { z } from "zod";
import nestLogo from "@/assets/nestai-logo-full.png";

const therapistSignupSchema = z.object({
  fullName: z.string().trim().min(2, "יש להזין שם מלא").max(120, "השם ארוך מדי"),
  email: z.string().trim().email("אימייל לא תקין").max(255, "האימייל ארוך מדי"),
  password: z.string().min(8, "סיסמה חייבת להכיל לפחות 8 תווים").max(128, "הסיסמה ארוכה מדי"),
  confirmPassword: z.string(),
  specialization: z.string().trim().min(2, "יש להזין תחום התמחות").max(120, "תחום ההתמחות ארוך מדי"),
  yearsOfExperience: z.coerce.number().int().min(0, "יש להזין מספר תקין").max(80, "יש להזין מספר תקין"),
  licenseNumber: z.string().trim().max(80, "מספר הרישיון ארוך מדי").optional().or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
  message: "הסיסמאות אינן תואמות",
  path: ["confirmPassword"],
});

type TherapistSignupForm = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  specialization: string;
  yearsOfExperience: string;
  licenseNumber: string;
};

type TherapistApplicationStatus = "idle" | "pending" | "approved" | "rejected";

const defaultFormState: TherapistSignupForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  specialization: "",
  yearsOfExperience: "",
  licenseNumber: "",
};

const stats = [
  { icon: TrendingDown, value: "עד 40%", label: "מהמטופלים נושרים בשלבים מוקדמים — Nest AI עוזר לך לשמור על הקשר ולחזק את ההמשכיות הטיפולית", color: "text-destructive" },
  { icon: Brain, value: "גשר נרטיבי", label: "בין פגישה לפגישה — ללא התערבות קלינית", color: "text-primary" },
  { icon: Shield, value: "אפס התערבות", label: "אנחנו מעצימים את המטפל/ת, לא מחליפים", color: "text-secondary" },
];

const ProfessionalIntro = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [canAccessDashboard, setCanAccessDashboard] = useState(false);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [form, setForm] = useState<TherapistSignupForm>(defaultFormState);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof TherapistSignupForm, string>>>({});
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<TherapistApplicationStatus>("idle");

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCanAccessDashboard(false);
        setSessionUserId(null);
        setLoadingAccess(false);
        return;
      }

      try {
        setSessionUserId(session.user.id);

        const [approved, registrationResult] = await Promise.all([
          isApprovedTherapist(session.user.id),
          supabase
            .from("therapist_registrations")
            .select("full_name, email, specialization, years_of_experience, license_number, status")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        setCanAccessDashboard(approved);

        if (registrationResult.error) {
          throw registrationResult.error;
        }

        const registration = registrationResult.data;
        if (registration) {
          setForm((prev) => ({
            ...prev,
            fullName: registration.full_name ?? "",
            email: registration.email ?? session.user.email ?? "",
            specialization: registration.specialization ?? "",
            yearsOfExperience: registration.years_of_experience?.toString() ?? "",
            licenseNumber: registration.license_number ?? "",
          }));
          setApplicationStatus((registration.status as TherapistApplicationStatus | null) ?? "pending");
        } else {
          setForm((prev) => ({ ...prev, email: session.user.email ?? prev.email }));
          setApplicationStatus(approved ? "approved" : "idle");
        }
      } catch {
        setCanAccessDashboard(false);
      } finally {
        setLoadingAccess(false);
      }
    };

    void checkAccess();
  }, []);

  const handleFormChange = (field: keyof TherapistSignupForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmitApplication = async () => {
    setSubmitMessage(null);

    // When already logged in, skip password validation
    const formToValidate = sessionUserId
      ? { ...form, password: "placeholder1", confirmPassword: "placeholder1" }
      : form;
    const parsed = therapistSignupSchema.safeParse(formToValidate);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setFormErrors({
        fullName: fieldErrors.fullName?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
        specialization: fieldErrors.specialization?.[0],
        yearsOfExperience: fieldErrors.yearsOfExperience?.[0],
        licenseNumber: fieldErrors.licenseNumber?.[0],
      });
      return;
    }

    setSubmitting(true);

    try {
      const payload = parsed.data;
      let userId = sessionUserId;

      // If not logged in, create account first
      if (!userId) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: payload.email,
          password: payload.password,
          options: { emailRedirectTo: window.location.origin + "/app/professional/intro" },
        });

        if (signUpError) {
          if (signUpError.message?.toLowerCase().includes("already registered")) {
            throw new Error("כבר קיים חשבון עם האימייל הזה. נסו להתחבר במקום להירשם.");
          }
          throw signUpError;
        }

        if (!signUpData.user) {
          throw new Error("לא הצלחנו ליצור חשבון. נסו שוב.");
        }

        userId = signUpData.user.id;
        setSessionUserId(userId);
      }

      // Submit therapist registration
      const { data, error } = await (supabase as any).rpc("submit_therapist_registration", {
        p_full_name: payload.fullName,
        p_email: payload.email,
        p_specialization: payload.specialization,
        p_years_of_experience: payload.yearsOfExperience,
        p_license_number: payload.licenseNumber || null,
      });

      if (error) throw error;

      const result = Array.isArray(data) ? data[0] : data;
      const nextStatus = (result?.status as TherapistApplicationStatus | undefined) ?? "pending";

      setApplicationStatus(nextStatus);
      setCanAccessDashboard(nextStatus === "approved");
      const msg = nextStatus === "approved"
        ? "החשבון שלך כבר מאושר, ואפשר להיכנס לדאשבורד המטפלים."
        : "✅ החשבון נוצר והבקשה נשלחה בהצלחה! ממתינים לאישור אדמין. בדקו את תיבת המייל לאימות.";
      setSubmitMessage(msg);
      toast({
        title: nextStatus === "approved" ? "✅ החשבון מאושר" : "✅ נרשמת בהצלחה",
        description: msg,
      });
    } catch (error: any) {
      setSubmitMessage(error?.message ?? "אירעה שגיאה בשליחת הבקשה.");
    } finally {
      setSubmitting(false);
    }
  };

  const statusConfig = {
    idle: { label: "עדיין לא נשלחה בקשה", className: "bg-muted text-muted-foreground" },
    pending: { label: "הבקשה ממתינה לאישור", className: "bg-primary/10 text-primary" },
    approved: { label: "החשבון אושר", className: "bg-secondary/15 text-secondary" },
    rejected: { label: "הבקשה נדחתה — אפשר לעדכן ולשלוח מחדש", className: "bg-destructive/10 text-destructive" },
  } as const;

  const currentStatus = statusConfig[applicationStatus];
  const handleTherapistAccessClick = () => {
    if (canAccessDashboard) {
      navigate("/app/professional/dashboard");
      return;
    }

    if (!sessionUserId) {
      navigate("/app/auth?mode=therapist&next=/app/professional/dashboard");
      return;
    }

    setSubmitMessage("החשבון עדיין לא אושר. אחרי אישור אדמין הכניסה תיפתח אוטומטית לדאשבורד המטפלים.");
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col" dir="rtl">
      {/* Sticky Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-border/30">
          <button onClick={() => navigate("/app")} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-foreground rotate-180" />
          </button>
          <img src={nestLogo} alt="NestAI" className="h-8 object-contain" />
          <div className="w-9" />
        </div>
      </div>
      <div style={{ height: "calc(env(safe-area-inset-top, 0px) + 56px)" }} />

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-4 mb-10 max-w-md"
        >
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            Nest AI מגשר על הפער<br />בין הפגישות
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            פלטפורמה שמעצימה את התהליך הטיפולי דרך איסוף נרטיבי חכם, ניטור מגמות רגשיות וסיכומים שבועיים אוטומטיים — בגישת אפס התערבות קלינית.
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="w-full max-w-md space-y-3 mb-10">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-base font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
          className="w-full max-w-md space-y-3"
        >
          <Button
            onClick={handleTherapistAccessClick}
            className="w-full py-5 rounded-full shadow-lg"
            size="lg"
            disabled={loadingAccess}
          >
            {loadingAccess ? <Loader2 className="h-4 w-4 animate-spin" /> : canAccessDashboard ? "כניסה לדאשבורד מטפלים" : "כניסה למטפלים מאושרים"}
          </Button>
          <Button
            onClick={() => navigate("/app/professional/demo")}
            className="w-full py-5 rounded-full"
            size="lg"
            variant="outline"
          >
            צפו בדמו אינטראקטיבי
          </Button>
          {!canAccessDashboard && !loadingAccess && (
            <p className="text-center text-xs text-muted-foreground">
              הגישה לדאשבורד פעילה רק למטפלים מומחים שקיבלו אישור ידני.
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.05, duration: 0.45 }}
          className="w-full max-w-md mt-6"
        >
          <Card className="p-5 space-y-4 border border-border bg-card/95 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />הרשמת מטפלים
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  מלא/י את הפרטים ונשלח בקשה לאישור מנהל המערכת.
                </p>
              </div>
              <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${currentStatus.className}`}>
                {currentStatus.label}
              </span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="therapist-full-name">שם מלא</Label>
                <Input
                  id="therapist-full-name"
                  value={form.fullName}
                  onChange={(e) => handleFormChange("fullName", e.target.value)}
                  placeholder="ישראל ישראלי"
                />
                {formErrors.fullName && <p className="text-xs text-destructive">{formErrors.fullName}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="therapist-email">אימייל מקצועי</Label>
                <Input
                  id="therapist-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  placeholder="therapist@example.com"
                  dir="ltr"
                />
                {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
              </div>

              {!sessionUserId && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="therapist-password">סיסמה</Label>
                    <Input
                      id="therapist-password"
                      type="password"
                      value={form.password}
                      onChange={(e) => handleFormChange("password", e.target.value)}
                      placeholder="לפחות 8 תווים"
                      dir="ltr"
                    />
                    {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="therapist-confirm-password">אימות סיסמה</Label>
                    <Input
                      id="therapist-confirm-password"
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) => handleFormChange("confirmPassword", e.target.value)}
                      placeholder="הזינו שוב את הסיסמה"
                      dir="ltr"
                    />
                    {formErrors.confirmPassword && <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>}
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="therapist-specialization">תחום התמחות</Label>
                <Textarea
                  id="therapist-specialization"
                  value={form.specialization}
                  onChange={(e) => handleFormChange("specialization", e.target.value)}
                  placeholder="למשל: פסיכותרפיה דינמית, CBT, טיפול זוגי"
                  className="min-h-[88px]"
                />
                {formErrors.specialization && <p className="text-xs text-destructive">{formErrors.specialization}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="therapist-years">שנות ניסיון</Label>
                  <Input
                    id="therapist-years"
                    type="number"
                    min="0"
                    max="80"
                    inputMode="numeric"
                    value={form.yearsOfExperience}
                    onChange={(e) => handleFormChange("yearsOfExperience", e.target.value)}
                    placeholder="8"
                  />
                  {formErrors.yearsOfExperience && <p className="text-xs text-destructive">{formErrors.yearsOfExperience}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="therapist-license">מספר רישיון (אופציונלי)</Label>
                  <Input
                    id="therapist-license"
                    value={form.licenseNumber}
                    onChange={(e) => handleFormChange("licenseNumber", e.target.value)}
                    placeholder="1234567"
                  />
                  {formErrors.licenseNumber && <p className="text-xs text-destructive">{formErrors.licenseNumber}</p>}
                </div>
              </div>
            </div>

            {submitMessage && (
              <div className={`rounded-xl border px-3 py-2 text-xs ${applicationStatus === "approved" ? "border-secondary/20 bg-secondary/10 text-secondary" : applicationStatus === "rejected" ? "border-destructive/20 bg-destructive/10 text-destructive" : "border-primary/20 bg-primary/5 text-foreground"}`}>
                {submitMessage}
              </div>
            )}

            <Button
              onClick={handleSubmitApplication}
              className="w-full rounded-full"
              disabled={submitting || loadingAccess}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : sessionUserId
                ? (applicationStatus === "rejected" ? "עדכן ושלח מחדש" : "שלח בקשת הרשמה")
                : "צור חשבון ושלח בקשה"}
            </Button>

            {sessionUserId && !loadingAccess && (
              <p className="text-center text-xs text-muted-foreground">
                מחובר/ת כרגע. הסיסמה לא נדרשת.
              </p>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfessionalIntro;
