import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrendAlert {
  type: 'mood_drop' | 'mood_improvement' | 'stress_spike' | 'stress_relief' | 'low_activity';
  severity: 'info' | 'warning' | 'positive';
  title: string;
  body: string;
  change?: number;
}

// Threshold configurations
const THRESHOLDS = {
  MOOD_DROP_PERCENT: 25,       // Alert if mood drops by 25% or more
  MOOD_IMPROVEMENT_PERCENT: 25, // Alert if mood improves by 25% or more
  STRESS_SPIKE_PERCENT: 30,    // Alert if stress spikes by 30% or more
  STRESS_RELIEF_PERCENT: 25,   // Alert if stress decreases by 25% or more
  MIN_DATA_POINTS: 2,          // Minimum data points needed for comparison
  LOW_ACTIVITY_DAYS: 5,        // Alert if no activity for 5+ days
};

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function generateAlerts(
  currentData: { mood: number; stress: number; clarity: number; coping: number },
  previousData: { mood: number; stress: number; clarity: number; coping: number },
  daysSinceLastActivity: number,
  isHebrew: boolean
): TrendAlert[] {
  const alerts: TrendAlert[] = [];

  // Mood drop alert
  const moodChange = calculateChange(currentData.mood, previousData.mood);
  if (moodChange <= -THRESHOLDS.MOOD_DROP_PERCENT) {
    alerts.push({
      type: 'mood_drop',
      severity: 'warning',
      title: isHebrew ? '🔔 שינוי במצב הרוח' : '🔔 Mood Change Detected',
      body: isHebrew 
        ? `זיהינו ירידה של ${Math.abs(moodChange)}% במצב הרוח שלך בהשוואה לשבוע הקודם. אולי כדאי לבדוק מה השתנה.`
        : `We noticed a ${Math.abs(moodChange)}% drop in your mood compared to last week. It might be worth checking what changed.`,
      change: moodChange
    });
  }

  // Mood improvement alert
  if (moodChange >= THRESHOLDS.MOOD_IMPROVEMENT_PERCENT) {
    alerts.push({
      type: 'mood_improvement',
      severity: 'positive',
      title: isHebrew ? '🌟 שיפור במצב הרוח' : '🌟 Mood Improvement',
      body: isHebrew
        ? `מדהים! מצב הרוח שלך עלה ב-${moodChange}% בהשוואה לשבוע שעבר. המשך ככה!`
        : `Amazing! Your mood improved by ${moodChange}% compared to last week. Keep it up!`,
      change: moodChange
    });
  }

  // Stress spike alert (note: for stress, higher is worse)
  const stressChange = calculateChange(currentData.stress, previousData.stress);
  if (stressChange >= THRESHOLDS.STRESS_SPIKE_PERCENT) {
    alerts.push({
      type: 'stress_spike',
      severity: 'warning',
      title: isHebrew ? '⚠️ עלייה ברמת הלחץ' : '⚠️ Stress Level Rising',
      body: isHebrew
        ? `רמת הלחץ שלך עלתה ב-${stressChange}% לעומת השבוע הקודם. נסה לקחת זמן לעצמך.`
        : `Your stress level increased by ${stressChange}% from last week. Try to take some time for yourself.`,
      change: stressChange
    });
  }

  // Stress relief alert
  if (stressChange <= -THRESHOLDS.STRESS_RELIEF_PERCENT) {
    alerts.push({
      type: 'stress_relief',
      severity: 'positive',
      title: isHebrew ? '😌 ירידה ברמת הלחץ' : '😌 Stress Relief',
      body: isHebrew
        ? `רמת הלחץ שלך ירדה ב-${Math.abs(stressChange)}%! נראה שמשהו עוזר.`
        : `Your stress level dropped by ${Math.abs(stressChange)}%! Something seems to be helping.`,
      change: stressChange
    });
  }

  // Low activity alert
  if (daysSinceLastActivity >= THRESHOLDS.LOW_ACTIVITY_DAYS) {
    alerts.push({
      type: 'low_activity',
      severity: 'info',
      title: isHebrew ? '💭 לא שמענו ממך' : '💭 We Miss You',
      body: isHebrew
        ? `עברו ${daysSinceLastActivity} ימים מאז שכתבת. כתיבה יומית עוזרת לעקוב אחרי ההרגשה שלך.`
        : `It's been ${daysSinceLastActivity} days since you wrote. Daily writing helps track how you're feeling.`,
    });
  }

  return alerts;
}

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting trend alerts check...");

    // Get all users with push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id");

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      throw subError;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No users with push subscriptions found");
      return new Response(
        JSON.stringify({ success: true, message: "No subscriptions to check" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(currentWeekStart);

    let alertsSent = 0;

    for (const sub of subscriptions) {
      const userId = sub.user_id;

      try {
        // Get current week emotion ratings
        const { data: currentRatings } = await supabase
          .from("weekly_emotion_ratings")
          .select("rating, created_at")
          .eq("user_id", userId)
          .gte("created_at", currentWeekStart.toISOString())
          .lte("created_at", now.toISOString());

        // Get previous week emotion ratings
        const { data: previousRatings } = await supabase
          .from("weekly_emotion_ratings")
          .select("rating, created_at")
          .eq("user_id", userId)
          .gte("created_at", previousWeekStart.toISOString())
          .lt("created_at", previousWeekEnd.toISOString());

        // Get current week questionnaires
        const { data: currentQuestionnaires } = await supabase
          .from("weekly_questionnaires")
          .select("*")
          .eq("user_id", userId)
          .gte("week_start", currentWeekStart.toISOString())
          .lte("week_start", now.toISOString())
          .order("week_start", { ascending: false })
          .limit(1);

        // Get previous week questionnaires
        const { data: previousQuestionnaires } = await supabase
          .from("weekly_questionnaires")
          .select("*")
          .eq("user_id", userId)
          .gte("week_start", previousWeekStart.toISOString())
          .lt("week_start", previousWeekEnd.toISOString())
          .order("week_start", { ascending: false })
          .limit(1);

        // Get last activity date
        const { data: lastMessage } = await supabase
          .from("messages")
          .select("created_at")
          .eq("user_id", userId)
          .eq("role", "user")
          .order("created_at", { ascending: false })
          .limit(1);

        const daysSinceLastActivity = lastMessage && lastMessage.length > 0
          ? Math.floor((now.getTime() - new Date(lastMessage[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        // Calculate averages
        const currentMoodAvg = currentRatings && currentRatings.length >= THRESHOLDS.MIN_DATA_POINTS
          ? currentRatings.reduce((acc, r) => acc + r.rating, 0) / currentRatings.length
          : null;

        const previousMoodAvg = previousRatings && previousRatings.length >= THRESHOLDS.MIN_DATA_POINTS
          ? previousRatings.reduce((acc, r) => acc + r.rating, 0) / previousRatings.length
          : null;

        let currentData = { mood: 3, stress: 3, clarity: 3, coping: 3 };
        let previousData = { mood: 3, stress: 3, clarity: 3, coping: 3 };

        // Use questionnaire data if available
        if (currentQuestionnaires && currentQuestionnaires.length > 0) {
          const q = currentQuestionnaires[0];
          currentData = {
            mood: q.q1_feeling_vs_last_week,
            stress: q.q2_stress_level,
            clarity: q.q3_clarity,
            coping: q.q4_coping_ability
          };
        } else if (currentMoodAvg !== null) {
          currentData.mood = currentMoodAvg;
        }

        if (previousQuestionnaires && previousQuestionnaires.length > 0) {
          const q = previousQuestionnaires[0];
          previousData = {
            mood: q.q1_feeling_vs_last_week,
            stress: q.q2_stress_level,
            clarity: q.q3_clarity,
            coping: q.q4_coping_ability
          };
        } else if (previousMoodAvg !== null) {
          previousData.mood = previousMoodAvg;
        }

        // Skip if no meaningful data to compare
        const hasCurrentData = currentQuestionnaires?.length || (currentRatings && currentRatings.length >= THRESHOLDS.MIN_DATA_POINTS);
        const hasPreviousData = previousQuestionnaires?.length || (previousRatings && previousRatings.length >= THRESHOLDS.MIN_DATA_POINTS);

        if (!hasCurrentData && !hasPreviousData && daysSinceLastActivity < THRESHOLDS.LOW_ACTIVITY_DAYS) {
          console.log(`User ${userId}: Not enough data for trend analysis`);
          continue;
        }

        // Generate alerts
        const alerts = generateAlerts(
          currentData,
          previousData,
          daysSinceLastActivity,
          true // Default to Hebrew
        );

        // Send notifications for each alert
        for (const alert of alerts) {
          console.log(`Sending ${alert.type} alert to user ${userId}`);

          const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              userId: userId,
              title: alert.title,
              body: alert.body,
              url: "/monthly-summary",
            }),
          });

          if (pushResponse.ok) {
            alertsSent++;
            console.log(`Alert sent to user ${userId}: ${alert.type}`);
          } else {
            console.log(`Failed to send alert to user ${userId}`);
          }
        }

      } catch (userError) {
        console.error(`Error processing user ${userId}:`, userError);
        continue;
      }
    }

    console.log(`Trend alerts completed. Sent ${alertsSent} alerts.`);

    return new Response(
      JSON.stringify({ success: true, alertsSent }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Trend alerts error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
