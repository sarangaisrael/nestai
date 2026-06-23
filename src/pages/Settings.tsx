import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";


import AddToHomeBanner from "@/components/AddToHomeBanner";
import { useLanguage } from "@/contexts/LanguageContext";
import AppHeader from "@/components/AppHeader";
import BackButton from "@/components/BackButton";
import { Heart } from "lucide-react";
import PushNotificationSettings from "@/components/PushNotificationSettings";
import { scheduleDailyReminder, scheduleSleepReminder, cancelSleepReminder, isNativeApp } from "@/lib/pushNotifications";


const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, dir, isRTL } = useLanguage();
  
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [summaryEnabled, setSummaryEnabled] = useState(true);
  const [summaryDay, setSummaryDay] = useState("saturday");
  const [summaryTime, setSummaryTime] = useState("20:00");
  const [dailyReminderTime, setDailyReminderTime] = useState("21:00");
  const [sleepReminderEnabled, setSleepReminderEnabled] = useState(true);
  const [sleepReminderTime, setSleepReminderTime] = useState("07:30");



  const dayLabels: Record<string, string> = {
    sunday: t.settings.sunday,
    monday: t.settings.monday,
    tuesday: t.settings.tuesday,
    wednesday: t.settings.wednesday,
    thursday: t.settings.thursday,
    friday: t.settings.friday,
    saturday: t.settings.saturday,
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
        .select("weekly_summary_enabled, summary_day, summary_time, daily_reminder_time, sleep_reminder_enabled, sleep_reminder_time")
        .eq("user_id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSummaryEnabled(data.weekly_summary_enabled ?? true);
        setSummaryDay(data.summary_day);
        setSummaryTime(data.summary_time);
        setDailyReminderTime((data as any).daily_reminder_time ?? "21:00");
        setSleepReminderEnabled((data as any).sleep_reminder_enabled ?? true);
        setSleepReminderTime((data as any).sleep_reminder_time ?? "07:30");
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




  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("user_preferences").upsert({
        user_id: user.id,
        weekly_summary_enabled: summaryEnabled,
        summary_day: summaryDay,
        summary_time: summaryTime,
        summary_timezone: "Asia/Jerusalem",
        daily_reminder_time: dailyReminderTime,
        sleep_reminder_enabled: sleepReminderEnabled,
        sleep_reminder_time: sleepReminderTime,
      }, {
        onConflict: 'user_id'
      });

      if (error) throw error;

      // Reschedule notifications with new settings (native only)
      const notificationsEnabled =
        localStorage.getItem("nestai-notifications-enabled") === "true";
      if (isNativeApp() && notificationsEnabled) {
        await scheduleDailyReminder(dailyReminderTime);
        if (sleepReminderEnabled) {
          await scheduleSleepReminder(sleepReminderTime);
        } else {
          await cancelSleepReminder();
        }
      }

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

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        <BackButton />


        <AddToHomeBanner />
        <div className="space-y-2">
          <h1 className="text-[24px] font-semibold text-foreground">{t.settings.summarySettings}</h1>
          <p className="text-[16px] text-muted-foreground">
            {isRTL ? "אפשר לבחור מתי יגיע הסיכום השבועי" : "Choose when to receive your weekly summary"}
          </p>
        </div>

        {/* Settings Card */}
        <div className="bg-card rounded-[20px] p-6 border border-border space-y-6 animate-slide-up">
          <div className="space-y-5">
            <div className="flex items-center justify-between py-3 px-4 bg-muted/20 rounded-[14px] border border-border/50">
              <div className="space-y-1">
                <label className="text-[15px] font-medium text-foreground block">
                  {t.settings.enableWeeklySummary}
                </label>
                <p className="text-[13px] text-muted-foreground">
                  {isRTL ? "שליחת סיכום שבועי באופן אוטומטי" : "Automatically send weekly summary"}
                </p>
              </div>
              <Switch
                checked={summaryEnabled}
                onCheckedChange={setSummaryEnabled}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[15px] font-medium text-foreground block">
                {t.settings.summaryDay}
              </label>
              <Select value={summaryDay} onValueChange={setSummaryDay}>
                <SelectTrigger className="w-full h-12 rounded-[14px] border text-[16px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dayLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value} className="text-[16px]">
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-[15px] font-medium text-foreground block">
                {t.settings.summaryTime}
              </label>
              <Select value={summaryTime} onValueChange={setSummaryTime}>
                <SelectTrigger className="w-full h-12 rounded-[14px] border text-[16px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, "0");
                    return (
                      <SelectItem key={hour} value={`${hour}:00`} className="text-[16px]">
                        {hour}:00
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 text-[16px] rounded-[14px]"
          >
            <Save className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {saving ? t.common.loading : t.common.save}
          </Button>
        </div>

        {/* ── Daily reminder card ── */}
        <div className="space-y-2">
          <h2 className="text-[20px] font-semibold text-foreground">
            {isRTL ? "התראות יומיות" : "Daily Reminders"}
          </h2>
          <p className="text-[15px] text-muted-foreground">
            {isRTL
              ? "שאלה יומית על גבי מסך הנעילה — משתנה לפי יום השבוע"
              : "A daily question on your lock screen, different each day of the week"}
          </p>
        </div>

        <div className="bg-card rounded-[20px] p-6 border border-border space-y-6 animate-slide-up">
          {/* Enable / disable toggle — shown only on native iOS/Android */}
          {user && <PushNotificationSettings userId={user.id} />}

          {/* Time picker */}
          <div className="space-y-2">
            <label className="text-[15px] font-medium text-foreground block">
              {isRTL ? "שעת ההתראה" : "Reminder time"}
            </label>
            <Select value={dailyReminderTime} onValueChange={setDailyReminderTime}>
              <SelectTrigger className="w-full h-12 rounded-[14px] border text-[16px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 18 }, (_, i) => {
                  const hour = (i + 6).toString().padStart(2, "0");
                  return (
                    <SelectItem key={hour} value={`${hour}:00`} className="text-[16px]">
                      {hour}:00
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Questions preview */}
          <div className="bg-muted/20 rounded-[14px] p-4 border border-border/50 space-y-2">
            <p className="text-[13px] font-medium text-foreground">
              {isRTL ? "השאלות השבועיות:" : "Weekly questions:"}
            </p>
            {[
              { day: "ראשון", q: "מה הרגע שגרם לך להרגיש שהיום היה שווה?" },
              { day: "שני",   q: "מה דבר אחד שהפתיע אותך היום?" },
              { day: "שלישי", q: "מה אתה גאה בו מהיום?" },
              { day: "רביעי", q: "מה למדת על עצמך היום?" },
              { day: "חמישי", q: "מה הדבר שנתת לעצמך היום?" },
              { day: "שישי",  q: "מה היה הרגע הכי שקט שלך השבוע?" },
              { day: "שבת",   q: "מה אתה רוצה לקחת איתך לשבוע הבא?" },
            ].map(({ day, q }) => (
              <div key={day} className="flex gap-2 text-[12px]">
                <span className="text-muted-foreground font-medium w-12 shrink-0">{day}</span>
                <span className="text-foreground/70">{q}</span>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 text-[16px] rounded-[14px]"
          >
            <Save className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {saving ? t.common.loading : t.common.save}
          </Button>
        </div>

        {/* ── Sleep reminder card ── */}
        <div className="space-y-2">
          <h2 className="text-[20px] font-semibold text-foreground">
            {isRTL ? "התראת שינה בוקרית" : "Morning Sleep Reminder"}
          </h2>
          <p className="text-[15px] text-muted-foreground">
            {isRTL
              ? "תזכורת בבוקר לתעד את נתוני השינה שלך"
              : "A morning nudge to log your sleep data"}
          </p>
        </div>

        <div className="bg-card rounded-[20px] p-6 border border-border space-y-6 animate-slide-up">
          {/* Enable / disable toggle */}
          <div className="flex items-center justify-between py-3 px-4 bg-muted/20 rounded-[14px] border border-border/50">
            <div className="space-y-1">
              <label className="text-[15px] font-medium text-foreground block">
                {isRTL ? "הפעל התראת שינה" : "Enable sleep reminder"}
              </label>
              <p className="text-[13px] text-muted-foreground">
                {isRTL ? "בוקר טוב 🌤️ איך ישנת הלילה?" : "Good morning 🌤️ How did you sleep?"}
              </p>
            </div>
            <Switch
              checked={sleepReminderEnabled}
              onCheckedChange={setSleepReminderEnabled}
            />
          </div>

          {/* Time picker — shown only when enabled */}
          {sleepReminderEnabled && (
            <div className="space-y-2">
              <label className="text-[15px] font-medium text-foreground block">
                {isRTL ? "שעת ההתראה" : "Reminder time"}
              </label>
              <Select value={sleepReminderTime} onValueChange={setSleepReminderTime}>
                <SelectTrigger className="w-full h-12 rounded-[14px] border text-[16px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }, (_, i) => {
                    const hour = (i + 5).toString().padStart(2, "0");
                    return (
                      <>
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`} className="text-[16px]">{hour}:00</SelectItem>
                        <SelectItem key={`${hour}:30`} value={`${hour}:30`} className="text-[16px]">{hour}:30</SelectItem>
                      </>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 text-[16px] rounded-[14px]"
          >
            <Save className={`w-4 h-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {saving ? t.common.loading : t.common.save}
          </Button>
        </div>

        {/* Language Settings */}
        <div className="text-center text-[14px] text-muted-foreground bg-muted/30 rounded-[14px] p-4 border border-border/50">
          {isRTL ? "ברירת מחדל: שבת בשעה 20:00 · התראה יומית בשעה 21:00" : "Default: Saturday at 20:00 · Daily reminder at 21:00"}
        </div>




        <div className="text-center py-6 space-y-2">
          <button
            onClick={() => navigate("/app/support")}
            className="text-sm text-primary hover:underline"
          >
            {isRTL ? "עזרה ותמיכה" : "Help & Support"}
          </button>
          <p className="text-xs text-muted-foreground/60">{t.footer.copyright}</p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
