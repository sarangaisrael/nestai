import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const encryptionKey = Deno.env.get('MESSAGE_ENCRYPTION_KEY');

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate current week boundaries
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    console.log(`Generating partial summary for user ${user.id} from ${weekStart.toISOString()}`);

    // Fetch user's messages from the current week
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('text, created_at')
      .eq('user_id', user.id)
      .gte('created_at', weekStart.toISOString())
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return new Response(JSON.stringify({ error: 'Failed to fetch messages' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ 
        summary: 'עדיין אין מספיק רשומות השבוע כדי ליצור סיכום ביניים.',
        isEmpty: true 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Decrypt messages if encryption key is available
    const decryptedMessages = encryptionKey 
      ? await Promise.all(messages.map(async (m) => {
          if (looksEncrypted(m.text)) {
            const decryptedText = await decryptText(m.text, encryptionKey);
            return { ...m, text: decryptedText };
          }
          return m;
        }))
      : messages;

    // Get user preferences
    const { data: userPrefs } = await supabase
      .from("user_preferences")
      .select("therapy_type, summary_focus")
      .eq("user_id", user.id)
      .single();

    const therapyType = userPrefs?.therapy_type || null;
    const summaryFocus = userPrefs?.summary_focus || ["emotions", "thoughts", "behaviors", "changes"];

    // Filter out system messages and join text
    const userMessages = decryptedMessages
      .filter(m => m.text && !m.text.startsWith('איך היה'))
      .map(m => m.text)
      .join('\n\n');

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
      const adminSupabase = createClient(supabaseUrl, supabaseKey);
      const { data: adminPrompt } = await adminSupabase
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

    // Generate summary using Lovable AI
    const defaultPrompt = `את/ה כותב/ת סיכום חלקי (עד כה) של יומן רגשי שבועי.

הסיכום צריך להיות כתוב בעברית, בסגנון נרטיבי וזורם, בפסקאות רציפות קצרות יותר מהסיכום השבועי המלא.
אין להשתמש בכותרות, מספור, נקודות או מקפים. הכל כתוב כטקסט רציף.

התמקדות מיוחדת: ${focusAreas}${therapyInstruction}

המבנה:
1. פסקה קצרה (5-8 שורות) שמתארת מה נכתב עד כה השבוע באופן כללי
2. פסקה קצרה על דפוסים רגשיים או מחשבתיים שהתחילו להופיע (דגש אם רגשות/מחשבות נבחרו)
3. אם התנהגויות או שינויים נבחרו - דגש על דפוסים התנהגותיים וכל שינוי שהתחיל להופיע
4. אזכור קצר של 3-5 נושאים חוזרים שעלו (לא כרשימה אלא בתוך הטקסט)
5. אזכור של כמה מילים או ביטויים שחזרו (לא כרשימה אלא בתוך הטקסט)

הטון חייב להיות ניטרלי, ללא אבחנה, ללא הוראות טיפוליות, ללא "צריך" או "כדאי".
השפה חייבת להיות ניטרלית מבחינת מגדר. להימנע מפעלים או כינויים ממוגדרים.

הסיכום חייב להסתמך רק על מה שנכתב. אסור להמציא מידע.

בסוף הסיכום, להוסיף חלק בשם "נושאים שכדאי לדבר עליהם בטיפול" ולרשום את הנושאים המרכזיים שעלו עד כה ושיכולים להיות רלוונטיים לשיחה טיפולית. כל נושא בשורה נפרדת. הנושאים צריכים להיות ספציפיים ומבוססים על מה שנכתב ביומן, לא כלליים.

אורך: קצר-בינוני. זה סיכום ביניים, לא מלא.`;

    const systemPrompt = adminPromptOverride
      ? `${adminPromptOverride}\n\nהתמקדות מיוחדת: ${focusAreas}${therapyInstruction}\n\nזהו סיכום ביניים חלקי (לא סיכום שבועי מלא). אורך: קצר-בינוני.`
      : defaultPrompt;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessages }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Failed to generate summary' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0].message.content;

    console.log('Partial summary generated successfully');

    return new Response(JSON.stringify({ summary, isEmpty: false }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-partial-summary:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
