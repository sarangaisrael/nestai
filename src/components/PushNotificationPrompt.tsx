import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import {
  isNotificationsSupported,
  getNotificationPermission,
  requestNotificationPermission,
  scheduleAllNotifications,
  registerNotificationListeners,
  isNativeApp,
} from "@/lib/pushNotifications";

const DISMISSED_KEY = "push_prompt_dismissed";

const PushNotificationPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkIfShouldShow();
    registerNotificationListeners();
  }, []);

  const checkIfShouldShow = async () => {
    if (!isNotificationsSupported()) {
      setShowPrompt(false);
      return;
    }

    // Check if already dismissed recently
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const daysSince = (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 1) {
        setShowPrompt(false);
        return;
      }
    }

    // Check permission
    const permission = await getNotificationPermission();
    if (permission === "granted") {
      // Already granted — don't re-schedule on every mount to avoid iOS duplicates
      setShowPrompt(false);
      return;
    }
    if (permission === "denied") {
      setShowPrompt(false);
      return;
    }

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setShowPrompt(false);
      return;
    }

    setShowPrompt(true);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
    setShowPrompt(false);
  };

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      const permission = await requestNotificationPermission();
      if (permission !== "granted") {
        handleDismiss();
        return;
      }

      // Schedule all notifications (daily + weekly + monthly)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: prefs } = await supabase
          .from("user_preferences")
          .select("summary_day, summary_time")
          .eq("user_id", session.user.id)
          .maybeSingle();
        
        const summaryDay = prefs?.summary_day || "saturday";
        const summaryTime = prefs?.summary_time || "20:00";
        await scheduleAllNotifications(summaryDay, summaryTime);
        localStorage.setItem("nestai-notifications-enabled", "true");
      }
      setShowPrompt(false);
    } catch (error) {
      console.error("Error enabling notifications:", error);
      handleDismiss();
    }
    setIsLoading(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" dir="rtl">
      <Card className="mx-4 w-full max-w-sm p-5 bg-blue-500 border-blue-400 shadow-2xl shadow-blue-500/30">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Bell className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white mb-1">
              הפעל התראות
            </h3>
            <p className="text-sm text-blue-100 mb-4">
              קבל/י תזכורת יומית ועדכונים על סיכומים שבועיים
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleEnable}
                disabled={isLoading}
                className="text-sm bg-white text-blue-600 hover:bg-blue-50"
              >
                {isLoading ? "מפעיל..." : "הפעל התראות"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                disabled={isLoading}
                className="text-sm text-blue-100 hover:text-white hover:bg-blue-600"
              >
                לא עכשיו
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="h-7 w-7 flex-shrink-0 text-blue-100 hover:text-white hover:bg-blue-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PushNotificationPrompt;
