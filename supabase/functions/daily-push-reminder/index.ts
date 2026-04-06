import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate cron secret
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("CRON_SECRET");

    if (!expectedSecret || cronSecret !== expectedSecret) {
      console.error("Unauthorized: Invalid or missing cron secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if daily reminder is enabled via admin settings
    const { data: settingsRow } = await supabase
      .from("system_messages")
      .select("body")
      .eq("title", "daily_push_settings")
      .maybeSingle();

    if (settingsRow?.body) {
      try {
        const settings = JSON.parse(settingsRow.body);
        if (settings.enabled === false) {
          console.log("daily-push-reminder: Disabled by admin, skipping");
          return new Response(
            JSON.stringify({ success: true, sent: 0, message: "Disabled by admin" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch { /* use defaults, continue */ }
    }

    console.log("daily-push-reminder: Starting at", new Date().toISOString());

    // Get all users with push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id");

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("daily-push-reminder: No push subscriptions found");
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: "No subscriptions" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const title = "NestAI";
    const body = "איך היה לך היום? זמן לכתוב ב-NestAI";
    const url = "/app/dashboard?from=daily-reminder";

    let successCount = 0;
    let failCount = 0;

    for (const sub of subscriptions) {
      try {
        const pushResponse = await fetch(
          `${supabaseUrl}/functions/v1/send-push-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              userId: sub.user_id,
              title,
              body,
              url,
            }),
          }
        );

        if (pushResponse.ok) {
          successCount++;
        } else {
          failCount++;
          const errText = await pushResponse.text();
          console.error(`Push failed for ${sub.user_id}: ${errText}`);
        }
      } catch (error) {
        failCount++;
        console.error(`Error sending push to ${sub.user_id}:`, error);
      }
    }

    console.log(
      `daily-push-reminder: Done. ${successCount} sent, ${failCount} failed out of ${subscriptions.length}`
    );

    return new Response(
      JSON.stringify({ success: true, sent: successCount, failed: failCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("daily-push-reminder error:", error);
    return new Response(
      JSON.stringify({ error: error?.message ?? String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
