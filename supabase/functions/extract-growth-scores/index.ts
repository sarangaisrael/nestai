import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Decryption helpers (same as get-decrypted-summary) ───────────────────────

async function decryptText(encryptedBase64: string, keyString: string): Promise<string> {
  const keyData = new TextEncoder().encode(keyString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
  const cryptoKey = await crypto.subtle.importKey(
    "raw", new Uint8Array(hashBuffer), { name: "AES-GCM", length: 256 }, false, ["decrypt"]
  );
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintextBytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, ciphertext);
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

function clamp(v: number): number {
  return Math.max(1, Math.min(5, v));
}

// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const GEMINI_API_KEY           = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL             = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY        = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ENCRYPTION_KEY           = Deno.env.get("MESSAGE_ENCRYPTION_KEY");
    if (!ENCRYPTION_KEY) throw new Error("MESSAGE_ENCRYPTION_KEY env var is not set");

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: "Missing env vars" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { summary_id } = await req.json();
    if (!summary_id) {
      return new Response(JSON.stringify({ error: "summary_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch summary with service role (bypasses RLS) then enforce ownership
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: row } = await admin
      .from("weekly_summaries")
      .select("id, user_id, summary_text, stress_score")
      .eq("id", summary_id)
      .maybeSingle();

    if (!row || row.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If scores were written between the frontend fetch and now, return them directly
    if (row.stress_score !== null) {
      const { data: full } = await admin
        .from("weekly_summaries")
        .select("stress_score, anxiety_score, joy_score")
        .eq("id", summary_id)
        .single();
      return new Response(JSON.stringify(full), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Decrypt summary_text if needed; fail hard if we can't — don't pass ciphertext to Gemini
    let summaryText: string = row.summary_text ?? "";
    if (looksEncrypted(summaryText)) {
      try {
        summaryText = await decryptText(summaryText, ENCRYPTION_KEY);
      } catch {
        console.error("extract-growth-scores: decryption failed for summary", summary_id);
        return new Response(JSON.stringify({ error: "Cannot decrypt summary" }), {
          status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!summaryText.trim()) {
      return new Response(JSON.stringify({ error: "Empty summary" }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Ask Gemini for scores
    const aiResp = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${GEMINI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [{
            role: "user",
            content:
              `מתוך הסיכום הזה, תן ציון מ-1 עד 5 עבור: לחץ, חרדה, שמחה. ` +
              `החזר JSON בלבד: {"stress": X, "anxiety": X, "joy": X}\n\nסיכום:\n${summaryText}`,
          }],
        }),
      }
    );

    if (!aiResp.ok) {
      console.error("Gemini error:", await aiResp.text());
      return new Response(JSON.stringify({ error: "AI call failed" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const raw = aiData.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response (handle markdown code blocks)
    let parsed: { stress?: number; anxiety?: number; joy?: number } = {};
    try {
      const jsonStr = raw.replace(/```json\n?|```/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      const sm = raw.match(/"stress"\s*:\s*(\d+\.?\d*)/);
      const am = raw.match(/"anxiety"\s*:\s*(\d+\.?\d*)/);
      const jm = raw.match(/"joy"\s*:\s*(\d+\.?\d*)/);
      if (sm) parsed.stress  = parseFloat(sm[1]);
      if (am) parsed.anxiety = parseFloat(am[1]);
      if (jm) parsed.joy     = parseFloat(jm[1]);
    }

    if (parsed.stress === undefined || parsed.anxiety === undefined || parsed.joy === undefined) {
      return new Response(JSON.stringify({ error: "Could not parse AI scores" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stress_score  = clamp(parsed.stress);
    const anxiety_score = clamp(parsed.anxiety);
    const joy_score     = clamp(parsed.joy);

    // Persist scores
    await admin
      .from("weekly_summaries")
      .update({ stress_score, anxiety_score, joy_score })
      .eq("id", summary_id);

    return new Response(
      JSON.stringify({ stress_score, anxiety_score, joy_score }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("extract-growth-scores error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
