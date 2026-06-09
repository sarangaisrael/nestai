import { createContext, useContext, useEffect, useRef, useState } from "react";

// Supatype for the browser's non-standard event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAInstallContextValue {
  /** true when the browser has a pending install prompt (Android/Chrome) */
  canInstall: boolean;
  /**
   * Triggers the native PWA install banner.
   * Falls back to opening https://www.nestai.care in a new tab if no prompt is
   * available (iOS, already installed, or browser doesn't support it).
   */
  triggerInstall: () => Promise<void>;
}

const PWAInstallContext = createContext<PWAInstallContextValue>({
  canInstall: false,
  triggerInstall: async () => {
    window.open("https://www.nestai.care", "_blank", "noopener,noreferrer");
  },
});

export const usePWAInstallPrompt = () => useContext(PWAInstallContext);

export const PWAInstallProvider = ({ children }: { children: React.ReactNode }) => {
  // Keep the event in a ref so we can call .prompt() without a stale closure.
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent the browser from showing the mini-infobar automatically.
      e.preventDefault();
      promptRef.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const triggerInstall = async () => {
    if (!promptRef.current) {
      // Fallback: not installed-able via prompt (iOS / already installed / unsupported)
      window.open("https://www.nestai.care", "_blank", "noopener,noreferrer");
      return;
    }
    try {
      await promptRef.current.prompt();
      await promptRef.current.userChoice;
    } finally {
      // Reset regardless of outcome so the button doesn't fire a second time.
      promptRef.current = null;
      setCanInstall(false);
    }
  };

  return (
    <PWAInstallContext.Provider value={{ canInstall, triggerInstall }}>
      {children}
    </PWAInstallContext.Provider>
  );
};
