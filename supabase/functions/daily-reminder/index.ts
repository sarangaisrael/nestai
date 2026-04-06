import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Validate cron secret for scheduled function calls (mandatory)
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');
    
    if (!expectedSecret || cronSecret !== expectedSecret) {
      console.error("Unauthorized: Invalid or missing cron secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    console.log(`Running daily reminder at ${now.toISOString()}`);

    // Process each user
    for (const user of users.users) {
      // Check if user has written anything today
      const { data: todayMessages, error: messagesError } = await supabase
        .from("messages")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "user")
        .eq("is_system", false)
        .gte("created_at", todayStart.toISOString())
        .limit(1);

      if (messagesError) {
        console.error(`Error checking messages for user ${user.id}:`, messagesError);
        continue;
      }

      // If user has written today, skip
      if (todayMessages && todayMessages.length > 0) {
        console.log(`User ${user.id} has already written today, skipping reminder`);
        continue;
      }

      // Insert system reminder message
      const { error: insertError } = await supabase.from("messages").insert([
        {
          user_id: user.id,
          text: "איך היה לך היום? זמן לכתוב ב-NestAI",
          role: "assistant",
          is_system: true,
          reply_count: 0,
        },
      ]);

      if (insertError) {
        console.error(`Error inserting reminder for user ${user.id}:`, insertError);
        continue;
      }

      console.log(`Successfully sent reminder to user ${user.id}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Daily reminder error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
