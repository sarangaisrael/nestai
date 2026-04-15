import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-256-GCM decryption using Web Crypto API
async function decryptText(encryptedBase64: string, keyString: string): Promise<string> {
  try {
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    
    // Hash the key to ensure it's always 32 bytes for AES-256
    const keyData = encoder.encode(keyString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
    const keyBytes = new Uint8Array(hashBuffer);
    
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
    console.log("Decryption failed, returning original text (likely unencrypted)");
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
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ENCRYPTION_KEY = Deno.env.get("MESSAGE_ENCRYPTION_KEY");

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // SECURITY FIX: Extract userId from JWT instead of request body
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const userId = user.id;
    const body = await req.json();
    const message = body?.message;

    // Input validation
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: "Missing or invalid message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (message.length > 10000) {
      return new Response(
        JSON.stringify({ error: "Message too long (max 10,000 characters)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get recent messages for context and reply count
    const { data: recentMessages, error: fetchError } = await supabase
      .from("messages")
      .select("role, text, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(15);

    if (fetchError) {
      console.error("Error fetching recent messages:", fetchError);
      throw fetchError;
    }

    // Decrypt messages if encryption key is available
    const decryptedMessages = ENCRYPTION_KEY 
      ? await Promise.all((recentMessages || []).map(async (msg) => {
          if (looksEncrypted(msg.text)) {
            const decryptedText = await decryptText(msg.text, ENCRYPTION_KEY);
            return { ...msg, text: decryptedText };
          }
          return msg;
        }))
      : recentMessages || [];

    // Build conversation history in chronological order
    const messagesAsc = [...decryptedMessages].reverse();
    const conversationHistory = messagesAsc
      .slice(-10)
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.text,
      }));

    // Try to fetch the AI system prompt from system_messages (Admin is the SOLE source)
    let basePrompt = "";
    let aiSiteInstruction = "";
    let appInstructions = "";
    try {
      const { data: promptRows } = await supabase
        .from("system_messages")
        .select("title, body")
        .in("title", ["chat_system_prompt", "ai_site_instruction", "app_instructions"]);
      
      for (const row of (promptRows || [])) {
        if (row.title === "chat_system_prompt") basePrompt = row.body;
        else if (row.title === "ai_site_instruction") aiSiteInstruction = row.body;
        else if (row.title === "app_instructions") appInstructions = row.body;
      }
    } catch (e) {
      console.log("Could not fetch system prompts:", e);
    }

    // If no admin prompt is set, use a minimal fallback
    if (!basePrompt && !aiSiteInstruction) {
      basePrompt = "אתה עוזר ידידותי. ענה בקצרה ובעברית.";
    }

    // Admin prompt is the SOLE source of behavior - no hardcoded rules
    // Admin prompt + site instruction + app instructions = SOLE source of behavior
    const systemPrompt = [basePrompt, aiSiteInstruction, appInstructions].filter(Boolean).join("\n\n");

    // Include conversation history + current message
    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const aiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages,
        thinking_config: { thinking_budget: 0 },
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", await aiResponse.text());
      throw new Error("AI API error");
    }

    const aiData = await aiResponse.json();
    const rawReply: string = aiData.choices[0].message.content;

    // Split into blocks separated by blank lines, keep only blocks that contain Hebrew,
    // then take the last contiguous Hebrew block — the actual response always appears last.
    const blocks = rawReply.split(/\n\s*\n/);
    const hebrewBlocks = blocks.filter((b) => /[\u0590-\u05FF]/.test(b));
    const reply = (hebrewBlocks.length > 0 ? hebrewBlocks[hebrewBlocks.length - 1] : rawReply).trim();

    return new Response(
      JSON.stringify({
        reply,
        shouldRespond: true
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
