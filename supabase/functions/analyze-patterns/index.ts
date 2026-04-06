import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function decryptText(encryptedBase64: string, keyString: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
  const cryptoKey = await crypto.subtle.importKey("raw", new Uint8Array(hashBuffer), { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintextBytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ciphertext);
  return new TextDecoder().decode(plaintextBytes);
}

function looksEncrypted(text: string): boolean {
  if (!text || text.length < 20) return false;
  try { const decoded = atob(text); return decoded.length >= 12; } catch { return false; }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const encryptionKey = Deno.env.get("MESSAGE_ENCRYPTION_KEY");
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(authHeader?.replace("Bearer ", "") || "");
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [messagesResult, moodsResult] = await Promise.all([
      supabase.from("messages").select("text, created_at")
        .eq("user_id", user.id).eq("role", "user")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true }),
      supabase.from("mood_entries").select("mood, created_at")
        .eq("user_id", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true }),
    ]);

    const messages = messagesResult.data || [];
    const moods = moodsResult.data || [];

    if (messages.length === 0 && moods.length === 0) {
      return new Response(JSON.stringify({ patterns: [], intensityData: [], noData: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decrypt
    const decryptedEntries: { text: string; date: string }[] = [];
    for (const msg of messages) {
      let text = msg.text;
      if (encryptionKey && looksEncrypted(text)) {
        try { text = await decryptText(text, encryptionKey); } catch { /* keep */ }
      }
      decryptedEntries.push({ text, date: msg.created_at });
    }

    // Group by date for AI context
    const byDate: Record<string, string[]> = {};
    for (const entry of decryptedEntries) {
      const day = new Date(entry.date).toISOString().split("T")[0];
      if (!byDate[day]) byDate[day] = [];
      byDate[day].push(entry.text);
    }

    const moodMap: Record<string, string> = { happy: "שמח/ה", anxious: "חרד/ה", exhausted: "מותש/ת", sad: "עצוב/ה", calm: "רגוע/ה" };
    const moodsByDate: Record<string, string[]> = {};
    for (const m of moods) {
      const day = new Date(m.created_at).toISOString().split("T")[0];
      if (!moodsByDate[day]) moodsByDate[day] = [];
      moodsByDate[day].push(moodMap[m.mood] || m.mood);
    }

    const dateEntries = Object.entries(byDate)
      .map(([date, texts]) => {
        const dayMoods = moodsByDate[date] ? ` | מצבי רוח: ${moodsByDate[date].join(", ")}` : "";
        return `[${date}${dayMoods}]\n${texts.join("\n")}`;
      })
      .join("\n\n");

    const systemPrompt = `אתה מנתח דפוסים רגשיים. תפקידך לנתח 30 יום של כתיבה ולזהות:
1. דפוסים חוזרים (למשל: "מתח סביב עבודה בימי שלישי")
2. טריגרים רגשיים מזוהים
3. מגמות חיוביות או שליליות
4. עוצמה רגשית יומית (1-10) לכל יום שיש בו כתיבה

כללים:
- הכל בעברית בלבד
- שפה חמה ותומכת, לא קלינית
- כל תובנה: כותרת קצרה (3-6 מילים) + הסבר של 1-2 משפטים
- אל תמציא מידע שלא מופיע בנתונים
- עוצמה רגשית: 1=רגוע מאוד, 5=ניטרלי, 10=אינטנסיבי מאוד`;

    const userPrompt = `הנה הכתיבה מ-30 הימים האחרונים:

${dateEntries}

נתח את הנתונים וזהה דפוסים, טריגרים, ועוצמה רגשית יומית.`;

    const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "analyze_patterns",
            description: "Return emotional patterns, triggers, and daily intensity scores",
            parameters: {
              type: "object",
              properties: {
                patterns: {
                  type: "array",
                  description: "3-6 recurring emotional patterns or triggers",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Short pattern title in Hebrew" },
                      description: { type: "string", description: "1-2 sentence explanation in Hebrew" },
                      emoji: { type: "string", description: "Relevant emoji" },
                      type: { type: "string", enum: ["pattern", "trigger", "positive", "warning"], description: "Category of insight" },
                    },
                    required: ["title", "description", "emoji", "type"],
                    additionalProperties: false,
                  },
                },
                intensityData: {
                  type: "array",
                  description: "Daily emotional intensity scores for dates with entries",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string", description: "YYYY-MM-DD format" },
                      intensity: { type: "number", description: "1-10 emotional intensity score" },
                      label: { type: "string", description: "Very short Hebrew label for the day's dominant emotion" },
                    },
                    required: ["date", "intensity", "label"],
                    additionalProperties: false,
                  },
                },
                overallTrend: {
                  type: "string",
                  description: "One sentence Hebrew summary of the overall 30-day emotional trajectory",
                },
              },
              required: ["patterns", "intensityData", "overallTrend"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "analyze_patterns" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let result = { patterns: [], intensityData: [], overallTrend: "" };

    if (toolCall?.function?.arguments) {
      try {
        result = JSON.parse(toolCall.function.arguments);
      } catch { /* fallback empty */ }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("analyze-patterns error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
