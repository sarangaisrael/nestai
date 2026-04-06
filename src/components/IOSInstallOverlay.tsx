import { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getIsIOS, getIsStandalone, getHomePromptDismissed, setHomePromptDismissed } from '@/lib/platform';

interface IOSInstallOverlayProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const IOSInstallOverlay = ({ isOpen: controlledOpen, onClose }: IOSInstallOverlayProps) => {
  const [internalVisible, setInternalVisible] = useState(false);
  
  // Use controlled mode if isOpen prop is provided
  const isControlled = controlledOpen !== undefined;
  const isVisible = isControlled ? controlledOpen : internalVisible;

  useEffect(() => {
    // Only run auto-show logic if not controlled
    if (isControlled) return;
    
    // Check if iOS Safari, not installed, and not dismissed
    const isIOS = getIsIOS();
    const isStandalone = getIsStandalone();
    const isDismissed = getHomePromptDismissed();
    
    // Only show on iOS Safari when not installed and not dismissed
    if (isIOS && !isStandalone && !isDismissed) {
      // Delay showing to not interrupt initial experience
      const timer = setTimeout(() => {
        setInternalVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isControlled]);

  const handleDismiss = () => {
    if (!isControlled) {
      setHomePromptDismissed();
      setInternalVisible(false);
    }
    onClose?.();
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
        onClick={handleDismiss}
      />
      
      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
        <div className="bg-card rounded-t-3xl shadow-elevated border-t border-border mx-2 mb-0 overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          {/* Content */}
          <div className="px-6 pb-8 pt-2" dir="rtl">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-4 left-4 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <img src="/icon-192.png" alt="NestAI" className="w-12 h-12 rounded-xl" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-bold text-foreground text-center mb-2">
              התקן את NestAI
            </h2>

            {/* Description */}
            <p className="text-muted-foreground text-center mb-6 text-sm leading-relaxed">
              הוסף את NestAI למסך הבית לגישה מהירה וחוויה טובה יותר
            </p>

            {/* Instructions */}
            <div className="bg-muted/30 rounded-2xl p-4 mb-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">
                    לחץ על כפתור השיתוף
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Share className="h-5 w-5 text-primary" />
                    <span className="text-xs text-muted-foreground">
                      (ריבוע עם חץ למעלה)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">
                    גלול ולחץ על "הוסף למסך הבית"
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Add to Home Screen
                  </span>
                </div>
              </div>
            </div>

            {/* Dismiss Button */}
            <Button
              variant="ghost"
              className="w-full h-12 text-muted-foreground"
              onClick={handleDismiss}
            >
              אולי מאוחר יותר
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default IOSInstallOverlay;
