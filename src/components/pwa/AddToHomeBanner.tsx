import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { getIsMobile, getIsStandalone, getHomePromptDismissed, setHomePromptDismissed, getIsIOS, getIsAndroid } from "@/lib/platform";
import { supabase } from "@/integrations/supabase/client";

const AddToHomeBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check visibility conditions
    const isStandalone = getIsStandalone();
    const isDismissed = getHomePromptDismissed();

    // Listen for beforeinstallprompt event (Android/Chrome/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show banner when install prompt is available (works on desktop too)
      if (!isStandalone && !isDismissed) {
        setIsVisible(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS and mobile devices without install prompt, show banner anyway
    const isMobile = getIsMobile();
    if (isMobile && !isStandalone && !isDismissed) {
      setIsVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setHomePromptDismissed();
  };

  const trackPWAInstallation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const platform = getIsIOS() ? 'ios' : getIsAndroid() ? 'android' : 'desktop';
      
      // Check if already tracked
      const { data: existing } = await supabase
        .from('pwa_installations')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!existing) {
        await supabase.from('pwa_installations').insert({
          user_id: user.id,
          platform,
          user_agent: navigator.userAgent
        });
      }
    } catch (error) {
      console.error('Error tracking PWA installation:', error);
    }
  };

  const handleAddToHome = async () => {
    // If we have the deferred prompt (Android/Chrome), use it
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          await trackPWAInstallation();
          handleDismiss();
        }
        setDeferredPrompt(null);
        return;
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
    }

    // Try Web Share API as fallback
    if (navigator.share) {
      try {
        await navigator.share({
          url: window.location.origin,
          title: 'NestAI',
        });
      } catch (error) {
        // User cancelled or error - show instructions
        console.log('Share cancelled or failed:', error);
      }
    }

    // Always show instructions for iOS or when share isn't available
    setShowInstructions(true);
  };

  if (!isVisible) {
    return null;
  }

  const isIOS = getIsIOS();

  return (
    <div 
      id="addToHomeBanner"
      className="mx-0 mb-4 p-4 bg-card border border-border rounded-2xl shadow-sm relative"
      dir="rtl"
    >
      <button
        onClick={handleDismiss}
        className="absolute top-3 left-3 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="סגור"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="pr-1 pl-6">
        <h3 className="text-sm font-semibold text-foreground mb-1">
          עדיין לא הוספת את NestAI למסך הבית…?
        </h3>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          הוספה למסך הבית מאפשרת גישה מהירה ונוחה – כמו אפליקציה אמיתית, בלי לחפש בלשוניות.
        </p>
        <Button
          id="addToHomeBtn"
          onClick={handleAddToHome}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 py-2 text-sm"
          size="sm"
        >
          להוספה למסך הבית
        </Button>

        {/* Instructions - always visible after clicking the button */}
        {showInstructions && (
          <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground space-y-2">
            {isIOS ? (
              <p>
                <span className="font-medium text-foreground">ב-iPhone:</span> לחצו על כפתור השיתוף (הריבוע עם החץ) ולאחר מכן גללו ובחרו "הוסף למסך הבית".
              </p>
            ) : (
              <p>
                <span className="font-medium text-foreground">ב-Android (Chrome):</span> לחצו על שלוש הנקודות למעלה ואז על "הוסף למסך הבית" או "Install app".
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddToHomeBanner;
