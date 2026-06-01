import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── AES-256-GCM helpers (exact mirror of hourly-summary-check) ───────────────

async function decryptText(encryptedBase64: string, keyString: string): Promise<string> {
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

// ─────────────────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const MESSAGE_ENCRYPTION_KEY = Deno.env.get("MESSAGE_ENCRYPTION_KEY") || "nestai-encryption-key-2026";

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate user JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const summary_id: string = body.summary_id;
    const table: string = body.table ?? "weekly_summaries";

    if (!summary_id) {
      return new Response(
        JSON.stringify({ error: "summary_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only allow known summary tables
    if (table !== "weekly_summaries" && table !== "monthly_summaries") {
      return new Response(
        JSON.stringify({ error: "Invalid table" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the summary — service role so RLS doesn't block, but we enforce ownership manually
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: row, error: fetchError } = await supabaseAdmin
      .from(table)
      .select("summary_text, user_id")
      .eq("id", summary_id)
      .maybeSingle();

    if (fetchError || !row) {
      return new Response(
        JSON.stringify({ error: "Summary not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enforce ownership
    if (row.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Summary not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decrypt if needed; fall back to raw text if decryption fails
    let summary_text: string = row.summary_text;
    if (looksEncrypted(summary_text)) {
      try {
        summary_text = await decryptText(summary_text, MESSAGE_ENCRYPTION_KEY);
      } catch {
        // Not actually encrypted or wrong key — return raw
      }
    }

    return new Response(
      JSON.stringify({ summary_text }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("get-decrypted-summary error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
