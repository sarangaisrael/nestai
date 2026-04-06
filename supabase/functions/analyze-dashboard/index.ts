import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ narrative: null, noData: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const recentMessages = messages.slice(-100);
    const combined = recentMessages.join("\n---\n");

    const systemPrompt = `אתה מנתח רגשי מומחה שמייצר תובנות נרטיביות חמות ואנושיות מתוך יומן אישי.
הפלט שלך חייב להיות בעברית בלבד. אסור אנגלית.

עליך להחזיר JSON בפורמט הבא (ללא markdown, ללא backticks):
{
  "keyInsight": "משפט אחד עוצמתי שמסכם את מה שקורה אצל הכותב. כתוב בגוף שני (אתה/את).",
  "emotionBreakdown": [
    { "emotion": "שם הרגש (למשל: שמחה, חרדה, עצב, רוגע, תסכול, תקווה)", "percent": 35, "color": "צבע hex מתאים לרגש" }
  ],
  "connectionInsight": {
    "personName": "שם האדם המרכזי",
    "personIcon": "אימוג'י מתאים",
    "percentInPositive": 65,
    "connectedArea": "תחום החיים שמושפע (למשל: עבודה, קריירה, משפחה)",
    "changePercent": 12,
    "direction": "up או down",
    "narrative": "פסקה קצרה (2-3 משפטים) שמקשרת בין האדם הזה לשינוי במצב הרגשי. למשל: החודש, נעה הופיעה ב-65% מהרשומות החיוביות שלך. שמנו לב שכשאתה מתמקד במערכת היחסים הזו, רמות הלחץ שלך בנוגע לעבודה נוטות לרדת."
  },
  "people": [
    {
      "name": "שם האדם",
      "icon": "אימוג'י מתאים",
      "narrative": "משפט אחד שמתאר את הדינמיקה עם האדם הזה."
    }
  ],
  "narrativeShift": {
    "from": "הנושא שממנו עברת",
    "to": "הנושא שאליו עברת",
    "story": "משפט אחד שמספר את סיפור השינוי."
  },
  "emotionalUndercurrent": "משפט אחד שמתאר רגש תת-קרקעי."
}

כללים:
- emotionBreakdown: חייב לכלול 3-5 רגשות. הסכום של האחוזים חייב להיות 100. השתמש בצבעי hex יפים ורכים.
- connectionInsight: קשר בין אדם מרכזי לתחום חיים. personName ו-personIcon חובה. percentInPositive = באיזה אחוז מהרשומות החיוביות מופיע האדם. connectedArea = תחום חיים שמושפע. changePercent = שינוי באחוזים. direction = up/down. narrative = פסקה נרטיבית. אם אין אנשים מספיק, כתוב narrative כללי על קשרים.
- people: החזר לכל היותר 2 אנשים מרכזיים שמוזכרים הכי הרבה. אם אין אנשים, החזר מערך ריק.
- אם אין מספיק מידע לנרטיב מסוים, כתוב משפט כללי חם ותומך.
- תמיד כתוב בגוף שני תומך.
- העדף תובנות שמקשרות בין שני תחומי חיים שונים.`;

    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `הנה רשומות היומן מהתקופה האחרונה:\n\n${combined}` },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    let narrative;
    try {
      const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
      narrative = JSON.parse(cleaned);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", content);
      narrative = {
        keyInsight: content.slice(0, 200),
        emotionBreakdown: [],
        emotionTrend: [],
        people: [],
        narrativeShift: null,
        emotionalUndercurrent: null,
      };
    }

    // Ensure people is limited to 2
    if (narrative.people && narrative.people.length > 2) {
      narrative.people = narrative.people.slice(0, 2);
    }

    return new Response(
      JSON.stringify({ narrative }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-dashboard error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
