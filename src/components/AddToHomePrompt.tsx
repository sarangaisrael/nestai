import { useState, useEffect } from "react";
import { Download, X, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useLanguage } from "@/contexts/LanguageContext";

const DISMISSED_KEY = "add_to_home_prompt_dismissed";

const AddToHomePrompt = () => {
  const { isInstallable, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { dir } = useLanguage();

  useEffect(() => {
    checkIfShouldShow();
  }, [isInstallable, isInstalled, isIOS]);

  const checkIfShouldShow = () => {
    // Don't show if already installed
    if (isInstalled) {
      setShowPrompt(false);
      return;
    }

    // Check if dismissed recently (within 1 day)
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 1) {
        setShowPrompt(false);
        return;
      }
    }

    // Show for iOS (manual instructions) or if installable (Android/Desktop)
    if (isIOS || isInstallable) {
      setShowPrompt(true);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, new Date().toISOString());
    setShowPrompt(false);
  };

  const handleInstall = async () => {
    if (isIOS) {
      // For iOS, we can't auto-install, just show instructions
      handleDismiss();
      return;
    }

    setIsLoading(true);
    const success = await promptInstall();
    setIsLoading(false);
    
    if (success) {
      setShowPrompt(false);
    } else {
      handleDismiss();
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up" dir={dir}>
      <Card className="p-4 bg-card border border-border shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-foreground mb-1">
              הוסף למסך הבית
            </h3>
            {isIOS ? (
              <div className="text-[13px] text-muted-foreground mb-3">
                <p className="mb-2">לחץ על כפתור השיתוף</p>
                <div className="flex items-center gap-1 mb-2">
                  <Share className="h-4 w-4" />
                  <span>ובחר</span>
                  <span className="font-medium">"הוסף למסך הבית"</span>
                  <Plus className="h-4 w-4" />
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground mb-3">
                התקן את האפליקציה לגישה מהירה ונוחה יותר
              </p>
            )}
            <div className="flex gap-2">
              {!isIOS && (
                <Button
                  size="sm"
                  onClick={handleInstall}
                  disabled={isLoading}
                  className="text-[13px]"
                >
                  {isLoading ? "מתקין..." : "התקן עכשיו"}
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                disabled={isLoading}
                className="text-[13px] text-muted-foreground"
              >
                {isIOS ? "הבנתי" : "לא עכשיו"}
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            className="h-6 w-6 flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AddToHomePrompt;
