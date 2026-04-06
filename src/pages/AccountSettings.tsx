import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, Shield, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import AddToHomeBanner from "@/components/AddToHomeBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/AppHeader";
import BackButton from "@/components/BackButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AccountSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, dir, isRTL } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [therapyType, setTherapyType] = useState<string>("");
  const [summaryFocus, setSummaryFocus] = useState<string[]>(["emotions", "thoughts", "behaviors", "changes"]);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const focusLabels: Record<string, Record<string, string>> = {
    he: { emotions: "רגשות", thoughts: "מחשבות", behaviors: "התנהגויות", changes: "שינויים" },
    en: { emotions: "Emotions", thoughts: "Thoughts", behaviors: "Behaviors", changes: "Changes" }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/app/auth");
        return;
      }
      setUser(session.user);
      loadPreferences(session.user.id);
    });
  }, [navigate]);

  const loadPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_preferences")
        .select("therapy_type, summary_focus")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setTherapyType(data.therapy_type || "");
        setSummaryFocus(data.summary_focus || ["emotions", "thoughts", "behaviors", "changes"]);
      }
    } catch (error: any) {
      console.error("Error loading preferences:", error);
      toast({
        title: t.errors.somethingWentWrong,
        description: t.settings.saveError,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    if (summaryFocus.length === 0) {
      toast({
        title: t.errors.somethingWentWrong,
        description: isRTL ? "חובה לבחור לפחות תחום התמקדות אחד לסיכום" : "You must select at least one focus area",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        therapy_type: therapyType || null,
        summary_focus: summaryFocus,
      }, {
        onConflict: 'user_id'
      });

      if (error) throw error;

      toast({
        title: t.settings.saveSuccess,
        description: t.settings.saveSuccess,
      });
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast({
        title: t.errors.somethingWentWrong,
        description: t.settings.saveError,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      toast({
        title: t.errors.somethingWentWrong,
        description: isRTL ? "יש למלא את כל השדות" : "Please fill all fields",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: t.errors.somethingWentWrong,
        description: isRTL ? "הסיסמאות לא תואמות" : "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t.errors.somethingWentWrong,
        description: t.auth.passwordMinLength,
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (verifyError) {
        toast({
          title: t.errors.somethingWentWrong,
          description: isRTL ? "הסיסמה הנוכחית שגויה" : "Current password is incorrect",
          variant: "destructive",
        });
        setChangingPassword(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: t.settings.saveSuccess,
        description: isRTL ? "הסיסמה שונתה בהצלחה" : "Password changed successfully",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast({
        title: t.errors.somethingWentWrong,
        description: error.message || t.settings.saveError,
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const toggleFocus = (focus: string) => {
    setSummaryFocus(prev => 
      prev.includes(focus) 
        ? prev.filter(f => f !== focus)
        : [...prev, focus]
    );
  };

  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/app/auth");
        return;
      }

      const { error } = await supabase.functions.invoke("delete-account");

      if (error) throw error;

      await supabase.auth.signOut();
      navigate("/app", { replace: true });
      toast({
        title: isRTL ? "החשבון נמחק" : "Account deleted",
        description: isRTL ? "כל הנתונים שלך נמחקו בהצלחה" : "All your data has been successfully deleted",
      });
    } catch (error: any) {
      console.error("Delete account error:", error);
      toast({
        title: t.errors.somethingWentWrong,
        description: isRTL ? "שגיאה במחיקת החשבון. נסה שוב." : "Error deleting account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const lang = isRTL ? 'he' : 'en';

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground text-lg">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      <AppHeader />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <BackButton />
        <AddToHomeBanner />
        <div className="space-y-2 mb-6">
          <h1 className="text-[24px] font-semibold text-foreground">{t.settings.accountSettings}</h1>
          <p className="text-[16px] text-muted-foreground">
            {isRTL ? "נהל את פרטי החשבון שלך" : "Manage your account details"}
          </p>
        </div>

        {/* Password Change Card */}
        <div className="bg-card rounded-[20px] p-6 border border-border space-y-6 animate-slide-up">
          <div className="space-y-2">
            <h2 className="text-[20px] font-semibold text-foreground">
              {isRTL ? "שינוי סיסמה" : "Change Password"}
            </h2>
            <p className="text-[16px] text-muted-foreground">
              {isRTL ? "אפשר לשנות את הסיסמה לחשבון" : "You can change your account password"}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[15px] font-medium text-foreground block">
                {isRTL ? "סיסמה נוכחית" : "Current Password"}
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-12 rounded-[14px] text-[16px]"
                placeholder={isRTL ? "הזן סיסמה נוכחית" : "Enter current password"}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[15px] font-medium text-foreground block">
                {isRTL ? "סיסמה חדשה" : "New Password"}
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-12 rounded-[14px] text-[16px]"
                placeholder={isRTL ? "הזן סיסמה חדשה" : "Enter new password"}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[15px] font-medium text-foreground block">
                {isRTL ? "אישור סיסמה" : "Confirm Password"}
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 rounded-[14px] text-[16px]"
                placeholder={isRTL ? "הזן שוב סיסמה חדשה" : "Confirm new password"}
                dir="ltr"
              />
            </div>
          </div>

          <Button
            onClick={handlePasswordChange}
            disabled={changingPassword}
            className="w-full h-12 text-[16px] rounded-[14px]"
          >
            {changingPassword 
              ? t.common.loading 
              : (isRTL ? "שנה סיסמה" : "Change Password")
            }
          </Button>
        </div>

        {/* Therapy Type Card */}
        <div className="bg-card rounded-[20px] p-6 border border-border space-y-6 animate-slide-up">
          <div className="space-y-2">
            <h2 className="text-[20px] font-semibold text-foreground">
              {isRTL ? "סוג הטיפול" : "Therapy Type"}
            </h2>
            <p className="text-[16px] text-muted-foreground">
              {t.auth.therapyTypeLabel}
            </p>
          </div>

          <RadioGroup value={therapyType} onValueChange={setTherapyType} className="space-y-3">
            <div className={`flex items-center gap-2 p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer ${isRTL ? '' : 'flex-row-reverse'}`}>
              <Label htmlFor="account-cbt" className={`text-[16px] cursor-pointer flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.dashboard.cbt}
              </Label>
              <RadioGroupItem value="cbt" id="account-cbt" />
            </div>
            <div className={`flex items-center gap-2 p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer ${isRTL ? '' : 'flex-row-reverse'}`}>
              <Label htmlFor="account-psychodynamic" className={`text-[16px] cursor-pointer flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {t.dashboard.psychodynamic}
              </Label>
              <RadioGroupItem value="psychodynamic" id="account-psychodynamic" />
            </div>
            <div className={`flex items-center gap-2 p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer ${isRTL ? '' : 'flex-row-reverse'}`}>
              <Label htmlFor="account-other" className={`text-[16px] cursor-pointer flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? "אחר" : "Other"}
              </Label>
              <RadioGroupItem value="other" id="account-other" />
            </div>
            <div className={`flex items-center gap-2 p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer ${isRTL ? '' : 'flex-row-reverse'}`}>
              <Label htmlFor="account-none" className={`text-[16px] cursor-pointer flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                {isRTL ? "אין / לא רלוונטי" : "None / Not applicable"}
              </Label>
              <RadioGroupItem value="" id="account-none" />
            </div>
          </RadioGroup>
        </div>

        {/* Summary Focus Card */}
        <div className="bg-card rounded-[20px] p-6 border border-border space-y-6 animate-slide-up">
          <div className="space-y-2">
            <h2 className="text-[20px] font-semibold text-foreground">
              {isRTL ? "התמקדות הסיכום" : "Summary Focus"}
            </h2>
            <p className="text-[16px] text-muted-foreground">
              {t.auth.summaryFocusLabel}
            </p>
          </div>

          <div className="space-y-3">
            {["emotions", "thoughts", "behaviors", "changes"].map((value) => (
              <div 
                key={value}
                className={`flex items-center gap-2 p-4 border border-border rounded-lg hover:border-primary transition-colors cursor-pointer ${isRTL ? '' : 'flex-row-reverse'}`}
                onClick={() => toggleFocus(value)}
              >
                <Label htmlFor={`account-focus-${value}`} className={`text-[16px] cursor-pointer flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {focusLabels[lang][value]}
                </Label>
                <Checkbox
                  id={`account-focus-${value}`}
                  checked={summaryFocus.includes(value)}
                  onCheckedChange={() => toggleFocus(value)}
                />
              </div>
            ))}
          </div>

          <p className="text-[14px] text-muted-foreground bg-muted/30 rounded-[14px] p-3 border border-border/50">
            {isRTL ? "חובה לבחור לפחות אחד" : "You must select at least one"}
          </p>

          <Button
            onClick={handleSavePreferences}
            disabled={saving}
            className="w-full h-12 text-[16px] rounded-[14px]"
          >
            <Save className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {saving ? t.common.loading : t.common.save}
          </Button>
        </div>

        {/* Delete Account */}
        <div className="bg-card rounded-[20px] p-6 border border-destructive/30 space-y-4 animate-slide-up">
          <div className="space-y-2">
            <h2 className="text-[20px] font-semibold text-destructive">
              {isRTL ? "מחיקת חשבון" : "Delete Account"}
            </h2>
            <p className="text-[14px] text-muted-foreground">
              {isRTL 
                ? "פעולה זו תמחק את כל הנתונים שלך לצמיתות — הודעות, סיכומים, העדפות ועוד. לא ניתן לשחזר את המידע לאחר המחיקה."
                : "This will permanently delete all your data — messages, summaries, preferences, and more. This action cannot be undone."
              }
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-12 text-[16px] rounded-[14px] border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {isRTL ? "מחק את החשבון שלי" : "Delete My Account"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent dir={dir}>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-destructive">
                  {isRTL ? "אתה בטוח?" : "Are you sure?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isRTL
                    ? "כל הנתונים שלך יימחקו לצמיתות ולא יהיה ניתן לשחזר אותם. פעולה זו בלתי הפיכה."
                    : "All your data will be permanently deleted and cannot be recovered. This action is irreversible."
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className={isRTL ? "flex-row-reverse gap-2" : ""}>
                <AlertDialogCancel>
                  {isRTL ? "ביטול" : "Cancel"}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting
                    ? (isRTL ? "מוחק..." : "Deleting...")
                    : (isRTL ? "כן, מחק את החשבון" : "Yes, delete account")
                  }
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Privacy Link */}
        <div className="pt-6 border-t border-border">
          <Link 
            to="/app/privacy" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Shield className="h-4 w-4" />
            <span className="text-sm">{t.nav.privacy}</span>
          </Link>
        </div>

        <div className="text-center py-6 space-y-2">
          <Link to="/app/support" className="text-sm text-primary hover:underline">
            {isRTL ? "עזרה ותמיכה" : "Help & Support"}
          </Link>
          <p className="text-xs text-muted-foreground/60">{t.footer.copyright}</p>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;