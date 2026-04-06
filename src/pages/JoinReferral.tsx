import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Loader2, LogIn, ShieldCheck, UserRoundPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { buildAuthReferralPath } from "@/lib/referrals";

type ClaimStatus = "loading" | "needs-auth" | "claiming" | "success" | "error";

const JoinReferral = () => {
  const navigate = useNavigate();
  const { ref: routeReferralCode } = useParams<{ ref?: string }>();
  const [searchParams] = useSearchParams();
  const referralCode = routeReferralCode?.trim() ?? searchParams.get("ref")?.trim() ?? "";
  const [status, setStatus] = useState<ClaimStatus>(referralCode ? "loading" : "error");
  const [message, setMessage] = useState(referralCode ? "בודקים את ההזמנה שלך..." : "קישור ההזמנה אינו תקין.");

  const authHref = useMemo(
    () => buildAuthReferralPath(referralCode),
    [referralCode],
  );

  useEffect(() => {
    const claimInvite = async () => {
      if (!referralCode) {
        setStatus("error");
        setMessage("קישור ההזמנה אינו תקין.");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setStatus("needs-auth");
        setMessage("כדי להתחבר למטפל/ת צריך קודם להתחבר או להירשם.");
        return;
      }

      try {
        setStatus("claiming");
        setMessage("מחברים אותך למטפל/ת...");

        const { error } = await (supabase as any).rpc("claim_therapist_invite", {
          p_invite_code: referralCode,
        });

        if (error) throw error;

        setStatus("success");
        setMessage("החיבור למטפל/ת הושלם בהצלחה. אפשר להמשיך לדאשבורד שלך.");
      } catch (error: any) {
        setStatus("error");
        setMessage(error?.message ?? "לא הצלחנו להשלים את החיבור להזמנה.");
        toast({ title: "שגיאה בחיבור להזמנה", description: error?.message, variant: "destructive" });
      }
    };

    void claimInvite();
  }, [referralCode]);

  return (
    <div className="min-h-[100dvh] bg-background px-4 py-10" dir="rtl">
      <div className="mx-auto flex min-h-[80dvh] max-w-xl items-center justify-center">
        <Card className="w-full border-border/60 bg-card/95 shadow-elevated">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {status === "success" ? <CheckCircle2 className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
            </div>
            <CardTitle className="text-h1">הצטרפות דרך קישור מטפל/ת</CardTitle>
            <CardDescription>{message}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(status === "loading" || status === "claiming") && (
              <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                נא להמתין רגע
              </div>
            )}

            {status === "needs-auth" && (
              <div className="grid gap-3">
                <Button className="w-full rounded-full" onClick={() => navigate(authHref)}>
                  <LogIn className="h-4 w-4" />
                  התחברות / הרשמה
                </Button>
              </div>
            )}

            {status === "success" && (
              <Button className="w-full rounded-full" onClick={() => navigate("/app/dashboard")}> 
                <UserRoundPlus className="h-4 w-4" />
                מעבר לדאשבורד האישי
              </Button>
            )}

            {status === "error" && (
              <div className="grid gap-3">
                <Button variant="outline" className="w-full rounded-full" onClick={() => navigate("/app")}> 
                  חזרה למסך הבית
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JoinReferral;