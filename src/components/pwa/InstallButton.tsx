import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chrome/Android PWA install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast({
          title: "הותקן בהצלחה",
        });
      }
      
      setDeferredPrompt(null);
    } else {
      // iPhone Safari or unsupported browsers
      setShowInstructions(true);
    }
  };

  return (
    <>
      <Button variant="ghost" size="icon" onClick={handleInstall}>
        <Download className="h-5 w-5" />
      </Button>

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-md rounded-3xl shadow-elevated" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl font-bold">איך להוסיף את NestAI למסך הבית?</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 text-foreground pt-4">
            <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
              <h3 className="font-bold text-lg mb-3">באייפון:</h3>
              <ol className="space-y-2 mr-4 text-base">
                <li>1. לחצו על כפתור השיתוף ⤴️</li>
                <li>2. בחרו 'הוסף למסך הבית'</li>
              </ol>
            </div>
            <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
              <h3 className="font-bold text-lg mb-3">באנדרואיד:</h3>
              <ol className="space-y-2 mr-4 text-base">
                <li>1. לחצו על תפריט ⋮ בדפדפן</li>
                <li>2. בחרו 'הוספה למסך הבית'</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
