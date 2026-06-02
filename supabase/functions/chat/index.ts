import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── AES-256-GCM helpers (exact mirror of hourly-summary-check) ───────────────

async function encryptText(plaintext: string, keyString: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
  const keyBytes = new Uint8Array(hashBuffer);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedText = encoder.encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, encodedText);
  const combined = new Uint8Array(12 + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), 12);
  return btoa(String.fromCharCode(...combined));
}

async function decryptText(encryptedBase64: string, keyString: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(keyString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
    const keyBytes = new Uint8Array(hashBuffer);
    const cryptoKey = await crypto.subtle.importKey(
      "raw", keyBytes, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);
    const plaintextBytes = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv }, cryptoKey, ciphertext
    );
    return new TextDecoder().decode(plaintextBytes);
  } catch {
    // Not encrypted or wrong key — return as-is
    return encryptedBase64;
  }
}

function looksEncrypted(text: string): boolean {
  if (!text || text.length < 20) return false;
  try {
    return atob(text).length >= 12;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY          = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL            = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ENCRYPTION_KEY          = Deno.env.get("MESSAGE_ENCRYPTION_KEY") || "nestai-encryption-key-2026";

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;

    // ── Parse & validate body ─────────────────────────────────────────────────
    const body = await req.json();
    const message: string = body?.message;

    if (!message || typeof message !== "string") {
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

    // ── Save user message (encrypted) ─────────────────────────────────────────
    const encryptedUserMessage = await encryptText(message, ENCRYPTION_KEY);
    const { error: insertUserError } = await supabase
      .from("messages")
      .insert({ user_id: userId, role: "user", text: encryptedUserMessage });

    if (insertUserError) {
      console.error("Failed to save user message:", insertUserError);
      throw insertUserError;
    }

    // ── Fetch recent history for context (decrypt for AI) ─────────────────────
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

    const decryptedMessages = await Promise.all(
      (recentMessages || []).map(async (msg) => {
        if (looksEncrypted(msg.text)) {
          return { ...msg, text: await decryptText(msg.text, ENCRYPTION_KEY) };
        }
        return msg;
      })
    );

    // Chronological order, last 10 exchanges
    const conversationHistory = [...decryptedMessages]
      .reverse()
      .slice(-10)
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.text,
      }));

    // ── System prompt (from DB, fallback to minimal Hebrew prompt) ────────────
    let basePrompt = "";
    let aiSiteInstruction = "";
    let appInstructions = "";
    try {
      const { data: promptRows } = await supabase
        .from("system_messages")
        .select("title, body")
        .in("title", ["chat_system_prompt", "ai_site_instruction", "app_instructions"]);

      for (const row of (promptRows || [])) {
        if (row.title === "chat_system_prompt")   basePrompt = row.body;
        else if (row.title === "ai_site_instruction") aiSiteInstruction = row.body;
        else if (row.title === "app_instructions")    appInstructions = row.body;
      }
    } catch (e) {
      console.log("Could not fetch system prompts:", e);
    }

    if (!basePrompt && !aiSiteInstruction) {
      basePrompt = "אתה עוזר ידידותי. ענה בקצרה ובעברית.";
    }

    const systemPrompt = [basePrompt, aiSiteInstruction, appInstructions]
      .filter(Boolean)
      .join("\n\n");

    // ── Call Gemini ───────────────────────────────────────────────────────────
    const aiPayload = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];

    const aiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "gemini-2.0-flash", messages: aiPayload }),
      }
    );

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", errText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    if (!aiData.choices?.length || !aiData.choices[0]?.message?.content) {
      console.error("Unexpected AI response format:", JSON.stringify(aiData));
      throw new Error("Invalid AI response format");
    }

    const rawReply: string = aiData.choices[0].message.content;

    // Keep only Hebrew blocks (Gemini sometimes prepends English reasoning)
    const blocks = rawReply.split(/\n\s*\n/);
    const hebrewBlocks = blocks.filter((b) => /[֐-׿]/.test(b));
    const reply = (hebrewBlocks.length > 0
      ? hebrewBlocks[hebrewBlocks.length - 1]
      : rawReply
    ).trim();

    // ── Save AI reply (encrypted) ─────────────────────────────────────────────
    const encryptedReply = await encryptText(reply, ENCRYPTION_KEY);
    const { error: insertReplyError } = await supabase
      .from("messages")
      .insert({ user_id: userId, role: "assistant", text: encryptedReply });

    if (insertReplyError) {
      // Non-fatal: reply is already generated, just log and continue
      console.error("Failed to save assistant message:", insertReplyError);
    }

    // ── Return plaintext reply to client ──────────────────────────────────────
    return new Response(
      JSON.stringify({ reply, shouldRespond: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
