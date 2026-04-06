import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AccessState } from "@/lib/accessControl";

type TrialStatusCardProps = {
  accessState: AccessState;
  className?: string;
};

const BILLING_CUTOFF = new Date("2026-03-22T23:59:59+02:00");
const DAY_IN_MS = 1000 * 60 * 60 * 24;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const TrialStatusCard = ({ accessState, className }: TrialStatusCardProps) => {
  const { isRTL } = useLanguage();
  const locale = isRTL ? "he-IL" : "en-US";
  const now = Date.now();
  const registrationDate = new Date(accessState.registration_date);
  const trialEndsAt = new Date(accessState.trial_ends_at);
  const isGrandfathered = registrationDate <= BILLING_CUTOFF;

  if (isGrandfathered) {
    return null;
  }

  const totalDays = Math.max(1, Math.ceil((trialEndsAt.getTime() - registrationDate.getTime()) / DAY_IN_MS));
  const elapsedDays = clamp(Math.ceil((now - registrationDate.getTime()) / DAY_IN_MS), 0, totalDays);
  const remainingDays = Math.max(0, Math.ceil((trialEndsAt.getTime() - now) / DAY_IN_MS));
  const progressValue =
    accessState.effective_payment_status === "trial"
      ? clamp((elapsedDays / totalDays) * 100, 0, 100)
      : 100;

  const formatDate = (value: Date) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(value);

  const roleLabel = isRTL
    ? accessState.role === "therapist"
      ? "מטפל/ת"
      : "מטופל/ת"
    : accessState.role === "therapist"
      ? "Therapist"
      : "Patient";

  const copy = (() => {
    if (isGrandfathered) {
      return {
        badge: isRTL ? "Premium ותיק" : "Legacy Premium",
        badgeVariant: "secondary" as const,
        title: isRTL ? "החשבון שלך נשאר פעיל ללא הגבלת ניסיון" : "Your account stays active with no trial limit",
        description: isRTL
          ? "נרשמת לפני הפעלת מודל התשלום, ולכן הגישה שלך נשארת פעילה ולא חלה עליך נעילת תשלום."
          : "You registered before billing went live, so your access stays active and payment locking does not apply to you.",
        footer:
          accessState.role === "therapist"
            ? isRTL
              ? "כל עוד החשבון שלך פעיל, מטופלים שמקושרים אליך ממשיכים לקבל גישה מלאה בחינם."
              : "As long as your account stays active, linked patients continue to receive full access for free."
            : isRTL
              ? "החשבון שלך מסומן כפרימיום ותיק ולא ייכנס למסלול התשלום החדש."
              : "Your account is marked as legacy premium and won’t enter the new billing flow.",
      };
    }

    if (accessState.covered_by_therapist && accessState.effective_payment_status === "active") {
      return {
        badge: isRTL ? "מכוסה על ידי מטפל/ת" : "Covered by therapist",
        badgeVariant: "secondary" as const,
        title: isRTL ? "הגישה שלך פעילה ללא תשלום" : "Your access is active at no cost",
        description: isRTL
          ? "המטפל/ת שאליו/ה את/ה מקושר/ת פעיל/ה, ולכן החשבון שלך פתוח במלואו ללא חיוב."
          : "Your linked therapist is active, so your account remains fully unlocked at no charge.",
        footer: isRTL
          ? "אם סטטוס המטפל/ת ישתנה בהמשך, הגישה שלך תחזור להישען על תקופת הניסיון או על חידוש ידני."
          : "If the therapist’s status changes later, your access will fall back to trial or manual renewal logic.",
      };
    }

    if (accessState.effective_payment_status === "active") {
      return {
        badge: isRTL ? "פעיל" : "Active",
        badgeVariant: "default" as const,
        title: isRTL ? "החשבון שלך פעיל" : "Your account is active",
        description:
          accessState.role === "therapist"
            ? isRTL
              ? "הגישה שלך מחודשת, והמטופלים שמקושרים אליך נהנים גם הם מגישה מלאה."
              : "Your access is renewed, and linked patients also receive full access."
            : isRTL
              ? "הגישה שלך חודשה והחשבון פתוח לשימוש מלא."
              : "Your access has been renewed and the account is fully unlocked.",
        footer: isRTL
          ? "אין כרגע צורך בפעולה נוספת."
          : "No further action is needed right now.",
      };
    }

    if (accessState.effective_payment_status === "locked") {
      return {
        badge: isRTL ? "נעול" : "Locked",
        badgeVariant: "destructive" as const,
        title: isRTL ? "תקופת הניסיון הסתיימה" : "Your trial has ended",
        description:
          accessState.lock_message ||
          (isRTL ? "הגישה לחשבון נעולה עד להסדרת התשלום." : "Your account is locked until payment is arranged."),
        footer: isRTL ? "אפשר להמשיך לאחר חידוש הגישה." : "You can continue after renewing access.",
      };
    }

    return {
      badge: isRTL ? "ניסיון" : "Trial",
      badgeVariant: "outline" as const,
      title: isRTL ? `נשארו ${remainingDays} ימים לניסיון` : `${remainingDays} trial days left`,
      description:
        accessState.role === "therapist"
          ? isRTL
            ? "בסיום 30 הימים תתבקש/י לשלוח בקשת תשלום כדי להמשיך, וכל המטופלים שלך יכוסו ברגע שהחשבון יופעל."
            : "After 30 days you’ll need to submit a payment request to continue, and your patients will be covered once your account is activated."
          : isRTL
            ? "בסיום 30 הימים החשבון יעבור למסלול נעילה או כיסוי דרך מטפל/ת מקושר/ת, בהתאם לסטטוס שלך."
            : "After 30 days your account will move into lock or therapist-covered access, depending on your status.",
      footer: isRTL ? "מומלץ להסדיר גישה לפני סוף תקופת הניסיון." : "It’s best to arrange access before the trial ends.",
    };
  })();

  return (
    <Card className={className}>
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{roleLabel}</div>
            <h3 className="text-lg font-semibold text-foreground">{copy.title}</h3>
            <p className="text-sm leading-6 text-muted-foreground">{copy.description}</p>
          </div>
          <Badge variant={copy.badgeVariant} className="w-fit rounded-full px-3 py-1">
            {copy.badge}
          </Badge>
        </div>

        {accessState.effective_payment_status === "trial" && remainingDays <= 3 && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {isRTL
              ? `⚠️ נשארו ${remainingDays} ימים בלבד! הגישה תינעל בסיום תקופת הניסיון.`
              : `⚠️ Only ${remainingDays} days left! Access will be locked when the trial ends.`}
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{isRTL ? `יום ${Math.max(elapsedDays, 0)} מתוך ${totalDays}` : `Day ${Math.max(elapsedDays, 0)} of ${totalDays}`}</span>
            <span>{isRTL ? `סיום ניסיון: ${formatDate(trialEndsAt)}` : `Trial ends: ${formatDate(trialEndsAt)}`}</span>
          </div>
          <Progress value={progressValue} className="h-2.5 bg-muted" />
        </div>

        <div className="grid gap-3 rounded-2xl border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">{isRTL ? "תאריך הרשמה" : "Registration date"}</div>
            <div className="mt-1 font-medium text-foreground">{formatDate(registrationDate)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">{isRTL ? "סטטוס גישה" : "Access status"}</div>
            <div className="mt-1 font-medium text-foreground">{copy.badge}</div>
          </div>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">{copy.footer}</p>

        <p className="text-sm text-muted-foreground">
          {isRTL ? "להסדרת תשלום או שאלות: " : "For payment or questions: "}
          <a
            href="https://wa.me/9720537000277"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {isRTL ? "שלחו הודעה בוואטסאפ" : "Message us on WhatsApp"}
          </a>
        </p>
      </CardContent>
    </Card>
  );
};

export default TrialStatusCard;