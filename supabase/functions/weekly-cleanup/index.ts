import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Runs every Saturday at 21:00 UTC (midnight Israel time / Sat 00:00 IST)
// Cron: 0 21 * * 5  (Friday 21:00 UTC = Saturday 00:00 Israel)

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");

  if (!expectedSecret || cronSecret !== expectedSecret) {
    console.error("weekly-cleanup: Unauthorized");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("weekly-cleanup: Starting...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    const cutoffIso = cutoff.toISOString();

    console.log(`weekly-cleanup: Cutoff date: ${cutoffIso}`);

    // Fetch all users who have weekly summaries enabled
    const { data: users, error: usersError } = await supabase
      .from("user_preferences")
      .select("user_id")
      .eq("weekly_summary_enabled", true);

    if (usersError) throw usersError;

    console.log(`weekly-cleanup: Processing ${users?.length || 0} users`);

    let cleanedCount = 0;
    let skippedCount = 0;

    for (const user of users || []) {
      try {
        // Verify a weekly summary exists created within the last 7 days
        // (i.e. the weekly summary ran successfully this cycle before cleanup)
        const { data: recentSummary } = await supabase
          .from("weekly_summaries")
          .select("id")
          .eq("user_id", user.user_id)
          .gte("created_at", cutoffIso)
          .limit(1)
          .maybeSingle();

        if (!recentSummary) {
          console.log(
            `weekly-cleanup: No recent weekly summary for user ${user.user_id}, skipping cleanup`
          );
          skippedCount++;
          continue;
        }

        // Delete chat messages older than 7 days
        const { error: msgError, count: msgCount } = await supabase
          .from("messages")
          .delete({ count: "exact" })
          .eq("user_id", user.user_id)
          .lt("created_at", cutoffIso);

        if (msgError) {
          console.error(`weekly-cleanup: messages delete error for ${user.user_id}:`, msgError);
        }

        // Delete mood entries older than 7 days
        const { error: moodError, count: moodCount } = await supabase
          .from("mood_entries")
          .delete({ count: "exact" })
          .eq("user_id", user.user_id)
          .lt("created_at", cutoffIso);

        if (moodError) {
          console.error(`weekly-cleanup: mood_entries delete error for ${user.user_id}:`, moodError);
        }

        // Delete weekly emotion ratings older than 7 days
        const { error: ratingError, count: ratingCount } = await supabase
          .from("weekly_emotion_ratings")
          .delete({ count: "exact" })
          .eq("user_id", user.user_id)
          .lt("created_at", cutoffIso);

        if (ratingError) {
          console.error(
            `weekly-cleanup: weekly_emotion_ratings delete error for ${user.user_id}:`,
            ratingError
          );
        }

        console.log(
          `weekly-cleanup: Cleaned user ${user.user_id} — ` +
            `messages: ${msgCount ?? 0}, moods: ${moodCount ?? 0}, ratings: ${ratingCount ?? 0}`
        );
        cleanedCount++;
      } catch (userError) {
        console.error(`weekly-cleanup: Error processing user ${user.user_id}:`, userError);
      }
    }

    const summary = {
      success: true,
      cutoff: cutoffIso,
      usersProcessed: cleanedCount,
      usersSkipped: skippedCount,
    };

    console.log(`✅ weekly-cleanup complete:`, summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("weekly-cleanup: Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
