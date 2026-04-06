// Platform detection utilities

export const getIsIOS = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /iPhone|iPad|iPod/i.test(ua);
};

export const getIsAndroid = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /Android/i.test(ua);
};

export const getIsMobile = (): boolean => {
  return getIsIOS() || getIsAndroid();
};

export const getIsStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // iOS standalone check
  const isIosStandalone = (window.navigator as any).standalone === true;
  
  // Standard display-mode check
  const isStandaloneDisplayMode = window.matchMedia?.('(display-mode: standalone)').matches;
  
  return isIosStandalone || isStandaloneDisplayMode;
};

export const getHomePromptDismissed = (): boolean => {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem('nest_home_prompt_dismissed') === 'true';
};

export const setHomePromptDismissed = (): void => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('nest_home_prompt_dismissed', 'true');
  }
};
