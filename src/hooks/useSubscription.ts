import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionStatus {
  subscribed: boolean;
  tier: 'free' | 'basic' | 'premium';
  subscription_status?: string;
  paypal_email?: string | null;
  trial_end_date?: string | null;
  is_trial?: boolean;
  current_period_end?: string | null;
}

export function useSubscription() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubscriptionStatus({ subscribed: false, tier: 'free', is_trial: false });
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_tier, trial_end_date, paypal_email')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!profile) {
        setSubscriptionStatus({ subscribed: false, tier: 'free', is_trial: false });
        setLoading(false);
        return;
      }

      const isActive = profile.subscription_status === 'active';

      setSubscriptionStatus({
        subscribed: isActive,
        tier: isActive ? (profile.subscription_tier as 'free' | 'basic' | 'premium') : 'free',
        subscription_status: profile.subscription_status,
        paypal_email: profile.paypal_email,
        trial_end_date: null,
        is_trial: false,
      });
    } catch (err) {
      console.error('Error checking subscription:', err);
      setError(err as Error);
      setSubscriptionStatus({ subscribed: false, tier: 'free', is_trial: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const isSubscribed = subscriptionStatus?.subscribed ?? false;
  const tier = subscriptionStatus?.tier ?? 'free';
  const isTrial = subscriptionStatus?.is_trial ?? false;
  const trialEndsAt = subscriptionStatus?.trial_end_date ?? null;

  return {
    subscription: subscriptionStatus,
    loading,
    error,
    isSubscribed,
    tier,
    isTrial,
    trialEndsAt,
    refetch: fetchSubscription,
  };
}
