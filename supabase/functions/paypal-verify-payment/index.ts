import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_TIERS = ['basic', 'premium', 'monthly', 'yearly'];

// Map billing tiers to subscription tier names
function getSubscriptionTier(tier: string): string {
  if (tier === 'monthly' || tier === 'yearly' || tier === 'premium') return 'premium';
  return 'basic';
}

function getExpectedPlanId(tier: string): string | undefined {
  switch (tier) {
    case 'basic': return Deno.env.get('PAYPAL_PLAN_ID_BASIC');
    case 'premium': return Deno.env.get('PAYPAL_PLAN_ID_PREMIUM');
    case 'monthly': return Deno.env.get('PAYPAL_PLAN_ID_MONTHLY');
    case 'yearly': return Deno.env.get('PAYPAL_PLAN_ID_YEARLY');
    default: return undefined;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = user.id;

    const { subscription_id, tier } = await req.json();

    // Validate inputs
    if (!subscription_id || typeof subscription_id !== 'string' || subscription_id.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid subscription_id' }), { status: 400, headers: corsHeaders });
    }
    if (!tier || !VALID_TIERS.includes(tier)) {
      return new Response(JSON.stringify({ error: 'Invalid tier' }), { status: 400, headers: corsHeaders });
    }

    // Verify subscription with PayPal API
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID')!;
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')!;

    // Get access token
    const tokenRes = await fetch('https://api-m.paypal.com/v1/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      throw new Error('Failed to get PayPal access token');
    }

    // Verify subscription status
    const subRes = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${subscription_id}`, {
      headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
    });
    const subData = await subRes.json();

    if (subData.status !== 'ACTIVE' && subData.status !== 'APPROVED') {
      return new Response(JSON.stringify({ error: 'Subscription not active', status: subData.status }), {
        status: 400, headers: corsHeaders,
      });
    }

    // Verify the plan ID matches the expected tier
    const expectedPlanId = getExpectedPlanId(tier);
    if (expectedPlanId && subData.plan_id !== expectedPlanId) {
      return new Response(JSON.stringify({ error: 'Plan ID mismatch' }), {
        status: 400, headers: corsHeaders,
      });
    }

    const payerEmail = subData.subscriber?.email_address || null;
    const subscriptionTier = getSubscriptionTier(tier);

    // Update profile using service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_premium: true,
        subscription_tier: subscriptionTier,
        subscription_status: 'active',
        paypal_transaction_id: subscription_id,
        paypal_email: payerEmail,
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    // Also upsert into subscriptions table
    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        paypal_subscription_id: subscription_id,
        plan_id: expectedPlanId,
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: subData.billing_info?.next_billing_time || null,
      }, { onConflict: 'user_id' });

    if (subError) {
      console.error('Failed to upsert subscription:', subError);
    }

    return new Response(JSON.stringify({ success: true, tier: subscriptionTier }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('PayPal verify error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
