// PWA install prompt disabled.
// Hook kept as a no-op stub so all existing callers compile without changes.
export const usePWAInstall = () => ({
  isInstallable: false,
  isInstalled: true,        // treat as "already installed" → hides all install UI
  isIOS: false,
  isAndroid: false,
  promptInstall: async () => false,
  canShowIOSPrompt: false,
  canShowAndroidPrompt: false,
});
