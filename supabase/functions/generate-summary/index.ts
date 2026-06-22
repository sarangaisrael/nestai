import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-256-GCM decryption using Web Crypto API
async function decryptText(encryptedBase64: string, keyBase64: string): Promise<string> {
  try {
    const decoder = new TextDecoder();
    const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    
    const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    
    const plaintextBytes = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cryptoKey,
      ciphertext
    );
    
    return decoder.decode(plaintextBytes);
  } catch (error) {
    console.log("Decryption failed, returning original text");
    return encryptedBase64;
  }
}

function looksEncrypted(text: string): boolean {
  if (text.length < 20) return false;
  try {
    const decoded = atob(text);
    return decoded.length >= 12;
  } catch {
    return false;
  }
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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ENCRYPTION_KEY = Deno.env.get("MESSAGE_ENCRYPTION_KEY");

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error("Error fetching users:", usersError);
      throw usersError;
    }

    // Calculate week range
    const now = new Date();
    const weekEnd = new Date(now);
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Process each user
    for (const user of users.users) {
      // Get user's messages from the past week
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select("text, role, created_at")
        .eq("user_id", user.id)
        .eq("role", "user")
        .gte("created_at", weekStart.toISOString())
        .lte("created_at", weekEnd.toISOString())
        .order("created_at", { ascending: true });

      if (messagesError) {
        console.error(`Error fetching messages for user ${user.id}:`, messagesError);
        continue;
      }

      // Audit log: service role accessing user messages for summary generation
      await supabase.rpc('log_admin_access', {
        p_action_type: 'read',
        p_table_name: 'messages',
        p_user_id: user.id,
        p_accessed_by: 'cron',
        p_details: { reason: 'weekly_summary_generation', message_count: messages?.length || 0 }
      });

      if (!messages || messages.length === 0) {
        console.log(`No messages for user ${user.id}, skipping summary`);
        continue;
      }

      // Decrypt messages if encryption key is available
      const decryptedMessages = ENCRYPTION_KEY
        ? await Promise.all(messages.map(async (m) => {
            if (looksEncrypted(m.text)) {
              const decryptedText = await decryptText(m.text, ENCRYPTION_KEY);
              return { ...m, text: decryptedText };
            }
            return m;
          }))
        : messages;

      // Combine all messages
      const allMessages = decryptedMessages.map(m => m.text).join("\n\n");

      // Fetch sleep logs for the week
      const { data: sleepLogs } = await supabase
        .from("sleep_logs")
        .select("date, sleep_hours, sleep_quality, sleep_time, wake_time")
        .eq("user_id", user.id)
        .gte("date", weekStart.toISOString().slice(0, 10))
        .lte("date", weekEnd.toISOString().slice(0, 10))
        .order("date", { ascending: true });

      const qualityLabel = (q: number | null) =>
        q === 1 ? "גרוע" : q === 2 ? "לא טוב" : q === 3 ? "בסדר" : q === 4 ? "טוב" : q === 5 ? "מעולה" : "לא דורג";

      let sleepContext = "";
      if (sleepLogs && sleepLogs.length > 0) {
        const rows = sleepLogs.map((s) =>
          `• ${s.date}: ${s.sleep_hours ?? "?"} שעות שינה, איכות: ${qualityLabel(s.sleep_quality)}${s.sleep_time ? `, הלך לישון ${s.sleep_time}` : ""}${s.wake_time ? `, התעורר ${s.wake_time}` : ""}`
        ).join("\n");
        sleepContext = `\n\nנתוני שינה השבוע:\n${rows}`;
      }

      // Get user preferences for therapy type and focus
      const { data: userPrefs } = await supabase
        .from("user_preferences")
        .select("therapy_type, summary_focus")
        .eq("user_id", user.id)
        .maybeSingle();

      const therapyType = userPrefs?.therapy_type || null;
      const summaryFocus = userPrefs?.summary_focus || ["emotions", "thoughts", "behaviors", "changes"];

      // Build focus instruction
      const focusAreas = summaryFocus.map((f: string) => {
        const focusMap: { [key: string]: string } = {
          emotions: "רגשות",
          thoughts: "מחשבות",
          behaviors: "התנהגויות",
          changes: "שינויים"
        };
        return focusMap[f] || f;
      }).join(", ");

      // Build therapy-specific instruction
      let therapyInstruction = "";
      if (therapyType === "cbt") {
        therapyInstruction = "\n\nהסיכום צריך לשקף גישה קוגניטיבית-התנהגותית: התמקדות במבנה, בדפוסים של מחשבות והתנהגויות.";
      } else if (therapyType === "psychodynamic") {
        therapyInstruction = "\n\nהסיכום צריך לשקף גישה פסיכודינמית: התמקדות ברגשות ובנרטיב האישי.";
      }

      // Fetch admin's global AI summary prompt (if set)
      let adminPromptOverride = "";
      try {
        const { data: adminPrompt } = await supabase
          .from("system_messages")
          .select("body")
          .eq("title", "summary_system_prompt")
          .maybeSingle();
        if (adminPrompt?.body?.trim()) {
          adminPromptOverride = adminPrompt.body.trim();
        }
      } catch (e) {
        console.log("Could not fetch admin summary prompt:", e);
      }

      // Generate summary using AI
      const defaultPrompt = `את/ה כותב/ת סיכום שבועי של יומן רגשי אישי.

הסיכום חייב להיות כתוב בעברית. הטון אמפתי, ישיר, ומעוגן בנתונים — לא דרמטי ולא סנטימנטלי.
השפה ניטרלית מבחינת מגדר (להימנע מצורות זכר/נקבה, להשתמש ב"נראה ש", "עלה", "היה").
אין להמציא מידע — להסתמך רק על מה שנכתב ביומן ועל נתוני השינה שסופקו.

התמקדות מיוחדת: ${focusAreas}${therapyInstruction}

המבנה חייב לכלול את ארבעת הסעיפים הבאים בדיוק, עם הכותרות האלה:

## מצב רגשי
2-3 משפטים קצרים על האווירה הרגשית של השבוע — רגשות מרכזיים, מחשבות שחזרו, או שינויים במצב הרוח.

## שינה
תובנה ספציפית אחת שמחברת בין נתוני השינה למצב הרגשי. חובה להשתמש במספרים אמיתיים מנתוני השינה (למשל: "בלילות שישנת יותר מ-7 שעות, הרגשת טוב יותר למחרת — זה קרה X פעמים השבוע"). אם אין נתוני שינה — כתוב "לא נרשמו נתוני שינה השבוע."

## דפוסים שחוזרים
2-3 משפטים על דפוסי חשיבה, התנהגות או מערכות יחסים שעלו יותר מפעם אחת.

## תובנה לשבוע הבא
2-3 משפטים עדינים על מה שאולי יהיה מועיל לשים לב אליו — מנוסח כהצעה, לא כהוראה.

---
אחרי ארבעת הסעיפים, להוסיף:

**נושאים שכדאי לדבר עליהם בטיפול**
רשימה קצרה (3-4 נושאים ספציפיים מהיומן, כל אחד בשורה נפרדת).

בסוף — משפט אחד קצר שמזכיר שהסיכום הוא כלי רפלקטיבי ואינו מחליף טיפול מקצועי.`;

      // Use admin override if provided, otherwise use default
      const systemPrompt = adminPromptOverride
        ? `${adminPromptOverride}\n\nהתמקדות מיוחדת: ${focusAreas}${therapyInstruction}`
        : defaultPrompt;


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
            { role: "user", content: `אפשר לסכם את היומן הבא:\n\n${allMessages}${sleepContext}` },
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error(`AI API error for user ${user.id}:`, await aiResponse.text());
        continue;
      }

      const aiData = await aiResponse.json();
      const summaryText = aiData.choices[0].message.content;

      // Save summary
      const { error: insertError } = await supabase.from("weekly_summaries").insert([
        {
          user_id: user.id,
          week_start: weekStart.toISOString(),
          week_end: weekEnd.toISOString(),
          summary_text: summaryText,
        },
      ]);

      if (insertError) {
        console.error(`Error saving summary for user ${user.id}:`, insertError);
        continue;
      }

      console.log(`Successfully generated summary for user ${user.id}`);

      // Send push notification about new summary
      try {
        const pushResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            userId: user.id,
            title: "סיכום שבועי חדש 📝",
            body: "הסיכום השבועי שלך מוכן לצפייה",
            url: "/app/summary",
          }),
        });

        if (pushResponse.ok) {
          console.log(`Push notification sent to user ${user.id}`);
        } else {
          console.log(`No push subscription for user ${user.id} or push failed`);
        }
      } catch (pushError) {
        console.error(`Error sending push to user ${user.id}:`, pushError);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate summary error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
