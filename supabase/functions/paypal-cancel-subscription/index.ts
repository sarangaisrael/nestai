import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    // Get user's subscription ID from profile
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('paypal_transaction_id, subscription_status')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.paypal_transaction_id) {
      return new Response(JSON.stringify({ error: 'No active subscription found' }), {
        status: 400, headers: corsHeaders,
      });
    }

    if (profile.subscription_status !== 'active') {
      return new Response(JSON.stringify({ error: 'Subscription is not active' }), {
        status: 400, headers: corsHeaders,
      });
    }

    const subscriptionId = profile.paypal_transaction_id;

    // Cancel subscription via PayPal API
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID')!;
    const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET')!;

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

    const cancelRes = await fetch(`https://api-m.paypal.com/v1/billing/subscriptions/${subscriptionId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'User requested cancellation' }),
    });

    if (!cancelRes.ok && cancelRes.status !== 204) {
      const errBody = await cancelRes.text();
      throw new Error(`PayPal cancel failed: ${cancelRes.status} ${errBody}`);
    }

    // Update profile
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        is_premium: false,
        subscription_status: 'cancelled',
        subscription_tier: 'free',
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update profile: ${updateError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Cancel subscription error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
