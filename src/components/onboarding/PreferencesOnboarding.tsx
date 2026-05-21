import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

export const PreferencesOnboarding = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [therapyType, setTherapyType] = useState<string>("");
  const [summaryFocus, setSummaryFocus] = useState<string[]>([
    "emotions",
    "thoughts",
    "behaviors",
    "changes",
  ]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    checkUserPreferences();
  }, []);

  const checkUserPreferences = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: preferences } = await supabase
        .from("user_preferences")
        .select("therapy_type, summary_focus")
        .eq("user_id", user.id)
        .maybeSingle();

      // Show dialog if user doesn't have therapy_type set (legacy users)
      if (!preferences || preferences.therapy_type === null) {
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Error checking preferences:", error);
    }
  };

  const toggleFocus = (focus: string) => {
    setSummaryFocus((prev) =>
      prev.includes(focus) ? prev.filter((f) => f !== focus) : [...prev, focus]
    );
  };

  const handleSave = async () => {
    if (summaryFocus.length === 0) {
      toast({
        title: "שגיאה",
        description: "חובה לבחור לפחות תחום התמקדות אחד",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("user_preferences")
        .upsert(
          {
            user_id: user.id,
            therapy_type: therapyType || null,
            summary_focus: summaryFocus,
          },
          {
            onConflict: "user_id",
          }
        );

      toast({
        title: "העדפות נשמרו",
        description: "ההעדפות שלך עודכנו בהצלחה",
      });

      setIsOpen(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: "שגיאה",
        description: "לא הצלחנו לשמור את ההעדפות",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px] bg-background border-border" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            בואו נתאים את הסיכומים בשבילך
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            כמה שאלות קצרות שיעזרו לנו ליצור סיכום שבועי מותאם אישית
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Therapy Type */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              באיזה סוג טיפול את/ה נמצא/ת? (אופציונלי)
            </Label>
            <RadioGroup
              value={therapyType}
              onValueChange={setTherapyType}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2 space-x-reverse p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                <RadioGroupItem value="cbt" id="pref-cbt" />
                <Label
                  htmlFor="pref-cbt"
                  className="text-sm cursor-pointer flex-1 text-right"
                >
                  CBT (טיפול קוגניטיבי התנהגותי)
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                <RadioGroupItem value="psychodynamic" id="pref-psychodynamic" />
                <Label
                  htmlFor="pref-psychodynamic"
                  className="text-sm cursor-pointer flex-1 text-right"
                >
                  פסיכודינמי
                </Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer">
                <RadioGroupItem value="other" id="pref-other" />
                <Label
                  htmlFor="pref-other"
                  className="text-sm cursor-pointer flex-1 text-right"
                >
                  אחר
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Summary Focus */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">
              על מה הסיכום השבועי יתמקד? (חובה)
            </Label>
            <div className="space-y-2">
              {[
                { value: "emotions", label: "רגשות" },
                { value: "thoughts", label: "מחשבות" },
                { value: "behaviors", label: "התנהגויות" },
                { value: "changes", label: "שינויים" },
              ].map(({ value, label }) => (
                <div
                  key={value}
                  className="flex items-center space-x-2 space-x-reverse p-3 border border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleFocus(value);
                  }}
                >
                  <Checkbox
                    id={`pref-focus-${value}`}
                    checked={summaryFocus.includes(value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Label
                    htmlFor={`pref-focus-${value}`}
                    className="text-sm cursor-pointer flex-1 text-right"
                  >
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "שומר..." : "שמור העדפות"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
