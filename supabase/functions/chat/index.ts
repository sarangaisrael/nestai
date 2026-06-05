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
    console.log("[chat] ── STEP 1: reading env vars");
    const GEMINI_API_KEY            = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL              = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ENCRYPTION_KEY            = Deno.env.get("MESSAGE_ENCRYPTION_KEY") || "nestai-encryption-key-2026";
    console.log("[chat] GEMINI_API_KEY present:", !!GEMINI_API_KEY);
    console.log("[chat] SUPABASE_URL present:", !!SUPABASE_URL);
    console.log("[chat] SUPABASE_SERVICE_ROLE_KEY present:", !!SUPABASE_SERVICE_ROLE_KEY);
    console.log("[chat] ENCRYPTION_KEY source:", Deno.env.get("MESSAGE_ENCRYPTION_KEY") ? "env" : "fallback");

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── Auth ──────────────────────────────────────────────────────────────────
    console.log("[chat] ── STEP 2: verifying JWT");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("[chat] No Authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("[chat] Auth error:", JSON.stringify(authError));
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    console.log("[chat] JWT OK, userId:", user.id);

    const userId = user.id;

    // ── Parse & validate body ─────────────────────────────────────────────────
    console.log("[chat] ── STEP 3: parsing request body");
    const body = await req.json();
    const message: string = body?.message;
    console.log("[chat] message length:", message?.length ?? "undefined");

    if (!message || typeof message !== "string") {
      console.error("[chat] Missing or invalid message field");
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

    // ── Fetch recent history for context BEFORE saving current message ─────────
    // (Fetching first ensures the current message is never duplicated in history)
    console.log("[chat] ── STEP 4: fetching message history");
    const { data: recentMessages, error: fetchError } = await supabase
      .from("messages")
      .select("role, text, created_at")
      .eq("user_id", userId)
      .eq("is_system", false)          // exclude system-tagged messages
      .order("created_at", { ascending: false })
      .limit(20);

    if (fetchError) {
      console.error("[chat] Error fetching recent messages:", JSON.stringify(fetchError));
      throw fetchError;
    }
    console.log("[chat] Fetched", recentMessages?.length ?? 0, "messages");

    const decryptedMessages = await Promise.all(
      (recentMessages || []).map(async (msg) => {
        if (looksEncrypted(msg.text)) {
          return { ...msg, text: await decryptText(msg.text, ENCRYPTION_KEY) };
        }
        return msg;
      })
    );

    // Chronological order, last 10 exchanges (exclude any stray system-prompt text)
    const conversationHistory = [...decryptedMessages]
      .reverse()
      .slice(-10)
      .filter((msg) => msg.role === "user" || msg.role === "assistant")
      .map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.text,
      }));
    console.log("[chat] Conversation history length:", conversationHistory.length);

    // ── Save user message (encrypted) ─────────────────────────────────────────
    console.log("[chat] ── STEP 5: encrypting and saving user message");
    const encryptedUserMessage = await encryptText(message, ENCRYPTION_KEY);
    const { error: insertUserError } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        role: "user",
        text: encryptedUserMessage,
        is_system: false,
        reply_count: 0,
        source: "chat",
      });

    if (insertUserError) {
      console.error("[chat] Failed to save user message:", JSON.stringify(insertUserError));
      throw insertUserError;
    }
    console.log("[chat] User message saved OK");

    // ── System prompt (from DB, fallback to minimal Hebrew prompt) ────────────
    console.log("[chat] ── STEP 6: fetching system prompt");

    let basePrompt = "";
    let aiSiteInstruction = "";
    let appInstructions = "";
    try {
      const { data: promptRows } = await supabase
        .from("system_messages")
        .select("title, body")
        .in("title", ["chat_system_prompt", "ai_site_instruction", "app_instructions"]);

      for (const row of (promptRows || [])) {
        if (row.title === "chat_system_prompt")       basePrompt = row.body;
        else if (row.title === "ai_site_instruction") aiSiteInstruction = row.body;
        else if (row.title === "app_instructions")    appInstructions = row.body;
      }
      console.log("[chat] System prompts loaded — basePrompt:", !!basePrompt, "siteInstruction:", !!aiSiteInstruction);
    } catch (e) {
      console.log("[chat] Could not fetch system prompts:", e);
    }

    if (!basePrompt && !aiSiteInstruction) {
      basePrompt = "אתה עוזר ידידותי. ענה בקצרה ובעברית.";
      console.log("[chat] Using fallback system prompt");
    }

    const systemPrompt = [basePrompt, aiSiteInstruction, appInstructions]
      .filter(Boolean)
      .join("\n\n");

    // ── Call Gemini ───────────────────────────────────────────────────────────
    console.log("[chat] ── STEP 7: calling Gemini gemini-2.5-flash");
    const aiPayload = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message },
    ];
    console.log("[chat] aiPayload message count:", aiPayload.length);

    const aiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "gemini-2.5-flash", messages: aiPayload }),
      }
    );
    console.log("[chat] Gemini HTTP status:", aiResponse.status);

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[chat] Gemini API error body:", errText);
      throw new Error(`AI API error: ${aiResponse.status} — ${errText}`);
    }

    const aiData = await aiResponse.json();
    console.log("[chat] Gemini response keys:", Object.keys(aiData).join(", "));

    if (!aiData.choices?.length || !aiData.choices[0]?.message?.content) {
      console.error("[chat] Unexpected Gemini response format:", JSON.stringify(aiData));
      throw new Error("Invalid AI response format");
    }

    const rawReply: string = aiData.choices[0].message.content;
    console.log("[chat] rawReply length:", rawReply.length);

    // Keep only Hebrew blocks (Gemini sometimes prepends English reasoning)
    const blocks = rawReply.split(/\n\s*\n/);
    const hebrewBlocks = blocks.filter((b) => /[֐-׿]/.test(b));
    const hebrewText = (hebrewBlocks.length > 0
      ? hebrewBlocks[hebrewBlocks.length - 1]
      : rawReply
    ).trim();

    // Strip markdown formatting so plain text reaches the client
    const reply = hebrewText
      .replace(/\*\*(.+?)\*\*/g, "$1")   // **bold**
      .replace(/\*(.+?)\*/g, "$1")        // *italic*
      .replace(/__(.+?)__/g, "$1")        // __bold__
      .replace(/_(.+?)_/g, "$1")          // _italic_
      .replace(/^#{1,6}\s+/gm, "")        // # headers
      .replace(/^[-*•]\s+/gm, "")         // bullet points
      .replace(/^\d+\.\s+/gm, "")         // numbered lists
      .replace(/`{1,3}[^`]*`{1,3}/g, "")  // `code` / ```blocks```
      .replace(/\[(.+?)\]\(.+?\)/g, "$1") // [link](url) → link text only
      .trim();
    console.log("[chat] reply length after Hebrew filter + markdown strip:", reply.length);

    // ── Save AI reply (encrypted) ─────────────────────────────────────────────
    console.log("[chat] ── STEP 8: saving assistant reply");
    const encryptedReply = await encryptText(reply, ENCRYPTION_KEY);
    const { error: insertReplyError } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        role: "assistant",
        text: encryptedReply,
        is_system: false,
        reply_count: 0,
        source: "chat",
      });

    if (insertReplyError) {
      console.error("[chat] Failed to save assistant message (non-fatal):", JSON.stringify(insertReplyError));
    } else {
      console.log("[chat] Assistant message saved OK");
    }

    console.log("[chat] ── STEP 9: returning response to client");
    // ── Return plaintext reply to client ──────────────────────────────────────
    return new Response(
      JSON.stringify({ reply, shouldRespond: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[chat] ── FATAL ERROR:", error instanceof Error ? error.message : String(error));
    console.error("[chat] Stack:", error instanceof Error ? error.stack : "no stack");
    console.error("[chat] Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
