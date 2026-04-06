import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@0.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // Must include all headers that the web client (supabase-js) may send.
  // Otherwise the browser will block the request at the CORS preflight stage
  // and the function will never run.
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Base64 URL encoding helper
function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

// Base64 URL decoding helper
function base64UrlDecode(str: string): Uint8Array {
  const s = str.trim().replace(/^"|"$/g, "");
  const padding = "=".repeat((4 - (s.length % 4)) % 4);
  const base64 = (s + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function toExportedVapidKeys(
  vapidPublicKey: string,
  vapidPrivateKey: string,
): webpush.ExportedVapidKeys {
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);

  // Public key is 65 bytes in uncompressed format: 0x04 + 32 bytes X + 32 bytes Y
  let x: Uint8Array;
  let y: Uint8Array;

  if (publicKeyBytes.length === 65 && publicKeyBytes[0] === 0x04) {
    x = publicKeyBytes.slice(1, 33);
    y = publicKeyBytes.slice(33, 65);
  } else if (publicKeyBytes.length === 64) {
    // Some generators omit the 0x04 prefix
    x = publicKeyBytes.slice(0, 32);
    y = publicKeyBytes.slice(32, 64);
  } else {
    throw new Error(
      `Invalid VAPID_PUBLIC_KEY format (decoded length ${publicKeyBytes.length}). Expected 65 bytes (uncompressed) or 64 bytes.`,
    );
  }

  // Private key is 32 bytes (the "d" parameter)
  if (privateKeyBytes.length !== 32) {
    throw new Error(
      `Invalid VAPID_PRIVATE_KEY format (decoded length ${privateKeyBytes.length}). Expected 32 bytes.`,
    );
  }

  const publicKeyJwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: base64UrlEncode(x),
    y: base64UrlEncode(y),
  };

  const privateKeyJwk: JsonWebKey = {
    ...publicKeyJwk,
    d: base64UrlEncode(privateKeyBytes),
  };

  return {
    publicKey: publicKeyJwk,
    privateKey: privateKeyJwk,
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ---- AuthZ
    // This endpoint is called by:
    // - schedulers/admin broadcast (service role)
    // - signed-in users for sending a *self* test notification
    const authHeader = req.headers.get("Authorization") ?? "";

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const bearer = authHeader.slice("Bearer ".length);
    const isServiceRoleCaller = bearer === supabaseServiceKey;

    let requesterUserId: string | null = null;
    if (!isServiceRoleCaller) {
      // Validate caller and extract user id
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const { data: userData, error: userError } = await userClient.auth.getUser();
      if (userError || !userData.user) {
        console.error("send-push-notification: user verification failed", userError);
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      requesterUserId = userData.user.id;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const reqBody = await req.json();
    const { userId, title, body, url } = reqBody;

    // Input validation
    if (!userId || typeof userId !== 'string') {
      return new Response(
        JSON.stringify({ error: "Missing or invalid userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (title && (typeof title !== 'string' || title.length > 200)) {
      return new Response(
        JSON.stringify({ error: "Title must be a string under 200 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (body && (typeof body !== 'string' || body.length > 1000)) {
      return new Response(
        JSON.stringify({ error: "Body must be a string under 1000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (url && typeof url === 'string') {
      // Only allow relative URLs starting with /
      if (!url.startsWith('/') || url.startsWith('//')) {
        return new Response(
          JSON.stringify({ error: "Invalid URL: must be a relative path" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // If not service role, allow sending only to self (or admin)
    if (!isServiceRoleCaller) {
      if (!requesterUserId) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (userId !== requesterUserId) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", requesterUserId)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          return new Response(
            JSON.stringify({ error: "Forbidden" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }
      }
    }

    console.log("send-push-notification: Sending push notification to user:", userId);

    // Get user's push subscription
    const { data: subscription, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint,p256dh,auth")
      .eq("user_id", userId)
      .maybeSingle();

    if (subError) {
      console.error("Error fetching subscription:", subError);
      throw subError;
    }

    if (!subscription) {
      console.log("send-push-notification: No push subscription found for user:", userId);
      return new Response(
        JSON.stringify({ success: false, message: "No subscription found" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const payload = JSON.stringify({
      title: title || "NestAI",
      body: body || "",
      url: url || "/",
      dir: "rtl",
      lang: "he",
    });

    // Build a compliant Web Push request (RFC 8291/8292), including payload encryption.
    const exportedVapidKeys = toExportedVapidKeys(vapidPublicKey, vapidPrivateKey);
    const vapidKeys = await webpush.importVapidKeys(exportedVapidKeys, {
      extractable: false,
    });

    const appServer = await webpush.ApplicationServer.new({
      contactInformation: "mailto:support@nest-ai.app",
      vapidKeys,
    });

    const subscriber = appServer.subscribe({
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    });

    try {
      console.log(
        `send-push-notification: About to call pushTextMessage for user ${userId}, endpoint: ${subscription.endpoint.substring(0, 60)}...`
      );
      await subscriber.pushTextMessage(payload, {
        ttl: 60 * 60 * 24, // 1 day
        urgency: webpush.Urgency.High,
      });

      console.log("send-push-notification: Push notification accepted by push service");

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (err: unknown) {
      if (err instanceof webpush.PushMessageError) {
        // Log full details so we can debug if needed
        console.error(
          `send-push-notification: PushMessageError for user ${userId}:`,
          JSON.stringify({
            message: err.message,
            name: err.name,
            isGone: err.isGone(),
            endpoint: subscription.endpoint.substring(0, 60),
          })
        );

        // If subscription is invalid/expired, remove it and tell caller
        if (err.isGone()) {
          console.log(`send-push-notification: Subscription expired (410 Gone) for user ${userId}, removing from database`);
          await supabase.from("push_subscriptions").delete().eq("user_id", userId);

          return new Response(
            JSON.stringify({
              success: false,
              message: "Subscription expired. Please re-enable notifications.",
              error: err.toString(),
              gone: true,
            }),
            {
              status: 200, // 200 so the client handles it gracefully
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        return new Response(
          JSON.stringify({ success: false, error: err.toString() }),
          {
            status: 502,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.error(`send-push-notification: Non-PushMessageError for user ${userId}:`, String(err));
      throw err;
    }
  } catch (error: any) {
    console.error("Error sending push notification:", error);

    return new Response(
      JSON.stringify({ error: error?.message ?? String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
