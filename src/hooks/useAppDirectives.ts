import { useMemo } from "react";
import { useSiteContent } from "@/contexts/SiteContentContext";

export interface AppDirectives {
  /** Raw parsed key-value pairs from [KEY: VALUE] patterns */
  raw: Record<string, string>;
  /** Check if a flag directive exists, e.g. [HIDE_HISTORY] */
  hasFlag: (flag: string) => boolean;
  /** Get a directive value, e.g. [THEME: DARK] → "DARK" */
  getValue: (key: string, fallback?: string) => string;
  /** Get a numeric directive, e.g. [MAX_CHARS: 5000] → 5000 */
  getNumber: (key: string, fallback?: number) => number;
}

/**
 * Parses the `app_instructions` system message for directives.
 * 
 * Supported patterns:
 *   [KEY: VALUE]  → key-value directive
 *   [FLAG]        → boolean flag (present = true)
 * 
 * Examples:
 *   [THEME: DARK]
 *   [HIDE_HISTORY]
 *   [MAX_CHARS: 5000]
 *   [SUPPORT_PHONE: 050-1234567]
 *   [SUPPORT_EMAIL: help@nest.com]
 *   [MAX_MESSAGES: 50]
 *   [HIDE_MEDITATION]
 *   [HIDE_MONTHLY_SUMMARY]
 *   [APP_NAME: Nest]
 *   [WELCOME_MESSAGE: ברוך הבא!]
 */
function parseDirectives(text: string): { values: Record<string, string>; flags: Set<string> } {
  const values: Record<string, string> = {};
  const flags = new Set<string>();

  if (!text) return { values, flags };

  // Match [KEY: VALUE] patterns
  const kvRegex = /\[([A-Z_]+)\s*:\s*([^\]]+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = kvRegex.exec(text)) !== null) {
    values[match[1].trim()] = match[2].trim();
  }

  // Match [FLAG] patterns (no colon)
  const flagRegex = /\[([A-Z_]+)\]/g;
  while ((match = flagRegex.exec(text)) !== null) {
    const key = match[1].trim();
    // Only treat as flag if not already captured as key-value
    if (!(key in values)) {
      flags.add(key);
    }
  }

  return { values, flags };
}

export const useAppDirectives = (): AppDirectives => {
  const { get } = useSiteContent();
  const appInstructions = get("app_instructions", "");

  return useMemo(() => {
    const { values, flags } = parseDirectives(appInstructions);

    return {
      raw: values,
      hasFlag: (flag: string) => flags.has(flag) || flag in values,
      getValue: (key: string, fallback = "") => values[key] ?? fallback,
      getNumber: (key: string, fallback = 0) => {
        const v = values[key];
        if (v === undefined) return fallback;
        const n = Number(v);
        return isNaN(n) ? fallback : n;
      },
    };
  }, [appInstructions]);
};
