import { useState, useEffect } from "react";

const STORAGE_KEY = "nest-accessibility";

interface AccessibilitySettings {
  fontSize: "normal" | "large" | "xlarge";
  highContrast: boolean;
  highlightLinks: boolean;
  readableFont: boolean;
}

const defaults: AccessibilitySettings = {
  fontSize: "normal",
  highContrast: false,
  highlightLinks: false,
  readableFont: false,
};

export const useAccessibility = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    const root = document.documentElement;

    // Font size
    root.classList.remove("a11y-font-large", "a11y-font-xlarge");
    if (settings.fontSize === "large") root.classList.add("a11y-font-large");
    if (settings.fontSize === "xlarge") root.classList.add("a11y-font-xlarge");

    // High contrast
    root.classList.toggle("a11y-high-contrast", settings.highContrast);

    // Highlight links
    root.classList.toggle("a11y-highlight-links", settings.highlightLinks);

    // Readable font
    root.classList.toggle("a11y-readable-font", settings.readableFont);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = (partial: Partial<AccessibilitySettings>) =>
    setSettings((prev) => ({ ...prev, ...partial }));

  const cycleFontSize = () => {
    const order: AccessibilitySettings["fontSize"][] = ["normal", "large", "xlarge"];
    const idx = order.indexOf(settings.fontSize);
    update({ fontSize: order[(idx + 1) % order.length] });
  };

  return { settings, update, cycleFontSize };
};
