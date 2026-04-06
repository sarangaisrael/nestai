import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-256-GCM decryption
async function decryptText(encryptedBase64: string, keyString: string): Promise<string> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
  const keyBytes = new Uint8Array(hashBuffer);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintextBytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ciphertext);
  return decoder.decode(plaintextBytes);
}

function looksEncrypted(text: string): boolean {
  if (!text || text.length < 20) return false;
  try { const decoded = atob(text); return decoded.length >= 12; } catch { return false; }
}

async function decryptMessages(messages: any[], encryptionKey: string | undefined): Promise<string[]> {
  const decrypted: string[] = [];
  for (const msg of messages) {
    let text = msg.text;
    if (encryptionKey && looksEncrypted(text)) {
      try { text = await decryptText(text, encryptionKey); } catch { /* keep original */ }
    }
    decrypted.push(text);
  }
  return decrypted;
}

function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  return { start: new Date(Date.UTC(year, month - 1, 1)), end: new Date(Date.UTC(year, month, 1)) };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const ENCRYPTION_KEY = Deno.env.get("MESSAGE_ENCRYPTION_KEY");

    if (!GEMINI_API_KEY) {
      return new Response(JSON.stringify({ error: "AI key not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Check if caller is admin
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    const isAdmin = !!adminRole;

    const { type, summary_id } = await req.json();

    if (!type || !summary_id) {
      return new Response(JSON.stringify({ error: "Missing type or summary_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the summary belongs to this user (or caller is admin)
    const table = type === "weekly" ? "weekly_summaries" : "monthly_summaries";
    const query = supabase.from(table).select("*").eq("id", summary_id);
    if (!isAdmin) query.eq("user_id", user.id);
    const { data: existing, error: fetchErr } = await query.maybeSingle();

    if (fetchErr || !existing) {
      return new Response(JSON.stringify({ error: "Summary not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use the summary owner's user_id (important when admin regenerates for another user)
    const targetUserId = existing.user_id;

    // Get user preferences
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("therapy_type, summary_focus")
      .eq("user_id", targetUserId)
      .maybeSingle();

    const therapyType = prefs?.therapy_type || null;
    const summaryFocus = prefs?.summary_focus || ["emotions", "thoughts", "behaviors", "changes"];
    const focusAreas = summaryFocus.map((f: string) => {
      const m: Record<string, string> = { emotions: "רגשות", thoughts: "מחשבות", behaviors: "התנהגויות", changes: "שינויים" };
      return m[f] || f;
    }).join(", ");

    const therapyLabel = therapyType === "cbt" ? "קוגניטיבי-התנהגותי" : therapyType === "psychodynamic" ? "פסיכודינמי" : "כללי";

    if (type === "weekly") {
      // ─── WEEKLY REGENERATION ───
      const weekStart = existing.week_start;
      const weekEnd = existing.week_end;

      const { data: messages } = await supabase
        .from("messages")
        .select("text, role, created_at")
        .eq("user_id", targetUserId)
        .eq("role", "user")
        .gte("created_at", weekStart)
        .lte("created_at", weekEnd)
        .order("created_at", { ascending: true });

      if (!messages || messages.length === 0) {
        return new Response(JSON.stringify({ error: "No messages found for this period" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const decryptedMsgs = await decryptMessages(messages, ENCRYPTION_KEY);
      const allMessages = decryptedMsgs.join("\n\n");

      // Fetch admin prompt
      let adminPrompt = "";
      try {
        const { data } = await supabase.from("system_messages").select("body").eq("title", "summary_system_prompt").maybeSingle();
        if (data?.body?.trim()) adminPrompt = data.body.trim();
      } catch { /* use default */ }

      let therapyInstruction = "";
      if (therapyType === "cbt") therapyInstruction = "\n\nהסיכום צריך לשקף גישה קוגניטיבית-התנהגותית: התמקדות במבנה, בדפוסים של מחשבות והתנהגויות.";
      else if (therapyType === "psychodynamic") therapyInstruction = "\n\nהסיכום צריך לשקף גישה פסיכודינמית: התמקדות ברגשות ובנרטיב האישי.";

      const defaultPrompt = `את/ה כותב/ת סיכום שבועי של יומן רגשי אישי.

הסיכום חייב להיות כתוב בעברית, בסגנון נרטיבי וזורם, בפסקאות רציפות ארוכות עם מעברים טבעיים.
אין להשתמש בכותרות, מספור, נקודות או מקפים. הכל כתוב כטקסט רציף.
הטון צריך להיות תומך, רגוע, מכיל אך לא דרמטי ולא כמו רשימת משימות.

התמקדות מיוחדת: ${focusAreas}${therapyInstruction}

המבנה:
1. פסקה קצרה על האווירה הכללית של השבוע
2. פסקה על נושאים רגשיים ומחשבתיים שעלו, דפוסים חוזרים, רגשות חזקים או מחשבות מרכזיות
3. פסקה על עומסים, תפקוד יומיומי או לחץ (אם הופיע)
4. פסקה על מערכות יחסים, בן/בת זוג, נושאים חברתיים או משפחתיים (אם עלו)
5. פסקה על גוף, בריאות, שינה, עייפות או אורח חיים (אם הופיעו)
6. פסקה מסכמת עדינה על "מה אולי יהיה מועיל לקחת לשבוע הבא"

הסיכום חייב להסתמך רק על מה שנכתב ביומן. אסור להמציא מידע.
השפה חייבת להיות ניטרלית מבחינת מגדר.
הטון צריך להיות אמפתי אך לא מחמיא או סנטימנטלי.

בסוף הסיכום, להוסיף חלק בשם "נושאים שכדאי לדבר עליהם בטיפול" ולרשום נושאים מרכזיים.
בסוף, משפט קצר שמזכיר שהסיכום הוא רק כלי רפלקטיבי.

אורך: בינוני.`;

      const systemPrompt = adminPrompt
        ? `${adminPrompt}\n\nהתמקדות מיוחדת: ${focusAreas}${therapyInstruction}`
        : defaultPrompt;

      const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `אפשר לסכם את היומן הבא:\n\n${allMessages}` },
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI error:", errText);
        return new Response(JSON.stringify({ error: "AI generation failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const newSummaryText = aiData.choices[0].message.content;

      const { error: updateErr } = await supabase
        .from("weekly_summaries")
        .update({ summary_text: newSummaryText })
        .eq("id", summary_id);

      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ success: true, summary_text: newSummaryText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (type === "monthly") {
      // ─── MONTHLY REGENERATION ───
      const monthStart = new Date(existing.month_start);
      const monthEnd = new Date(existing.month_end);

      // Calculate 3 periods
      const p1 = { start: monthStart, end: monthEnd };
      const p2Start = new Date(monthStart); p2Start.setMonth(p2Start.getMonth() - 1);
      const p2End = new Date(monthStart);
      const p3Start = new Date(p2Start); p3Start.setMonth(p3Start.getMonth() - 1);
      const p3End = new Date(p2Start);

      const fetchPeriodData = async (start: Date, end: Date) => {
        const { data: msgs } = await supabase
          .from("messages").select("text, created_at")
          .eq("user_id", targetUserId).eq("role", "user")
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString())
          .order("created_at", { ascending: true });
        const { data: ratings } = await supabase
          .from("weekly_emotion_ratings").select("rating, created_at")
          .eq("user_id", targetUserId)
          .gte("created_at", start.toISOString())
          .lt("created_at", end.toISOString());
        return { messages: msgs || [], ratings: ratings || [] };
      };

      const [p1Data, p2Data, p3Data] = await Promise.all([
        fetchPeriodData(p1.start, p1.end),
        fetchPeriodData(p2Start, p2End),
        fetchPeriodData(p3Start, p3End),
      ]);

      const [p1Msgs, p2Msgs, p3Msgs] = await Promise.all([
        decryptMessages(p1Data.messages, ENCRYPTION_KEY),
        decryptMessages(p2Data.messages, ENCRYPTION_KEY),
        decryptMessages(p3Data.messages, ENCRYPTION_KEY),
      ]);

      const formatRatings = (ratings: any[]) => {
        if (ratings.length === 0) return "אין דירוגים";
        const avg = ratings.reduce((s: number, r: any) => s + r.rating, 0) / ratings.length;
        return `${ratings.length} דירוגים, ממוצע: ${avg.toFixed(1)}/5`;
      };

      const monthNames = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"];
      const p1Name = monthNames[monthStart.getUTCMonth()];
      const p2Name = monthNames[p2Start.getUTCMonth()];
      const p3Name = monthNames[p3Start.getUTCMonth()];

      // Fetch admin prompts
      let adminMonthlyPrompt = "";
      try {
        const { data: prompts } = await supabase
          .from("system_messages").select("title, body")
          .in("title", ["monthly_summary_prompt", "multi_month_prompt"]);
        if (prompts) {
          for (const p of prompts) {
            if (p.title === "monthly_summary_prompt" && p.body?.trim()) adminMonthlyPrompt = p.body.trim();
          }
        }
      } catch { /* use default */ }

      const defaultSystemPrompt = `את/ה מנתח/ת יומן רגשי אישי ומייצר/ת דו"ח חודשי חם ותומך.

כללי שפה וטון (חובה!):
- הכל בעברית, בשפה ניטרלית מגדרית
- דבר/י כמו חבר/ה חכם/ה שמכיר/ה אותי
- כותרות תובנות: 2-4 מילים בלבד
- תוכן תובנה: משפט אחד בלבד
- כל פסקה: מקסימום 2 שורות טקסט

התמקדות מיוחדת: ${focusAreas}
סוג הטיפול: ${therapyLabel}

כללי תוכן:
- אל תמציא מידע שלא מופיע בנתונים
- השוו בין 3 התקופות
- אם אין מספיק נתונים, ציינו זאת בחום

כללים ל-sessionQuestions:
- צעדים אקטיביים לשיפור, לא שאלות
- כל נקודה בפועל ציווי: "נסו...", "שימו לב ל..."
- 2-3 נקודות מקסימום`;

      const systemPrompt = adminMonthlyPrompt
        ? `${adminMonthlyPrompt}\n\nהתמקדות מיוחדת: ${focusAreas}\nסוג הטיפול: ${therapyLabel}`
        : defaultSystemPrompt;

      const userPrompt = `נתח את 3 התקופות הבאות וצור דו"ח חודשי חם ותומך:

=== ${p1Name} (החודש האחרון) ===
דירוגי רגשות: ${formatRatings(p1Data.ratings)}
כתיבה (${p1Msgs.length} רשומות):
${p1Msgs.length > 0 ? p1Msgs.join("\n\n") : "אין כתיבה"}

=== ${p2Name} (לפני חודשיים) ===
דירוגי רגשות: ${formatRatings(p2Data.ratings)}
כתיבה (${p2Msgs.length} רשומות):
${p2Msgs.length > 0 ? p2Msgs.join("\n\n") : "אין כתיבה"}

=== ${p3Name} (לפני 3 חודשים) ===
דירוגי רגשות: ${formatRatings(p3Data.ratings)}
כתיבה (${p3Msgs.length} רשומות):
${p3Msgs.length > 0 ? p3Msgs.join("\n\n") : "אין כתיבה"}

צור דו"ח חודשי. זכור: תובנות קצרות ובגובה העיניים, וצעדים מעשיים קדימה.`;

      const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "generate_insights_report",
              description: "Generate a structured insights and trends report comparing 3 time periods",
              parameters: {
                type: "object",
                properties: {
                  emotionComparison: {
                    type: "object",
                    properties: {
                      summary: { type: "string" },
                      periods: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            monthName: { type: "string" },
                            dominantEmotions: { type: "array", items: { type: "string" } },
                            intensity: { type: "string", enum: ["low", "medium", "high"] },
                          },
                          required: ["monthName", "dominantEmotions", "intensity"],
                          additionalProperties: false,
                        },
                      },
                    },
                    required: ["summary", "periods"],
                    additionalProperties: false,
                  },
                  semanticShifts: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        keyword: { type: "string" },
                        shift: { type: "string" },
                      },
                      required: ["keyword", "shift"],
                      additionalProperties: false,
                    },
                  },
                  longTermPatterns: { type: "string" },
                  sessionQuestions: { type: "array", items: { type: "string" } },
                },
                required: ["emotionComparison", "semanticShifts", "longTermPatterns", "sessionQuestions"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "generate_insights_report" } },
        }),
      });

      if (!aiResponse.ok) {
        console.error("AI error:", await aiResponse.text());
        return new Response(JSON.stringify({ error: "AI generation failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      let reportData: any = null;
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        try { reportData = JSON.parse(toolCall.function.arguments); } catch { /* fallback */ }
      }
      if (!reportData) {
        const fallback = aiData.choices?.[0]?.message?.content;
        if (fallback) reportData = { rawText: fallback };
        else {
          return new Response(JSON.stringify({ error: "No AI output" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const newSummaryText = JSON.stringify(reportData);

      const { error: updateErr } = await supabase
        .from("monthly_summaries")
        .update({ summary_text: newSummaryText })
        .eq("id", summary_id);

      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ success: true, summary_text: newSummaryText }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid type" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Regenerate summary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
