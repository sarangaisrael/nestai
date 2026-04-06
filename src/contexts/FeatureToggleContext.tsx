import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FeatureToggle {
  id: string;
  key: string;
  label: string;
  enabled: boolean;
  category: "nav" | "feature";
  config: Record<string, any>;
}

interface FeatureToggleContextType {
  toggles: FeatureToggle[];
  loading: boolean;
  isEnabled: (key: string) => boolean;
  getNavItems: () => FeatureToggle[];
  refresh: () => Promise<void>;
}

const FeatureToggleContext = createContext<FeatureToggleContextType>({
  toggles: [],
  loading: true,
  isEnabled: () => true,
  getNavItems: () => [],
  refresh: async () => {},
});

export const useFeatureToggles = () => useContext(FeatureToggleContext);

export const FeatureToggleProvider = ({ children }: { children: ReactNode }) => {
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchToggles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("feature_toggles")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching feature toggles:", error);
        return;
      }

      setToggles((data || []).map((row: any) => ({
        id: row.id,
        key: row.key,
        label: row.label,
        enabled: row.enabled,
        category: row.category as "nav" | "feature",
        config: row.config || {},
      })));
    } catch (err) {
      console.error("Error in FeatureToggleProvider:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToggles();
  }, [fetchToggles]);

  const isEnabled = useCallback(
    (key: string) => {
      const toggle = toggles.find((t) => t.key === key);
      return toggle ? toggle.enabled : true; // default enabled if not found
    },
    [toggles]
  );

  const getNavItems = useCallback(
    () =>
      toggles
        .filter((t) => t.category === "nav" && t.enabled)
        .sort((a, b) => (a.config.order || 0) - (b.config.order || 0)),
    [toggles]
  );

  return (
    <FeatureToggleContext.Provider value={{ toggles, loading, isEnabled, getNavItems, refresh: fetchToggles }}>
      {children}
    </FeatureToggleContext.Provider>
  );
};
