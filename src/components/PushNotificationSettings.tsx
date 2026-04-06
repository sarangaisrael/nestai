import { useState, useEffect } from "react";
import { Bell, BellOff, Loader2, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  scheduleAllNotifications,
  cancelAllScheduledNotifications,
  sendLocalNotification,
  isNativeApp,
} from "@/lib/pushNotifications";

interface PushNotificationSettingsProps {
  userId: string;
}

const PushNotificationSettings = ({ userId }: PushNotificationSettingsProps) => {
  const { toast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [permission, setPermission] = useState<"granted" | "denied" | "prompt">("prompt");

  useEffect(() => {
    checkStatus();
  }, [userId]);

  const checkStatus = async () => {
    setIsLoading(true);
    const supported = isNotificationsSupported();
    setIsSupported(supported);

    if (!supported) {
      setIsLoading(false);
      return;
    }

    const perm = await getNotificationPermission();
    setPermission(perm);

    // Check if notifications are enabled (stored locally)
    const enabled = localStorage.getItem("nestai-notifications-enabled") === "true";
    setIsEnabled(perm === "granted" && enabled);

    setIsLoading(false);
  };

  const enableNotifications = async () => {
    setIsToggling(true);
    try {
      const perm = await requestNotificationPermission();
      setPermission(perm);

      if (perm !== "granted") {
        toast({
          title: "הרשאה נדחתה",
          description: "יש לאשר התראות בהגדרות המכשיר",
          variant: "destructive",
        });
        setIsToggling(false);
        return;
      }

      // Fetch user summary preferences for scheduling
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("summary_day, summary_time")
        .eq("user_id", userId)
        .maybeSingle();

      const summaryDay = prefs?.summary_day || "saturday";
      const summaryTime = prefs?.summary_time || "20:00";

      await scheduleAllNotifications(summaryDay, summaryTime);
      localStorage.setItem("nestai-notifications-enabled", "true");
      setIsEnabled(true);

      toast({
        title: "התראות הופעלו",
        description: "תקבל/י תזכורת יומית בשעה 20:00",
      });
    } catch (error: any) {
      console.error("Error enabling notifications:", error);
      toast({
        title: "שגיאה",
        description: error.message || "לא ניתן להפעיל התראות",
        variant: "destructive",
      });
    }
    setIsToggling(false);
  };

  const disableNotifications = async () => {
    setIsToggling(true);
    try {
      await cancelAllScheduledNotifications();
      localStorage.setItem("nestai-notifications-enabled", "false");
      setIsEnabled(false);

      toast({
        title: "התראות כובו",
        description: "לא תקבל/י עוד התראות",
      });
    } catch (error: any) {
      console.error("Error disabling notifications:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לכבות התראות",
        variant: "destructive",
      });
    }
    setIsToggling(false);
  };

  const sendTestNotification = async () => {
    setIsTesting(true);
    try {
      await sendLocalNotification(
        "בדיקת התראות 🔔",
        "אם קיבלת את זה — הכל עובד.",
        { url: "/app/summary" }
      );
      toast({
        title: "נשלחה התראת בדיקה",
        description: "בדוק/י את ההתראות במכשיר",
      });
    } catch (e: any) {
      toast({
        title: "שגיאה",
        description: e?.message || "לא ניתן לשלוח התראת בדיקה",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      await enableNotifications();
    } else {
      await disableNotifications();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-between py-3 px-4 bg-muted/20 rounded-[14px] border border-border/50">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="text-[15px] text-muted-foreground">בודק סטטוס התראות...</span>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="flex items-center gap-3 py-3 px-4 bg-muted/20 rounded-[14px] border border-border/50">
        <AlertCircle className="h-5 w-5 text-muted-foreground" />
        <div className="space-y-1">
          <p className="text-[15px] font-medium text-foreground">התראות לא נתמכות</p>
          <p className="text-[13px] text-muted-foreground">
            הדפדפן או המכשיר שלך לא תומכים בהתראות
          </p>
        </div>
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-3 py-3 px-4 bg-destructive/10 rounded-[14px] border border-destructive/30">
        <BellOff className="h-5 w-5 text-destructive" />
        <div className="space-y-1">
          <p className="text-[15px] font-medium text-foreground">התראות חסומות</p>
          <p className="text-[13px] text-muted-foreground">
            {isNativeApp()
              ? "יש לאפשר התראות בהגדרות המכשיר עבור NestAI"
              : "יש לאפשר התראות בהגדרות הדפדפן"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 px-4 bg-muted/20 rounded-[14px] border border-border/50">
      <div className="flex items-center gap-3">
        {isEnabled ? (
          <Bell className="h-5 w-5 text-primary" />
        ) : (
          <BellOff className="h-5 w-5 text-muted-foreground" />
        )}
        <div className="space-y-1">
          <label className="text-[15px] font-medium text-foreground block">
            התראות
          </label>
          <p className="text-[13px] text-muted-foreground">
            תזכורת יומית + עדכוני סיכומים
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={sendTestNotification}
          disabled={!isEnabled || isTesting || isToggling}
          className="h-9"
        >
          {isTesting ? "שולח..." : "בדיקה"}
        </Button>
        <Switch
          checked={isEnabled}
          onCheckedChange={handleToggle}
          disabled={isToggling}
        />
      </div>
    </div>
  );
};

export default PushNotificationSettings;
