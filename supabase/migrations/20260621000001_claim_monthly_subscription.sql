-- RPC callable by any authenticated user to upgrade their own subscription
-- to monthly (30 days) after completing a PayPal payment on /month page.
create or replace function public.claim_monthly_subscription()
returns void language plpgsql security definer as $$
begin
  -- Only operates on the calling user's own row
  insert into public.subscriptions (user_id, plan, is_active, starts_at, expires_at, updated_at)
  values (auth.uid(), 'monthly', true, now(), now() + interval '30 days', now())
  on conflict (user_id) do update
    set plan       = 'monthly',
        is_active  = true,
        starts_at  = now(),
        expires_at = now() + interval '30 days',
        updated_at = now();
end;
$$;

-- Grant to authenticated users only
grant execute on function public.claim_monthly_subscription() to authenticated;
