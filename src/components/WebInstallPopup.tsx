import { useState, useEffect } from 'react';
import { X, Share, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getIsIOS, getIsStandalone } from '@/lib/platform';
import { useToast } from '@/hooks/use-toast';

const BUTTON_DISMISSED_KEY = 'nest_web_install_button_dismissed';

const getButtonDismissed = (): boolean => {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(BUTTON_DISMISSED_KEY) === 'true';
};

const setButtonDismissed = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(BUTTON_DISMISSED_KEY, 'true');
  }
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const WebInstallPopup = () => {
  const [showButton, setShowButton] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const isIOS = getIsIOS();
  const { toast } = useToast();

  useEffect(() => {
    const isStandalone = getIsStandalone();
    const isDismissed = getButtonDismissed();

    // Don't show if already installed or dismissed
    if (isStandalone || isDismissed) return;

    // Listen for beforeinstallprompt event (Android/Chrome/Desktop)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Show button after a short delay
    const timer = setTimeout(() => {
      setShowButton(true);
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleDismissButton = () => {
    setButtonDismissed();
    setShowButton(false);
    setShowPopup(false);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast({
            title: "הותקן בהצלחה! 🎉",
            description: "האפליקציה נוספה למסך הבית שלך",
          });
          handleDismissButton();
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install prompt error:', error);
      }
    }
  };

  if (!showButton) return null;

  return (
    <>
      {/* Floating Install Button */}
      <button
        onClick={() => setShowPopup(true)}
        className="fixed bottom-24 left-4 z-40 w-14 h-14 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:scale-105 transition-transform animate-fade-in"
      >
        <img src="/icon-192.png" alt="התקן" className="w-10 h-10 rounded-full" />
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
          <Download className="w-3 h-3 text-primary-foreground" />
        </div>
      </button>

      {/* Popup */}
      {showPopup && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-50 animate-fade-in backdrop-blur-sm"
            onClick={handleClosePopup}
          />
          
          {/* Popup Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-card rounded-3xl shadow-elevated border border-border w-full max-w-sm overflow-hidden pointer-events-auto animate-scale-in"
              dir="rtl"
            >
              {/* Close button */}
              <button
                onClick={handleClosePopup}
                className="absolute top-4 left-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors z-10"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Content */}
              <div className="px-6 py-8">
                {/* Icon */}
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-lg">
                      <img src="/icon-192.png" alt="NestAI" className="w-14 h-14 rounded-xl" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md">
                      <Smartphone className="w-4 h-4 text-primary-foreground" />
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-bold text-foreground text-center mb-2">
                  התקן את NestAI
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-center mb-6 text-sm leading-relaxed">
                  התקנת האפליקציה מאפשרת גישה מהירה מהמסך הבית, קבלת התראות וחוויה טובה יותר
                </p>

                {isIOS ? (
                  // iOS Instructions
                  <div className="bg-muted/30 rounded-2xl p-4 mb-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground text-sm">
                          לחץ על כפתור השיתוף <Share className="h-4 w-4 inline text-primary" />
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground text-sm">
                          בחר "הוסף למסך הבית"
                        </p>
                      </div>
                    </div>
                  </div>
                ) : deferredPrompt ? (
                  // Android/Desktop with install prompt
                  <Button
                    onClick={handleInstall}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl mb-3 gap-2"
                  >
                    <Download className="w-5 h-5" />
                    התקן עכשיו
                  </Button>
                ) : (
                  // Fallback instructions for other browsers
                  <div className="bg-muted/30 rounded-2xl p-4 mb-5 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        1
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground text-sm">
                          פתח את תפריט הדפדפן (⋮)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        2
                      </div>
                      <div className="flex-1">
                        <p className="text-foreground text-sm">
                          בחר "הוסף למסך הבית" או "Install app"
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="flex-1 h-10 text-muted-foreground hover:text-foreground"
                    onClick={handleClosePopup}
                  >
                    סגור
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1 h-10 text-muted-foreground hover:text-foreground"
                    onClick={handleDismissButton}
                  >
                    אל תציג שוב
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default WebInstallPopup;
