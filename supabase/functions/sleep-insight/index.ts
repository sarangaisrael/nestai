import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── AES-256-GCM decrypt (SHA-256 key hash — matches chat function) ────────────
async function decryptText(encryptedBase64: string, keyString: string): Promise<string> {
  try {
    const keyData    = new TextEncoder().encode(keyString);
    const hashBuffer = await crypto.subtle.digest("SHA-256", keyData);
    const cryptoKey  = await crypto.subtle.importKey(
      "raw", new Uint8Array(hashBuffer), { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    const combined   = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
    const plainBytes = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: combined.slice(0, 12) }, cryptoKey, combined.slice(12)
    );
    return new TextDecoder().decode(plainBytes);
  } catch {
    return encryptedBase64;
  }
}

function looksEncrypted(text: string): boolean {
  if (!text || text.length < 20) return false;
  try { return atob(text).length >= 12; } catch { return false; }
}

// ─────────────────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const GEMINI_API_KEY            = Deno.env.get("GEMINI_API_KEY");
    const SUPABASE_URL              = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const ENCRYPTION_KEY            = Deno.env.get("MESSAGE_ENCRYPTION_KEY") || "nestai-encryption-key-2026";

    if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing env vars");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Date range: last 7 days ───────────────────────────────────────────────
    const now   = new Date();
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(d);
    });
    const weekStart = dates[0];
    const weekEnd   = dates[6];

    // ── Fetch sleep logs ──────────────────────────────────────────────────────
    const { data: sleepLogs } = await supabase
      .from("sleep_logs")
      .select("date, sleep_hours, sleep_quality, sleep_time, wake_time")
      .eq("user_id", user.id)
      .gte("date", weekStart)
      .lte("date", weekEnd)
      .order("date", { ascending: true });

    const validSleepLogs = (sleepLogs ?? []).filter(s => s.sleep_hours && s.sleep_hours > 0);

    if (validSleepLogs.length < 2) {
      return new Response(JSON.stringify({ insight: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Fetch user chat messages from the same week ───────────────────────────
    const { data: messages } = await supabase
      .from("messages")
      .select("text, created_at")
      .eq("user_id", user.id)
      .eq("role", "user")
      .eq("is_system", false)
      .gte("created_at", `${weekStart}T00:00:00Z`)
      .lte("created_at", `${weekEnd}T23:59:59Z`)
      .order("created_at", { ascending: true })
      .limit(40);

    const decryptedMessages = await Promise.all(
      (messages ?? []).map(async m => ({
        date: new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date(m.created_at)),
        text: looksEncrypted(m.text) ? await decryptText(m.text, ENCRYPTION_KEY) : m.text,
      }))
    );

    // ── Build context for Gemini ──────────────────────────────────────────────
    const qualityLabel = (q: number | null) =>
      q === 1 ? "גרוע" : q === 2 ? "לא טוב" : q === 3 ? "בסדר" : q === 4 ? "טוב" : q === 5 ? "מעולה" : "";

    const sleepContext = validSleepLogs.map(s =>
      `• ${s.date}: ${s.sleep_hours} שעות${s.sleep_quality ? `, איכות: ${qualityLabel(s.sleep_quality)}` : ""}${s.sleep_time ? `, ישן ${s.sleep_time.slice(0,5)}` : ""}${s.wake_time ? ` — קם ${s.wake_time.slice(0,5)}` : ""}`
    ).join("\n");

    const chatContext = decryptedMessages.length > 0
      ? decryptedMessages.map(m => `[${m.date}] ${m.text}`).join("\n")
      : "אין תכתובות מהשבוע הזה.";

    const prompt = `אתה מנתח שינה ורגשות. לפניך נתוני שינה ותכתובות יומן מהשבוע האחרון.

נתוני שינה:
${sleepContext}

תכתובות יומן (לפי תאריך):
${chatContext}

כתוב תובנה קצרה אחת בעברית — משפט אחד או שניים — שמחברת בין דפוס השינה למצב הרגשי שעולה מהיומן.
השתמש בנתונים ספציפיים (מספרים, ימים). דוגמה: "בלילות שישנת יותר מ-7 שעות, הרשומות ביומן היו חיוביות יותר."
אם אין קשר ברור — ציין תובנה על דפוס השינה עצמו.
החזר רק את התובנה, ללא הסברים נוספים.`;

    // ── Call Gemini ───────────────────────────────────────────────────────────
    const aiRes = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GEMINI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      }
    );

    if (!aiRes.ok) throw new Error(`Gemini error: ${aiRes.status}`);

    const aiData = await aiRes.json();
    const raw    = aiData.choices?.[0]?.message?.content ?? "";

    // Keep only the Hebrew part, strip markdown
    const blocks       = raw.split(/\n\s*\n/);
    const hebrewBlocks = blocks.filter(b => /[֐-׿]/.test(b));
    const insight      = (hebrewBlocks.length > 0 ? hebrewBlocks[hebrewBlocks.length - 1] : raw)
      .trim()
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .trim();

    return new Response(JSON.stringify({ insight: insight || null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("[sleep-insight] error:", err);
    return new Response(JSON.stringify({ insight: null }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
