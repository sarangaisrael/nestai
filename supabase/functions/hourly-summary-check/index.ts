import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-256-GCM decryption using Web Crypto API (must match encrypt-message)
async function decryptText(encryptedBase64: string, keyString: string): Promise<string> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  // Hash the key to ensure it's always 32 bytes for AES-256
  const keyData = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
  const keyBytes = new Uint8Array(hashBuffer);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );

  // Decode the combined IV + ciphertext
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

  // Extract IV (first 12 bytes) and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const plaintextBytes = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    ciphertext,
  );

  return decoder.decode(plaintextBytes);
}

function looksEncrypted(text: string): boolean {
  if (!text || text.length < 20) return false;
  try {
    const decoded = atob(text);
    return decoded.length >= 12;
  } catch {
    return false;
  }
}

// Helper: Convert current time to user's timezone
function getUserCurrentTime(timezone: string): { day: string; hour: number; minute: number } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  
  const parts = formatter.formatToParts(now);
  const day = parts.find(p => p.type === "weekday")?.value.toLowerCase() || "";
  const hour = parseInt(parts.find(p => p.type === "hour")?.value || "0");
  const minute = parseInt(parts.find(p => p.type === "minute")?.value || "0");
  
  return { day, hour, minute };
}

// Helper: Log summary activity
async function logSummary(
  supabase: any,
  userId: string,
  status: string,
  attemptNumber: number = 1,
  errorMessage?: string
) {
  await supabase.from("summary_logs").insert({
    user_id: userId,
    status,
    attempt_number: attemptNumber,
    error_message: errorMessage,
  });
}

// Helper: Generate and send summary
async function generateAndSendSummary(
  supabase: any,
  userId: string,
  lovableApiKey: string,
  attemptNumber: number = 1
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Attempt ${attemptNumber}] Generating summary for user ${userId}`);
    await logSummary(supabase, userId, "scheduled", attemptNumber);

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);

    // Get user's messages from the past week (both user and assistant)
    const { data: allDbMessages, error: messagesError } = await supabase
      .from("messages")
      .select("text, role, created_at")
      .eq("user_id", userId)
      .eq("is_system", false)
      .gte("created_at", weekStart.toISOString())
      .lte("created_at", now.toISOString())
      .order("created_at", { ascending: true });

    if (messagesError) throw messagesError;

    // Filter user messages
    const userMessages = allDbMessages?.filter((m: any) => m.role === "user") || [];
    
    if (userMessages.length === 0) {
      console.log(`No messages for user ${userId}, skipping summary`);
      return { success: true }; // Not an error, just no data
    }

    // Fetch mood entries for the week
    const { data: moodEntries } = await supabase
      .from("mood_entries")
      .select("mood, created_at")
      .eq("user_id", userId)
      .gte("created_at", weekStart.toISOString())
      .lte("created_at", now.toISOString())
      .order("created_at", { ascending: true });

    // Get encryption key
    const encryptionKey = Deno.env.get("MESSAGE_ENCRYPTION_KEY");

    // Decrypt messages if encrypted
    const decryptedUserMessages: string[] = [];
    for (const msg of userMessages) {
      let text = msg.text;
      if (encryptionKey && looksEncrypted(text)) {
        try {
          text = await decryptText(text, encryptionKey);
          console.log(`Decrypted message for user ${userId}`);
        } catch (decryptError) {
          console.error(`Failed to decrypt message for user ${userId}:`, decryptError);
        }
      }
      decryptedUserMessages.push(text);
    }

    // Extract therapy recommendations from assistant messages
    const assistantMessages = allDbMessages?.filter((m: any) => m.role === "assistant") || [];
    const therapyRecommendations: string[] = [];
    
    for (const msg of assistantMessages) {
      let text = msg.text;
      if (encryptionKey && looksEncrypted(text)) {
        try {
          text = await decryptText(text, encryptionKey);
        } catch {
          // Use original if decryption fails
        }
      }
      // Look for wrap-up messages with therapy recommendations
      if (text.includes("לסיכום השבועי") || text.includes("שווה להעלות בטיפול") || text.includes("לדבר בטיפול")) {
        // Extract the recommendation part
        const recommendationMatch = text.match(/(?:שווה להעלות בטיפול|אולי כדאי לדבר בטיפול|לדבר בטיפול על).*$/i);
        if (recommendationMatch) {
          therapyRecommendations.push(recommendationMatch[0]);
        } else if (text.includes("לסיכום השבועי")) {
          // Include the whole wrap-up message if it contains summary indicator
          therapyRecommendations.push(text);
        }
      }
    }
    
    console.log(`Found ${therapyRecommendations.length} therapy recommendations for user ${userId}`);

    // Get user preferences for therapy type and focus
    const { data: userPrefs } = await supabase
      .from("user_preferences")
      .select("therapy_type, summary_focus")
      .eq("user_id", userId)
      .single();

    const therapyType = userPrefs?.therapy_type || null;
    const summaryFocus = userPrefs?.summary_focus || ["emotions", "thoughts", "behaviors", "changes"];

    // Combine all decrypted messages
    const allMessages = decryptedUserMessages.join("\n\n");
    
    // Prepare therapy recommendations section if any exist
    const therapyRecsText = therapyRecommendations.length > 0 
      ? `\n\n=== המלצות שעלו במהלך השבוע לדיון בטיפול ===\n${therapyRecommendations.join("\n")}`
      : "";
    
    // Format mood data for the prompt
    const moodSummaryText = moodEntries && moodEntries.length > 0
      ? `\n\n=== מצבי רוח שדווחו השבוע (${moodEntries.length} דיווחים) ===\n${moodEntries.map((m: any) => {
          const date = new Date(m.created_at).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'numeric' });
          const moodMap: Record<string, string> = { happy: '😊 שמח/ה', anxious: '😰 חרד/ה', exhausted: '😩 מותש/ת', sad: '😢 עצוב/ה', calm: '😌 רגוע/ה' };
          return `${date}: ${moodMap[m.mood] || m.mood}`;
        }).join('\n')}`
      : "";
    
    console.log(`Processing ${decryptedUserMessages.length} messages for user ${userId}, total length: ${allMessages.length}, moods: ${moodEntries?.length || 0}`);

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
      therapyInstruction = "\n\nהסיכום צריך לשקף גישה קוגניטיבית-התנהגותית: התמקדות במבנה, בדפוסים של מחשבות והתנהגויות, ובקשרים ביניהם.";
    } else if (therapyType === "psychodynamic") {
      therapyInstruction = "\n\nהסיכום צריך לשקף גישה פסיכודינמית: התמקדות ברגשות, בנרטיב האישי, ובנושאים רגשיים עמוקים יותר.";
    }

    // Build therapy recommendations instruction
    const therapyRecsInstruction = therapyRecommendations.length > 0
      ? `\n\nחשוב: במהלך השבוע, עלו ${therapyRecommendations.length} נושאים שכדאי לדבר עליהם בטיפול. בסוף הסיכום (לפני ההערה על טיפול מקצועי), הוסף פסקה קצרה עם הכותרת "נושאים שכדאי לדבר עליהם בטיפול:" וסכם בקצרה את הנושאים הללו בצורה טבעית ולא כרשימה.`
      : "";

    // Generate summary using AI
    const systemPrompt = `את/ה כותב/ת סיכום שבועי של יומן רגשי אישי שיופיע בעמוד הסיכומים השבועיים.

הסיכום חייב להיות כתוב בעברית, בסגנון נרטיבי וזורם, בפסקאות רציפות ארוכות עם מעברים טבעיים.
אין להשתמש בכותרות, מספור, נקודות או מקפים. הכל כתוב כטקסט רציף.
הטון צריך להיות תומך, רגוע, מכיל אך לא דרמטי ולא כמו רשימת משימות.

התמקדות מיוחדת: ${focusAreas}
אלו התחומים שהמשתמש/ת ביקש/ה לתת עליהם דגש מיוחד בסיכום.${therapyInstruction}${therapyRecsInstruction}

המבנה:
1. פסקה קצרה על האווירה הכללית של השבוע
2. פסקה על נושאים רגשיים ומחשבתיים שעלו, דפוסים חוזרים, רגשות חזקים או מחשבות מרכזיות (דגש חזק יותר אם רגשות/מחשבות נבחרו כפוקוס)
3. פסקה על עומסים, תפקוד יומיומי או לחץ (אם הופיע)
4. פסקה על מערכות יחסים, בן/בת זוג, נושאים חברתיים או משפחתיים (אם עלו)
5. פסקה על גוף, בריאות, שינה, עייפות או אורח חיים (אם הופיעו)
6. אם התנהגויות ושינויים נבחרו כפוקוס - לתת דגש מיוחד לדפוסים התנהגותיים ולשינויים שחלו במהלך השבוע
7. פסקה מסכמת עדינה על "מה אולי יהיה מועיל לקחת לשבוע הבא", מנוסח בעדינות וללא הוראות
${therapyRecommendations.length > 0 ? '8. פסקה קצרה בשם "נושאים שכדאי לדבר עליהם בטיפול" - סיכום קצר ולא כרשימה של הנושאים שהצ׳אט ציין כמתאימים לדיון בטיפול' : ''}

הסיכום חייב להסתמך רק על מה שנכתב ביומן. אסור להמציא מידע.

השפה חייבת להיות ניטרלית מבחינת מגדר. להימנע מפעלים או כינויים ממוגדרים.

הטון צריך להיות אמפתי אך לא מחמיא או סנטימנטלי.

אם קיימים נתוני מצב רוח (mood entries) מהשבוע, יש לשלב אותם בתוך הסיכום בצורה טבעית - לתאר את המגמה הרגשית הכללית, ימים בולטים, ושינויים שעלו ממעקב מצב הרוח.

בסוף הסיכום, להוסיף משפט קצר אחד שמזכיר שהסיכום הוא רק כלי רפלקטיבי ואינו מחליף טיפול מקצועי.

אורך: בינוני - לא קצר מדי ולא ארוך מדי.`;

    const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `אפשר לסכם את היומן הבא:\n\n${allMessages}${therapyRecsText}${moodSummaryText}` },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI API error: ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const summaryText = aiData.choices[0].message.content;

    // Save summary to weekly_summaries table
    const { error: summaryInsertError } = await supabase.from("weekly_summaries").insert({
      user_id: userId,
      week_start: weekStart.toISOString(),
      week_end: now.toISOString(),
      summary_text: summaryText,
    });

    if (summaryInsertError) throw summaryInsertError;

    // Update last_sent timestamp
    const { error: updateError } = await supabase
      .from("user_preferences")
      .update({ weekly_summary_last_sent_at: now.toISOString() })
      .eq("user_id", userId);

    if (updateError) throw updateError;

    // Send push notification about new summary
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const pushResponse = await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            userId: userId,
            title: "סיכום שבועי חדש 📝",
            body: "הסיכום השבועי שלך מוכן לצפייה",
            url: "/app/summary",
          }),
        });

        if (pushResponse.ok) {
          console.log(`📲 Push notification sent to user ${userId}`);
        } else {
          console.log(`⚠️ No push subscription for user ${userId} or push failed`);
        }
      } catch (pushError) {
        console.error(`Error sending push to user ${userId}:`, pushError);
      }
    }

    await logSummary(supabase, userId, "sent", attemptNumber);
    console.log(`✅ Successfully sent summary to user ${userId}`);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`❌ Error generating summary for user ${userId}:`, errorMessage);
    await logSummary(supabase, userId, attemptNumber < 3 ? "retry" : "failed", attemptNumber, errorMessage);
    return { success: false, error: errorMessage };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // SECURITY: Validate cron secret for scheduled function calls
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = Deno.env.get('CRON_SECRET');

    if (!expectedSecret || cronSecret !== expectedSecret) {
      console.error("Unauthorized: Invalid or missing cron secret");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log("✅ CRON_SECRET validated");

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    console.log("🔄 Running weekly summary check...");

    // Get all user preferences
    const { data: allPreferences, error: prefsError } = await supabase
      .from("user_preferences")
      .select("*");

    if (prefsError) {
      console.error("Error fetching preferences:", prefsError);
      throw prefsError;
    }

    let processedCount = 0;
    let sentCount = 0;

    // Process each user
    for (const prefs of allPreferences || []) {
      // Skip if weekly summary is disabled
      if (prefs.weekly_summary_enabled === false) {
        continue;
      }

      const userId = prefs.user_id;
      const timezone = prefs.summary_timezone || "Asia/Jerusalem";
      const summaryDay = prefs.summary_day || "saturday";
      const summaryTime = prefs.summary_time || "20:00";
      const [targetHour, targetMinute] = summaryTime.split(":").map((n: string) => parseInt(n));

      // Get current time in user's timezone
      const userTime = getUserCurrentTime(timezone);
      
      console.log(`🕐 User ${userId}: Local time is ${userTime.day} ${userTime.hour}:${userTime.minute.toString().padStart(2, '0')} (${timezone})`);
      console.log(`📅 User ${userId}: Scheduled for ${summaryDay} ${summaryTime}`);

      // Check if it's the scheduled time (within a 10-minute window)
      const isCorrectDay = userTime.day === summaryDay;
      const isCorrectHour = userTime.hour === targetHour;
      const isWithinMinuteWindow = Math.abs(userTime.minute - targetMinute) <= 10;

      // Get current time in user's timezone as a proper Date object
      const now = new Date();
      const userTimeStr = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      }).format(now);
      
      // Parse the formatted string to create a Date in user's timezone
      const [datePart, timePart] = userTimeStr.split(", ");
      const [month, day, year] = datePart.split("/");
      const [hour, minute, second] = timePart.split(":");
      const userNow = new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`);
      
      const scheduledDayIndex = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(summaryDay);
      const userTimeDayIndex = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(userTime.day);
      
      // Calculate scheduled time in user's timezone
      let daysSinceScheduledDay = userTimeDayIndex - scheduledDayIndex;
      if (daysSinceScheduledDay < 0) {
        daysSinceScheduledDay += 7;
      }
      
      const scheduledDateTime = new Date(userNow);
      scheduledDateTime.setDate(scheduledDateTime.getDate() - daysSinceScheduledDay);
      scheduledDateTime.setHours(targetHour, targetMinute, 0, 0);
      
      // If we haven't reached the scheduled time yet this week, look at last week
      if (scheduledDateTime > userNow) {
        scheduledDateTime.setDate(scheduledDateTime.getDate() - 7);
      }
      
      console.log(`📊 User ${userId}: Scheduled time was ${scheduledDateTime.toISOString()}, last sent: ${prefs.weekly_summary_last_sent_at || 'never'}`);
      
      // DEDUPLICATION: Use a 6-day window to prevent duplicates.
      // Since summaries are weekly, if one was sent in the last 6 days, skip.
      // This avoids timezone conversion bugs and ensures only one summary per week.
      const lastSentDate = prefs.weekly_summary_last_sent_at ? new Date(prefs.weekly_summary_last_sent_at) : null;
      const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
      const sentRecently = lastSentDate && lastSentDate >= sixDaysAgo;

      if (sentRecently) {
        console.log(`⏭️ User ${userId}: Already received summary (last sent: ${lastSentDate?.toISOString()})`);
        continue;
      }

      // Calculate if we've passed the scheduled time this week for catch-up
      const passedScheduledTime = 
        userTimeDayIndex > scheduledDayIndex || 
        (userTimeDayIndex === scheduledDayIndex && 
         (userTime.hour > targetHour || (userTime.hour === targetHour && userTime.minute > targetMinute + 10)));

      // Send if: 1) It's the scheduled time, OR 2) We've passed it and haven't sent this week (catch-up)
      const shouldSend = (isCorrectDay && isCorrectHour && isWithinMinuteWindow) || passedScheduledTime;

      if (!shouldSend) {
        continue;
      }

      processedCount++;

      // Try to generate and send summary with retries
      let result = await generateAndSendSummary(supabase, userId, GEMINI_API_KEY, 1);
      
      if (!result.success) {
        // Retry up to 2 more times (total 3 attempts)
        for (let attempt = 2; attempt <= 3; attempt++) {
          console.log(`🔄 Retrying for user ${userId} (attempt ${attempt}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
          result = await generateAndSendSummary(supabase, userId, GEMINI_API_KEY, attempt);
          if (result.success) break;
        }
      }

      if (result.success) {
        sentCount++;
      }
    }

    // === CREDIT-FAILURE RETRY: Check for users whose summaries failed due to credit/rate-limit errors ===
    // This catches users who failed in previous runs and retries them now that credits may be back.
    const { data: failedLogs } = await supabase
      .from("summary_logs")
      .select("user_id, error_message, created_at")
      .eq("status", "failed")
      .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false });

    if (failedLogs && failedLogs.length > 0) {
      // Deduplicate: only retry each user once, and only if they haven't received a summary since the failure
      const retriedUsers = new Set<string>();
      
      for (const log of failedLogs) {
        if (retriedUsers.has(log.user_id)) continue;
        
        // Only retry credit-related failures
        const isCreditError = log.error_message && (
          log.error_message.includes("402") || 
          log.error_message.includes("credit") || 
          log.error_message.includes("Credit") ||
          log.error_message.includes("429") ||
          log.error_message.includes("rate limit")
        );
        if (!isCreditError) continue;

        // Check if this user already got a summary (from the regular run above or previously)
        const userPrefs = (allPreferences || []).find((p: any) => p.user_id === log.user_id);
        const lastSent = userPrefs?.weekly_summary_last_sent_at ? new Date(userPrefs.weekly_summary_last_sent_at) : null;
        const failedAt = new Date(log.created_at);
        
        // Skip if a summary was successfully sent after the failure
        if (lastSent && lastSent > failedAt) continue;
        
        // Skip if already sent in this run
        if (sentCount > 0 && retriedUsers.size > 0) {
          // Double-check from DB
          const { data: recentSummary } = await supabase
            .from("weekly_summaries")
            .select("id")
            .eq("user_id", log.user_id)
            .gte("created_at", failedAt.toISOString())
            .limit(1);
          if (recentSummary && recentSummary.length > 0) continue;
        }

        retriedUsers.add(log.user_id);
        console.log(`🔁 Retrying credit-failed summary for user ${log.user_id} (failed at ${log.created_at})`);
        
        const retryResult = await generateAndSendSummary(supabase, log.user_id, GEMINI_API_KEY, 1);
        if (retryResult.success) {
          sentCount++;
          processedCount++;
          console.log(`✅ Credit-retry succeeded for user ${log.user_id}`);
        } else {
          console.log(`⚠️ Credit-retry still failing for user ${log.user_id}: ${retryResult.error}`);
          // Stop retrying other users if credits are still exhausted
          if (retryResult.error && (retryResult.error.includes("402") || retryResult.error.includes("credit"))) {
            console.log(`🛑 Credits still unavailable, stopping retry loop`);
            break;
          }
        }
      }
    }

    console.log(`✅ Summary check complete. Processed: ${processedCount}, Sent: ${sentCount}`);

    return new Response(
      JSON.stringify({ success: true, processed: processedCount, sent: sentCount }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Hourly summary check error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
