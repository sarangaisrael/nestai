import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.47.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth check ──────────────────────────────────────────────────────────────
    const SUPABASE_URL              = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const GEMINI_API_KEY            = Deno.env.get("GEMINI_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Parse request ───────────────────────────────────────────────────────────
    const body = await req.json();
    const base64   = body.base64;
    // Apply fallback here, before validation, so HEIC files with empty type still work
    const mimeType = body.mimeType || "image/jpeg";

    if (!base64) {
      return new Response(
        JSON.stringify({ error: "Missing base64 image data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[extract-image-text] mimeType:", mimeType, "base64 length:", base64.length);

    // ── Call Gemini with image ──────────────────────────────────────────────────
    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              inline_data: {
                mime_type: mimeType,
                data: base64,
              },
            },
            {
              text: "אנא חלץ את כל הטקסט הכתוב בתמונה הזו. אם זה כתב יד בעברית, תעתיק אותו במדויק. החזר רק את הטקסט, ללא הסברים.",
            },
          ],
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
        },
      }),
    });

    const geminiBody = await geminiRes.text();
    console.log("[extract-image-text] Gemini status:", geminiRes.status);
    console.log("[extract-image-text] Gemini body:", geminiBody.slice(0, 500));

    if (!geminiRes.ok) {
      console.error("[extract-image-text] Gemini error:", geminiRes.status, geminiBody);
      return new Response(
        JSON.stringify({ error: "Gemini API error", details: geminiBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = JSON.parse(geminiBody);

    // Handle safety blocks or empty candidates
    const candidate = geminiData?.candidates?.[0];
    if (!candidate) {
      console.error("[extract-image-text] No candidates in response:", JSON.stringify(geminiData));
      return new Response(
        JSON.stringify({ error: "Gemini returned no candidates", details: JSON.stringify(geminiData) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (candidate.finishReason === "SAFETY") {
      console.warn("[extract-image-text] Gemini blocked by safety filters");
      return new Response(
        JSON.stringify({ text: "" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const extractedText = candidate?.content?.parts?.[0]?.text?.trim() ?? "";
    console.log("[extract-image-text] extracted text length:", extractedText.length);

    return new Response(
      JSON.stringify({ text: extractedText }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("[extract-image-text] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
