import { useState, useEffect, useCallback } from 'react';
import { getIsIOS, getIsAndroid, getIsStandalone } from '@/lib/platform';
import { supabase } from '@/integrations/supabase/client';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Track installation in the database
const trackPWAInstallation = async (platform: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('No authenticated user, skipping PWA installation tracking');
      return;
    }

    // Check if already tracked for this user
    const { data: existing } = await supabase
      .from('pwa_installations')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      console.log('PWA installation already tracked for this user');
      return;
    }

    const { error } = await supabase
      .from('pwa_installations')
      .insert({
        user_id: user.id,
        platform,
        user_agent: navigator.userAgent
      });

    if (error) {
      console.error('Error tracking PWA installation:', error);
    } else {
      console.log('PWA installation tracked successfully');
    }
  } catch (error) {
    console.error('Error in trackPWAInstallation:', error);
  }
};

// Detect platform
const detectPlatform = (): string => {
  if (getIsIOS()) return 'ios';
  if (getIsAndroid()) return 'android';
  return 'desktop';
};

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsIOS(getIsIOS());
    setIsAndroid(getIsAndroid());
    
    const standalone = getIsStandalone();
    setIsInstalled(standalone);

    // If running in standalone mode, track the installation
    if (standalone) {
      // Check if we've already tracked this session
      const hasTrackedThisSession = sessionStorage.getItem('pwa_install_tracked');
      if (!hasTrackedThisSession) {
        sessionStorage.setItem('pwa_install_tracked', 'true');
        trackPWAInstallation(detectPlatform());
      }
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      // Track the installation when the app is installed
      trackPWAInstallation(detectPlatform());
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setIsInstallable(false);
        // Track the installation
        trackPWAInstallation(detectPlatform());
      }
      
      setDeferredPrompt(null);
      return outcome === 'accepted';
    } catch (error) {
      console.error('Install prompt error:', error);
      return false;
    }
  }, [deferredPrompt]);

  return {
    isInstallable,
    isInstalled,
    isIOS,
    isAndroid,
    promptInstall,
    canShowIOSPrompt: isIOS && !isInstalled,
    canShowAndroidPrompt: isAndroid && isInstallable && !isInstalled,
  };
};
