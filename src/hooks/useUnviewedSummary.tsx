import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUnviewedSummary = () => {
  const [hasUnviewed, setHasUnviewed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUnviewedSummary();

    // Set up realtime subscription for new summaries
    const channel = supabase
      .channel('weekly_summaries_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'weekly_summaries',
        },
        () => {
          checkUnviewedSummary();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkUnviewedSummary = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setHasUnviewed(false);
        setLoading(false);
        return;
      }

      // Check if there's at least one summary that hasn't been viewed
      const { data, error } = await supabase
        .from("weekly_summaries")
        .select("id, viewed_at")
        .eq("user_id", session.user.id)
        .is("viewed_at", null)
        .limit(1);

      if (error) {
        console.error("Error checking unviewed summaries:", error);
        setHasUnviewed(false);
      } else {
        setHasUnviewed((data || []).length > 0);
      }
    } catch (error) {
      console.error("Error in checkUnviewedSummary:", error);
      setHasUnviewed(false);
    } finally {
      setLoading(false);
    }
  };

  return { hasUnviewed, loading, refresh: checkUnviewedSummary };
};
