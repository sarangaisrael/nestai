import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

    // Auth check - must be admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all weekly summaries (last 30 days for relevance)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: summaries, error: fetchError } = await supabase
      .from("weekly_summaries")
      .select("summary_text, user_id")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;

    if (!summaries || summaries.length === 0) {
      return new Response(
        JSON.stringify({ insights: null, message: "אין סיכומים לניתוח" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Count unique users
    const uniqueUsers = new Set(summaries.map(s => s.user_id)).size;

    // Combine all summary texts (anonymized - strip user_id before sending to AI)
    const anonymizedTexts = summaries.map((s, i) => `סיכום ${i + 1}:\n${s.summary_text}`).join("\n\n---\n\n");

    const systemPrompt = `אתה מנתח תוכן מומחה. קיבלת ${summaries.length} סיכומים שבועיים אנונימיים מ-${uniqueUsers} משתמשים שונים (30 יום אחרונים).

משימתך: לנתח את הסיכומים ולהחזיר נתונים סטטיסטיים אגרגטיביים בלבד.

חובה להחזיר JSON בפורמט הבא בלבד (ללא טקסט נוסף):
{
  "emotions": [
    { "name": "חרדה", "percentage": 45, "trend": "up" },
    { "name": "לחץ", "percentage": 38, "trend": "stable" },
    { "name": "שמחה", "percentage": 25, "trend": "up" }
  ],
  "themes": [
    { "name": "עבודה", "percentage": 52 },
    { "name": "מערכות יחסים", "percentage": 40 }
  ]
}

הנחיות חשובות:
1. החזר JSON תקין בלבד - ללא markdown, ללא backticks
2. אחוזים = % מתוך כלל המשתמשים שחוו את הרגש/נושא
3. trend: "up" | "down" | "stable" (הערכה כללית)
4. אל תכלול שום מידע מזהה - רק סטטיסטיקות אגרגטיביות
5. אל תכלול שום טקסט חופשי - רק מספרים ושמות קטגוריות
6. מקסימום 8 רגשות ו-8 נושאים, מסודרים לפי אחוז יורד`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: anonymizedTexts },
        ],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices[0]?.message?.content || "";
    
    // Clean potential markdown wrapping
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

    let insights;
    try {
      insights = JSON.parse(content);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    return new Response(
      JSON.stringify({
        insights,
        meta: {
          total_summaries: summaries.length,
          unique_users: uniqueUsers,
          period: "30 ימים אחרונים",
          generated_at: new Date().toISOString(),
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("content-insights error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
