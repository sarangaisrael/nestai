import { useEffect, ReactNode } from "react";
import { useAppDirectives } from "@/hooks/useAppDirectives";

/**
 * Applies global app directives parsed from the `app_instructions` field.
 * Place this component inside SiteContentProvider.
 * 
 * Supported directives:
 *   [THEME: DARK]  / [THEME: LIGHT]  → Force dark/light mode
 *   [THEME: AUTO]                     → Use system preference (default)
 */
export const AppDirectivesProvider = ({ children }: { children: ReactNode }) => {
  const { getValue } = useAppDirectives();
  const theme = getValue("THEME", "").toUpperCase();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "DARK") {
      root.classList.add("dark");
      localStorage.setItem("nest-dark-mode", "true");
    } else if (theme === "LIGHT") {
      root.classList.remove("dark");
      localStorage.setItem("nest-dark-mode", "false");
    }
    // "AUTO" or empty → don't override, let user/system decide
  }, [theme]);

  return <>{children}</>;
};
