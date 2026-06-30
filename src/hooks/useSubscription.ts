import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionState {
  isActive: boolean;
  plan: "trial" | "monthly" | "yearly" | "cancelled" | null;
  daysLeft: number;
  isExpired: boolean;
  loading: boolean;
}

export const useSubscription = (): SubscriptionState => {
  const [state, setState] = useState<SubscriptionState>({
    isActive: true,
    plan: "trial",
    daysLeft: 7,
    isExpired: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          if (!cancelled)
            setState({
              isActive: false,
              plan: null,
              daysLeft: 0,
              isExpired: true,
              loading: false,
            });
          return;
        }

        const { data, error } = await supabase
          .from("subscriptions")
          .select("plan, is_active, expires_at")
          .eq("user_id", session.user.id)
          .maybeSingle();

        if (cancelled) return;

        if (error || !data) {
          // No row yet (new user, trigger may not have fired) — treat as fresh trial
          setState({
            isActive: true,
            plan: "trial",
            daysLeft: 7,
            isExpired: false,
            loading: false,
          });
          return;
        }

        const now = new Date();
        const expires = new Date(data.expires_at);
        const msLeft = expires.getTime() - now.getTime();
        const daysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
        const isActive = data.is_active === true && expires > now;

        setState({
          isActive,
          plan: data.plan as SubscriptionState["plan"],
          daysLeft,
          isExpired: !isActive,
          loading: false,
        });
      } catch {
        // Network failure — default to active so we never incorrectly lock users out
        if (!cancelled)
          setState({
            isActive: true,
            plan: "trial",
            daysLeft: 7,
            isExpired: false,
            loading: false,
          });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
};
