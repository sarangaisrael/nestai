import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { useToast } from '@/hooks/use-toast';
import IOSInstallOverlay from './IOSInstallOverlay';

interface PWAInstallButtonProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
}

export const PWAInstallButton = ({ 
  variant = 'ghost', 
  size = 'icon',
  showText = false,
  className = ''
}: PWAInstallButtonProps) => {
  const [showIOSOverlay, setShowIOSOverlay] = useState(false);
  const { isInstalled, isIOS, promptInstall, canShowAndroidPrompt } = usePWAInstall();
  const { toast } = useToast();

  // Don't show if already installed
  if (isInstalled) return null;

  const handleClick = async () => {
    if (canShowAndroidPrompt) {
      // Android: trigger native install prompt
      const installed = await promptInstall();
      if (installed) {
        toast({
          title: "הותקן בהצלחה",
          description: "האפליקציה נוספה למסך הבית",
        });
      }
    } else if (isIOS) {
      // iOS: show custom overlay with instructions
      setShowIOSOverlay(true);
    } else {
      // Desktop or unsupported: show generic instructions
      toast({
        title: "התקנת האפליקציה",
        description: "לחץ על תפריט הדפדפן ובחר 'הוסף למסך הבית'",
      });
    }
  };

  return (
    <>
      <Button 
        variant={variant} 
        size={size} 
        onClick={handleClick}
        className={className}
      >
        <Download className="h-5 w-5" />
        {showText && <span className="mr-2">התקן אפליקציה</span>}
      </Button>

      {showIOSOverlay && (
        <IOSInstallOverlay />
      )}
    </>
  );
};

export default PWAInstallButton;
