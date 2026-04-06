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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ENCRYPTION_KEY = Deno.env.get("MESSAGE_ENCRYPTION_KEY");

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
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

הסיכום חייב להיות כתוב בעברית, בסגנון נרטיבי וזורם, בפסקאות רציפות ארוכות עם מעברים טבעיים.
אין להשתמש בכותרות, מספור, נקודות או מקפים. הכל כתוב כטקסט רציף.
הטון צריך להיות תומך, רגוע, מכיל אך לא דרמטי ולא כמו רשימת משימות.

התמקדות מיוחדת: ${focusAreas}
אלו התחומים שהמשתמש/ת ביקש/ה לתת עליהם דגש מיוחד בסיכום.${therapyInstruction}

המבנה:
1. פסקה קצרה על האווירה הכללית של השבוע
2. פסקה על נושאים רגשיים ומחשבתיים שעלו, דפוסים חוזרים, רגשות חזקים או מחשבות מרכזיות (דגש חזק יותר אם רגשות/מחשבות נבחרו כפוקוס)
3. פסקה על עומסים, תפקוד יומיומי או לחץ (אם הופיע)
4. פסקה על מערכות יחסים, בן/בת זוג, נושאים חברתיים או משפחתיים (אם עלו)
5. פסקה על גוף, בריאות, שינה, עייפות או אורח חיים (אם הופיעו)
6. אם התנהגויות ושינויים נבחרו כפוקוס - לתת דגש מיוחד לדפוסים התנהגותיים ולשינויים שחלו במהלך השבוע
7. פסקה מסכמת עדינה על "מה אולי יהיה מועיל לקחת לשבוע הבא", מנוסח בעדינות וללא הוראות

הסיכום חייב להסתמך רק על מה שנכתב ביומן. אסור להמציא מידע. אם נושא מסוים לא הופיע ברשומות, פשוט לדלג עליו או לכתוב באופן ניטרלי שלא עלה הרבה באזור הזה.

השפה חייבת להיות ניטרלית מבחינת מגדר. להימנע מפעלים או כינויים ממוגדרים. להשתמש בביטויים כמו "נראה ש", "היה", "עלה", "אולי יהיה מועיל", במקום צורות זכר או נקבה.

הטון צריך להיות אמפתי אך לא מחמיא או סנטימנטלי. אין לכתוב ביטויים כמו "את/ה מדהים/ה" או "כל הכבוד". אפשר להכיר במאמץ, בקושי או בהתקדמות בצורה מאוזנת ומעוגנת.

בסוף הסיכום, לפני המשפט המסכם, להוסיף חלק בשם "נושאים שכדאי לדבר עליהם בטיפול" ולרשום את הנושאים המרכזיים שעלו במהלך השבוע ושיכולים להיות רלוונטיים לשיחה טיפולית. כל נושא בשורה נפרדת. הנושאים צריכים להיות ספציפיים ומבוססים על מה שנכתב ביומן, לא כלליים.

בסוף הסיכום, להוסיף משפט קצר אחד שמזכיר שהסיכום הוא רק כלי רפלקטיבי ואינו מחליף טיפול מקצועי, כתוב בעדינות וללא חשש.

אורך: בינוני - לא קצר מדי ולא ארוך מדי.`;

      // Use admin override if provided, otherwise use default
      const systemPrompt = adminPromptOverride
        ? `${adminPromptOverride}\n\nהתמקדות מיוחדת: ${focusAreas}${therapyInstruction}`
        : defaultPrompt;


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
            { role: "user", content: `אפשר לסכם את היומן הבא:\n\n${allMessages}` },
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
            url: "/summary",
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
