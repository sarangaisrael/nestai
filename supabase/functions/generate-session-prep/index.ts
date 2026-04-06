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

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(authHeader?.replace("Bearer ", "") || "");
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get past 7 days of messages
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [messagesResult, moodsResult, prefsResult] = await Promise.all([
      supabase.from("messages").select("text, created_at")
        .eq("user_id", user.id).eq("role", "user")
        .gte("created_at", weekAgo.toISOString())
        .order("created_at", { ascending: true }),
      supabase.from("mood_entries").select("mood, created_at")
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString()),
      supabase.from("user_preferences").select("therapy_type, summary_focus")
        .eq("user_id", user.id).maybeSingle(),
    ]);

    const messages = messagesResult.data || [];
    const moods = moodsResult.data || [];

    if (messages.length === 0) {
      return new Response(JSON.stringify({ topics: [], noData: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decrypt messages
    const decryptedTexts: string[] = [];
    for (const msg of messages) {
      let text = msg.text;
      if (encryptionKey && looksEncrypted(text)) {
        try { text = await decryptText(text, encryptionKey); } catch { /* keep original */ }
      }
      decryptedTexts.push(text);
    }

    const moodMap: Record<string, string> = { happy: "שמח/ה", anxious: "חרד/ה", exhausted: "מותש/ת", sad: "עצוב/ה", calm: "רגוע/ה" };
    const moodSummary = moods.length > 0
      ? moods.map(m => moodMap[m.mood] || m.mood).join(", ")
      : "אין דיווחי מצב רוח";

    const therapyType = prefsResult.data?.therapy_type || "general";
    const therapyLabel = therapyType === "cbt" ? "קוגניטיבי-התנהגותי" : therapyType === "psychodynamic" ? "פסיכודינמי" : "כללי";

    const systemPrompt = `אתה מומחה בהכנה לפגישות טיפול. תפקידך לזקק את הכתיבה של השבוע האחרון ל-3-4 נושאים מרכזיים שהכי רלוונטיים לפגישת טיפול של 50 דקות.

כללים:
- הכל בעברית בלבד. אסור אנגלית.
- כל נושא: כותרת קצרה (3-5 מילים) + הסבר של משפט אחד שמתאר למה זה חשוב לדון בזה
- תעדוף: רגשות חוזרים, אירועים משמעותיים, דפוסים, קונפליקטים פנימיים
- שפה חמה ותומכת, לא קלינית
- סוג הטיפול: ${therapyLabel}
- אל תמציא מידע שלא מופיע בנתונים`;

    const userPrompt = `הנה הכתיבה של השבוע האחרון (${decryptedTexts.length} רשומות):

${decryptedTexts.join("\n\n")}

מצבי רוח שדווחו: ${moodSummary}

זקק את זה ל-3-4 הנושאים הכי חשובים לפגישת הטיפול הבאה.`;

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
            name: "generate_session_topics",
            description: "Generate 3-4 therapy session topics",
            parameters: {
              type: "object",
              properties: {
                topics: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Short topic title (3-5 words in Hebrew)" },
                      description: { type: "string", description: "One sentence explaining why this is important (Hebrew)" },
                      emoji: { type: "string", description: "Single relevant emoji" },
                    },
                    required: ["title", "description", "emoji"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["topics"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "generate_session_topics" } },
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
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let topics: any[] = [];

    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        topics = parsed.topics || [];
      } catch { /* fallback empty */ }
    }

    return new Response(JSON.stringify({ topics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("session-prep error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
