import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import DOMPurify from "dompurify";

interface SiteContentMap {
  [key: string]: string;
}

interface SiteContentContextType {
  content: SiteContentMap;
  loading: boolean;
  get: (key: string, fallback?: string) => string;
  refresh: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextType>({
  content: {},
  loading: true,
  get: (_key: string, fallback?: string) => fallback || "",
  refresh: async () => {},
});

export const useSiteContent = () => useContext(SiteContentContext);

export const SiteContentProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<SiteContentMap>({});
  const [loading, setLoading] = useState(true);

  const fetchContent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("system_messages")
        .select("title, body")
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching site content:", error);
        return;
      }

      const map: SiteContentMap = {};
      (data || []).forEach((row) => {
        map[row.title] = row.body;
      });
      setContent(map);
    } catch (err) {
      console.error("Error in SiteContentProvider:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const stripHtml = useCallback((html: string): string => {
    if (!html || !html.includes("<")) return html;
    const sanitized = DOMPurify.sanitize(html, { ALLOWED_TAGS: [] as string[] }) as string;
    return sanitized;
  }, []);

  const get = useCallback(
    (key: string, fallback?: string) => {
      const raw = content[key] ?? fallback ?? "";
      return stripHtml(raw);
    },
    [content, stripHtml]
  );

  return (
    <SiteContentContext.Provider value={{ content, loading, get, refresh: fetchContent }}>
      {children}
    </SiteContentContext.Provider>
  );
};
