import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  return { start, end };
}

const hebrewMonthNames: Record<number, string> = {
  1: 'ינואר', 2: 'פברואר', 3: 'מרץ', 4: 'אפריל', 5: 'מאי', 6: 'יוני',
  7: 'יולי', 8: 'אוגוסט', 9: 'ספטמבר', 10: 'אוקטובר', 11: 'נובמבר', 12: 'דצמבר',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('monthly-summary-scheduler: Starting...');

  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = Deno.env.get('CRON_SECRET');
  
  if (!expectedSecret || cronSecret !== expectedSecret) {
    console.error("monthly-summary-scheduler: Unauthorized");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let forceRun = false;
    try { const body = await req.json(); forceRun = body?.force === true; } catch { /* no body */ }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('MESSAGE_ENCRYPTION_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const israelTime = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jerusalem', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now);
    
    const [year, month, day] = israelTime.split('-').map(Number);
    
    if (day !== 1 && !forceRun) {
      console.log(`monthly-summary-scheduler: Not the 1st (day=${day}), skipping`);
      return new Response(JSON.stringify({ message: 'Not the 1st of month' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate 3 periods
    const period1Month = month === 1 ? 12 : month - 1;
    const period1Year = month === 1 ? year - 1 : year;
    const period1 = getMonthRange(period1Year, period1Month);

    const period2Date = new Date(Date.UTC(year, month - 3, 1));
    const period2 = getMonthRange(period2Date.getUTCFullYear(), period2Date.getUTCMonth() + 1);

    const period3Date = new Date(Date.UTC(year, month - 4, 1));
    const period3 = getMonthRange(period3Date.getUTCFullYear(), period3Date.getUTCMonth() + 1);

    // Hebrew month names for prompts
    const p1Name = hebrewMonthNames[period1Month] || `חודש ${period1Month}`;
    const p2Month = period2Date.getUTCMonth() + 1;
    const p2Name = hebrewMonthNames[p2Month] || `חודש ${p2Month}`;
    const p3Month = period3Date.getUTCMonth() + 1;
    const p3Name = hebrewMonthNames[p3Month] || `חודש ${p3Month}`;

    console.log(`monthly-summary-scheduler: Periods - P1: ${p1Name} (${period1.start.toISOString()}), P2: ${p2Name}, P3: ${p3Name}`);

    const { data: users, error: usersError } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('weekly_summary_enabled', true);

    if (usersError) throw usersError;

    console.log(`monthly-summary-scheduler: Found ${users?.length || 0} users`);

    let processedCount = 0;
    let sentCount = 0;

    for (const user of users || []) {
      try {
        const { data: existing } = await supabase
          .from('monthly_summaries')
          .select('id')
          .eq('user_id', user.user_id)
          .eq('month_start', period1.start.toISOString())
          .maybeSingle();

        if (existing) {
          console.log(`monthly-summary-scheduler: Summary exists for user ${user.user_id}`);
          continue;
        }

        const fetchPeriodData = async (start: Date, end: Date) => {
          const { data: msgs } = await supabase
            .from('messages').select('text, created_at')
            .eq('user_id', user.user_id).eq('role', 'user')
            .gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
            .order('created_at', { ascending: true });
          const { data: ratings } = await supabase
            .from('weekly_emotion_ratings').select('rating, created_at')
            .eq('user_id', user.user_id)
            .gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
            .order('created_at', { ascending: true });
          return { messages: msgs || [], ratings: ratings || [] };
        };

        const fetchMoodData = async (start: Date, end: Date) => {
          const { data: moods } = await supabase
            .from('mood_entries').select('mood, created_at')
            .eq('user_id', user.user_id)
            .gte('created_at', start.toISOString()).lt('created_at', end.toISOString())
            .order('created_at', { ascending: true });
          return moods || [];
        };

        const [p1Data, p2Data, p3Data, p1Moods, p2Moods, p3Moods] = await Promise.all([
          fetchPeriodData(period1.start, period1.end),
          fetchPeriodData(period2.start, period2.end),
          fetchPeriodData(period3.start, period3.end),
          fetchMoodData(period1.start, period1.end),
          fetchMoodData(period2.start, period2.end),
          fetchMoodData(period3.start, period3.end),
        ]);

        const hasData = p1Data.messages.length > 0 || p1Data.ratings.length > 0;
        if (!hasData) {
          console.log(`monthly-summary-scheduler: No data for user ${user.user_id}`);
          continue;
        }

        processedCount++;

        const [p1Msgs, p2Msgs, p3Msgs] = await Promise.all([
          decryptMessages(p1Data.messages, encryptionKey),
          decryptMessages(p2Data.messages, encryptionKey),
          decryptMessages(p3Data.messages, encryptionKey),
        ]);

        const formatRatings = (ratings: any[]) => {
          if (ratings.length === 0) return 'אין דירוגים';
          const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
          return `${ratings.length} דירוגים, ממוצע: ${avg.toFixed(1)}/5`;
        };

        const moodMap: Record<string, string> = { happy: '😊 שמח/ה', anxious: '😰 חרד/ה', exhausted: '😩 מותש/ת', sad: '😢 עצוב/ה', calm: '😌 רגוע/ה' };
        const formatMoods = (moods: any[]) => {
          if (moods.length === 0) return 'אין דיווחי מצב רוח';
          const counts: Record<string, number> = {};
          for (const m of moods) { counts[m.mood] = (counts[m.mood] || 0) + 1; }
          const breakdown = Object.entries(counts)
            .map(([mood, count]) => `${moodMap[mood] || mood}: ${count}`)
            .join(', ');
          return `${moods.length} דיווחים - ${breakdown}`;
        };

        // Get user preferences for therapy type and focus areas
        const { data: prefs } = await supabase
          .from('user_preferences')
          .select('therapy_type, summary_focus')
          .eq('user_id', user.user_id)
          .maybeSingle();

        const therapyType = prefs?.therapy_type || 'general';
        const focusAreas = (prefs?.summary_focus || ['emotions', 'thoughts', 'behaviors', 'changes']).join(', ');

        // Fetch admin prompts
        let adminMonthlyPrompt = "";
        try {
          const { data: prompts } = await supabase
            .from('system_messages').select('title, body')
            .in('title', ['monthly_summary_prompt', 'multi_month_prompt']);
          if (prompts) {
            for (const p of prompts) {
              if (p.title === 'monthly_summary_prompt' && p.body?.trim()) adminMonthlyPrompt = p.body.trim();
            }
          }
        } catch (e) { console.log("Could not fetch admin prompts:", e); }

        const therapyLabel = therapyType === 'cbt' ? 'קוגניטיבי-התנהגותי' : therapyType === 'psychodynamic' ? 'פסיכודינמי' : 'כללי';

        const defaultSystemPrompt = `את/ה מנתח/ת יומן רגשי אישי ומייצר/ת דו"ח חודשי חם ותומך.

CRITICAL LANGUAGE RULE: ALL output MUST be in Hebrew (עברית). Do NOT write ANY text in English. Every field, every sentence, every word must be in Hebrew. This includes the summary, shifts, patterns, and session questions.
כללי שפה וטון (חובה!):
- הכל בעברית, בשפה ניטרלית מגדרית
- דבר/י כמו חבר/ה חכם/ה שמכיר/ה אותי — לא כמו דו"ח רפואי
- במקום "ניכר כי" → "שמתי לב ש..."
- במקום "תנודתיות רגשית" → "עליות ומורדות ברגש"
- במקום "הכתיבה החופשית חושפת" → "שמתי לב שחזרת הרבה על..."
- במקום "האווירה הכללית נעה בין" → "החודש הרגשת בעיקר..."
- אסור להשתמש במילים: "ניכר", "מעידה", "תנודתיות", "הולמת", "מצביעה", "נראה כי", "ניתן להסיק"
- כותרות תובנות: 2-4 מילים בלבד (למשל: "שיפור בביטחון העצמי")
- תוכן תובנה: משפט אחד בלבד שמסביר מה השתנה לעומת חודשים קודמים
- כל פסקה: מקסימום 2 שורות טקסט. תמצת!

התמקדות מיוחדת: ${focusAreas}
אלו התחומים שהמשתמש/ת ביקש/ה לתת עליהם דגש מיוחד. שימו דגש מיוחד על תחומים אלו בניתוח ובתובנות.

כללי תוכן:
- אל תמציא מידע שלא מופיע בנתונים
- אל תתן אבחנות או עצות טיפוליות
- השוו בין 3 התקופות ותארו שינויים ודפוסים
- אם אין מספיק נתונים, ציינו זאת בחום
- סוג הטיפול: ${therapyLabel}

כללים ל-sessionQuestions (חשוב מאוד!):
- הכותרת של חלק זה היא "מבט קדימה: איך לשפר את החודש הקרוב"
- אלו לא שאלות ולא סיכומים של מה שהיה — אלו צעדים אקטיביים לשיפור
- כל נקודה חייבת להתחיל בפועל ציווי: "נסו...", "שימו לב ל...", "הקדישו...", "תרגלו..."
- סגנון: "החודש זיהית עומס סביב [נושא]. נסו להקדיש 10 דקות ביום ל..."
- כל נקודה: ספציפית, מעשית ומעודדת. לא יותר ממשפט אחד.
- 2-3 נקודות מקסימום
- אסור: "ניכר כי", "ייתכן ש", "שווה לשקול" — במקום זה: "נסו", "שימו לב", "הקדישו"`;

        const systemPrompt = adminMonthlyPrompt
          ? `${adminMonthlyPrompt}\n\nהתמקדות מיוחדת: ${focusAreas}\nסוג הטיפול: ${therapyLabel}`
          : defaultSystemPrompt;

        const userPrompt = `נתח את 3 התקופות הבאות וצור דו"ח חודשי חם ותומך:

=== ${p1Name} (החודש האחרון) ===
דירוגי רגשות: ${formatRatings(p1Data.ratings)}
מצבי רוח: ${formatMoods(p1Moods)}
כתיבה (${p1Msgs.length} רשומות):
${p1Msgs.length > 0 ? p1Msgs.join('\n\n') : 'אין כתיבה'}

=== ${p2Name} (לפני חודשיים) ===
דירוגי רגשות: ${formatRatings(p2Data.ratings)}
מצבי רוח: ${formatMoods(p2Moods)}
כתיבה (${p2Msgs.length} רשומות):
${p2Msgs.length > 0 ? p2Msgs.join('\n\n') : 'אין כתיבה'}

=== ${p3Name} (לפני 3 חודשים) ===
דירוגי רגשות: ${formatRatings(p3Data.ratings)}
מצבי רוח: ${formatMoods(p3Moods)}
כתיבה (${p3Msgs.length} רשומות):
${p3Msgs.length > 0 ? p3Msgs.join('\n\n') : 'אין כתיבה'}

צור דו"ח חודשי. זכור: תובנות קצרות ובגובה העיניים, וצעדים מעשיים קדימה.`;

        const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
        if (!GEMINI_API_KEY) {
          console.error('monthly-summary-scheduler: GEMINI_API_KEY not configured');
          continue;
        }

        const aiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GEMINI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
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
                      description: "Comparison of dominant emotions across periods",
                      properties: {
                        summary: { type: "string", description: "2-3 sentences describing how emotions changed across periods" },
                        periods: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              monthName: { type: "string" },
                              dominantEmotions: { type: "array", items: { type: "string" }, description: "2-3 dominant emotions" },
                              intensity: { type: "string", enum: ["low", "medium", "high"], description: "Overall emotional intensity" }
                            },
                            required: ["monthName", "dominantEmotions", "intensity"],
                            additionalProperties: false
                          }
                        }
                      },
                      required: ["summary", "periods"],
                      additionalProperties: false
                    },
                    semanticShifts: {
                      type: "array",
                      description: "Keywords that appeared in multiple periods but with changing emotional context",
                      items: {
                        type: "object",
                        properties: {
                          keyword: { type: "string", description: "The recurring keyword/topic" },
                          shift: { type: "string", description: "1-2 sentences explaining how the context/tone around this word changed" }
                        },
                        required: ["keyword", "shift"],
                        additionalProperties: false
                      }
                    },
                    longTermPatterns: {
                      type: "string",
                      description: "3-5 sentences about recurring patterns the user might not notice."
                    },
                    sessionQuestions: {
                      type: "array",
                      description: "2-3 focused action items for the next month",
                      items: { type: "string" }
                    }
                  },
                  required: ["emotionComparison", "semanticShifts", "longTermPatterns", "sessionQuestions"],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "generate_insights_report" } },
          }),
        });

        if (!aiResponse.ok) {
          console.error(`monthly-summary-scheduler: AI error for user ${user.user_id}:`, await aiResponse.text());
          continue;
        }

        const aiData = await aiResponse.json();
        
        let reportData: any = null;
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          try { reportData = JSON.parse(toolCall.function.arguments); } catch (e) {
            console.error(`monthly-summary-scheduler: Failed to parse tool call for user ${user.user_id}`);
          }
        }

        if (!reportData) {
          const fallbackText = aiData.choices?.[0]?.message?.content;
          if (fallbackText) {
            reportData = { rawText: fallbackText };
          } else {
            console.error(`monthly-summary-scheduler: No output for user ${user.user_id}`);
            continue;
          }
        }

        const summaryText = JSON.stringify(reportData);

        const { error: insertError } = await supabase
          .from('monthly_summaries')
          .insert({
            user_id: user.user_id,
            month_start: period1.start.toISOString(),
            month_end: period1.end.toISOString(),
            summary_text: summaryText,
          });

        if (insertError) {
          console.error(`monthly-summary-scheduler: Insert error for user ${user.user_id}:`, insertError);
          continue;
        }
        
        console.log(`monthly-summary-scheduler: Summary saved for user ${user.user_id}`);

        // Create in-app notification
        try {
          await supabase.from('user_notifications').insert({
            user_id: user.user_id,
            title: 'דו״ח מגמות חודשי חדש 📊',
            body: `הדו״ח החודשי של ${p1Name} מוכן לצפייה`,
            link: '/app/monthly-summary',
            type: 'monthly_summary',
          });
          console.log(`🔔 In-app notification created for user ${user.user_id}`);
        } catch (notifError) {
          console.error(`Notification insert error for user ${user.user_id}:`, notifError);
        }

        // Send push notification
        try {
          const pushResponse = await fetch(`${supabaseUrl}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              userId: user.user_id,
              title: "דו״ח מגמות חודשי חדש 📊",
              body: `הדו״ח החודשי של ${p1Name} מוכן לצפייה`,
              url: "/app/monthly-summary",
            }),
          });
          if (pushResponse.ok) {
            console.log(`📲 Push sent to user ${user.user_id}`);
          }
        } catch (pushError) {
          console.error(`Push error for user ${user.user_id}:`, pushError);
        }

        sentCount++;
      } catch (userError) {
        console.error(`monthly-summary-scheduler: Error for user ${user.user_id}:`, userError);
      }
    }

    console.log(`✅ Monthly summary complete. Processed: ${processedCount}, Sent: ${sentCount}`);

    return new Response(JSON.stringify({ success: true, processed: processedCount, sent: sentCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('monthly-summary-scheduler: Fatal error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
