import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-256-GCM encryption using Web Crypto API (identical to hourly-summary-check)
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

// Returns true only if the text is already valid base64 with enough bytes to
// contain at least the 12-byte IV — i.e. it was produced by encryptText.
function looksEncrypted(text: string): boolean {
  if (!text || text.length < 20) return false;
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

  // SECURITY: Validate cron secret (same pattern as hourly-summary-check)
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");

  if (!expectedSecret || cronSecret !== expectedSecret) {
    console.error("Unauthorized: Invalid or missing cron secret");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const encryptionKey = Deno.env.get("MESSAGE_ENCRYPTION_KEY");
  if (!encryptionKey) {
    return new Response(
      JSON.stringify({ error: "MESSAGE_ENCRYPTION_KEY is not set" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: "Missing Supabase environment variables" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log("🔐 Starting encryption of existing plain-text summaries...");

  // Fetch all rows — filtering on the DB side isn't practical for a base64
  // heuristic, so pull everything and filter in-process.
  const { data: rows, error: fetchError } = await supabase
    .from("weekly_summaries")
    .select("id, summary_text");

  if (fetchError) {
    console.error("Failed to fetch weekly_summaries:", fetchError);
    return new Response(
      JSON.stringify({ error: fetchError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const plainRows = (rows ?? []).filter(
    (r: { id: string; summary_text: string }) => !looksEncrypted(r.summary_text)
  );

  console.log(`Found ${rows?.length ?? 0} total rows, ${plainRows.length} need encryption.`);

  let encryptedCount = 0;
  const errors: { id: string; error: string }[] = [];

  for (const row of plainRows) {
    try {
      const encryptedText = await encryptText(row.summary_text, encryptionKey);

      const { error: updateError } = await supabase
        .from("weekly_summaries")
        .update({ summary_text: encryptedText })
        .eq("id", row.id);

      if (updateError) {
        throw updateError;
      }

      encryptedCount++;
      console.log(`✅ Encrypted row ${row.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ Failed to encrypt row ${row.id}:`, message);
      errors.push({ id: row.id, error: message });
    }
  }

  console.log(`🏁 Done. Encrypted: ${encryptedCount}, Errors: ${errors.length}`);

  return new Response(
    JSON.stringify({
      success: true,
      total: rows?.length ?? 0,
      skipped: (rows?.length ?? 0) - plainRows.length,
      encrypted: encryptedCount,
      errors,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
