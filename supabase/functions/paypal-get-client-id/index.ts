import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
    const planIdBasic = Deno.env.get('PAYPAL_PLAN_ID_BASIC');
    const planIdPremium = Deno.env.get('PAYPAL_PLAN_ID_PREMIUM');
    const planIdMonthly = Deno.env.get('PAYPAL_PLAN_ID_MONTHLY');
    const planIdYearly = Deno.env.get('PAYPAL_PLAN_ID_YEARLY');

    if (!clientId) {
      throw new Error('PayPal client ID not configured');
    }

    return new Response(JSON.stringify({
      client_id: clientId,
      plan_id_basic: planIdBasic || '',
      plan_id_premium: planIdPremium || '',
      plan_id_monthly: planIdMonthly || '',
      plan_id_yearly: planIdYearly || '',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
