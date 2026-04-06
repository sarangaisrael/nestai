import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

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

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calculate date 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    // Fetch user messages from the last week only
    const { data: messages, error: fetchError } = await supabase
      .from("messages")
      .select("text")
      .eq("role", "user")
      .gte("created_at", oneWeekAgoISO)
      .order("created_at");

    if (fetchError) throw fetchError;

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "No messages found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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

    // Prepare messages text for analysis
    const messagesText = decryptedMessages.map((m, i) => `${i + 1}. ${m.text}`).join("\n");

    const systemPrompt = `אתה מנתח תוכן מומחה שמבצע ניתוח אנונימי של הודעות מיומן טיפולי מהשבוע האחרון בלבד.

משימתך: לנתח את ההודעות ולספק סטטיסטיקות מצטברות על נושאים וקטגוריות רגשיות, בלי לחשוף תוכן ספציפי או זהויות.

יש לך ${messages.length} הודעות מהשבוע האחרון לניתוח.

הנחיות:
1. זהה קטגוריות רגשיות עיקריות (חרדה, עצב, שמחה, בלבול, כעס, תסכול, אכזבה, תקווה, וכו')
2. זהה נושאים חוזרים (עבודה, מערכות יחסים, בריאות, משפחה, שינה, לימודים, וכו')
3. החזר אחוזים מדויקים ומעוגלים (לדוגמה: "15% מההודעות עסקו ב...")
4. התמקד בדפוסים כלליים, לא בפרטים ספציפיים
5. השתמש בעברית טבעית וברורה
6. אל תצטט הודעות ספציפיות - רק נתונים מצטברים

פורמט התשובה:
- 📊 **סטטיסטיקות רגשיות** (אחוזים מדויקים)
- 🏷️ **נושאים מרכזיים** (אחוזים מדויקים)
- 💭 **תובנות כלליות** (ללא ציטוטים, רק דפוסים)`;

    // Call Lovable AI
    const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `נתח את ההודעות הבאות:\n\n${messagesText}` }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices[0]?.message?.content;

    if (!analysis) {
      throw new Error("No analysis received from AI");
    }

    return new Response(
      JSON.stringify({ 
        analysis,
        totalMessages: messages.length 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error: any) {
    console.error("Error in analyze-content:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});
