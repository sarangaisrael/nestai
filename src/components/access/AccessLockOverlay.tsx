import { useState } from "react";
import { Loader2, LockKeyhole, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { AccessState } from "@/lib/accessControl";
import { useToast } from "@/hooks/use-toast";

type AccessLockOverlayProps = {
  accessState: AccessState;
  onRequestSubmitted?: () => Promise<void> | void;
};

const AccessLockOverlay = ({ accessState, onRequestSubmitted }: AccessLockOverlayProps) => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [contactName, setContactName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const amount = accessState.role === "therapist" ? 300 : 20;

  const handleSubmit = async () => {
    const trimmedName = contactName.trim();
    const trimmedMessage = message.trim();

    if (trimmedName.length > 120) {
      toast({ title: "השם ארוך מדי", variant: "destructive" });
      return;
    }

    if (trimmedMessage.length > 1000) {
      toast({ title: "ההודעה ארוכה מדי", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase as any).rpc("submit_payment_request", {
        p_contact_name: trimmedName || null,
        p_message: trimmedMessage || null,
      });

      if (error) throw error;

      toast({
        title: "בקשת התשלום נשלחה",
        description: "ניצור איתך קשר לתשלום דרך PayBox/Bit.",
      });
      setShowForm(false);
      setMessage("");
      if (onRequestSubmitted) {
        await onRequestSubmitted();
      }
    } catch (error: any) {
      toast({
        title: "לא הצלחנו לשלוח את הבקשה",
        description: error?.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/95 px-4 backdrop-blur-sm">
      <Card className="w-full max-w-lg space-y-5 rounded-3xl border-border bg-card p-6 shadow-card">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-foreground">הגישה לחשבון נעולה</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {accessState.lock_message || "הגישה לחשבון מוגבלת כרגע."}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <p>
            {accessState.role === "therapist"
              ? `כדי להפעיל מחדש את החשבון יש לחדש גישה שנתית בעלות ${amount} ש״ח.`
              : `כדי להפעיל מחדש את החשבון יש להסדיר גישה בעלות ${amount} ש״ח.`}
          </p>
          {accessState.covered_by_therapist && (
            <p className="mt-2 text-foreground">החשבון אמור להיות מכוסה על ידי המטפל/ת שלך ברגע שהמנוי שלו/ה יופעל מחדש.</p>
          )}
        </div>

        {accessState.can_submit_payment_request ? (
          <div className="space-y-4">
            {!showForm ? (
              <Button className="w-full rounded-full" onClick={() => setShowForm(true)}>
                בקשה לתשלום דרך PayBox / Bit
              </Button>
            ) : (
              <div className="space-y-4 rounded-2xl border border-border bg-background p-4">
                <div className="space-y-1.5">
                  <Label htmlFor="payment-request-name">שם מלא</Label>
                  <Input
                    id="payment-request-name"
                    value={contactName}
                    onChange={(event) => setContactName(event.target.value)}
                    placeholder="איך נזהה אותך"
                    maxLength={120}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="payment-request-message">הודעה לאדמין</Label>
                  <Textarea
                    id="payment-request-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="למשל: אשמח להסדיר תשלום דרך Bit"
                    maxLength={1000}
                    className="min-h-[110px]"
                  />
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button className="flex-1 rounded-full" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "שלח בקשת תשלום"}
                  </Button>
                  <Button type="button" variant="outline" className="flex-1 rounded-full" onClick={() => setShowForm(false)} disabled={submitting}>
                    חזרה
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-foreground">
            הגישה שלך תלויה במטפל/ת המקושר/ת. יש ליצור קשר עם המטפל/ת כדי לחדש את גישת NestAI.
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground">
          לשאלות או עזרה:{" "}
          <a
            href="https://wa.me/9720537000277"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            שלחו הודעה בוואטסאפ
          </a>
        </p>

        <Button
          type="button"
          variant="ghost"
          className="w-full rounded-full text-muted-foreground"
          onClick={async () => {
            await supabase.auth.signOut();
          }}
        >
          <LogOut className="h-4 w-4" />
          התנתקות
        </Button>
      </Card>
    </div>
  );
};

export default AccessLockOverlay;