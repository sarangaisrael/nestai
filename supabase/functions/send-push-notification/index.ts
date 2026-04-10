import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@0.3.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// ─── Base64 URL helpers ───────────────────────────────────────────────────────

function base64UrlEncode(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

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

// ─── Web Push VAPID helpers ───────────────────────────────────────────────────

function toExportedVapidKeys(
  vapidPublicKey: string,
  vapidPrivateKey: string,
): webpush.ExportedVapidKeys {
  const publicKeyBytes = base64UrlDecode(vapidPublicKey);
  const privateKeyBytes = base64UrlDecode(vapidPrivateKey);

  let x: Uint8Array;
  let y: Uint8Array;

  if (publicKeyBytes.length === 65 && publicKeyBytes[0] === 0x04) {
    x = publicKeyBytes.slice(1, 33);
    y = publicKeyBytes.slice(33, 65);
  } else if (publicKeyBytes.length === 64) {
    x = publicKeyBytes.slice(0, 32);
    y = publicKeyBytes.slice(32, 64);
  } else {
    throw new Error(
      `Invalid VAPID_PUBLIC_KEY format (decoded length ${publicKeyBytes.length}). Expected 65 or 64 bytes.`,
    );
  }

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

  return { publicKey: publicKeyJwk, privateKey: privateKeyJwk };
}

// ─── APNs JWT helpers ─────────────────────────────────────────────────────────

async function importApnsPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, "")
    .replace(/-----END PRIVATE KEY-----/g, "")
    .replace(/-----BEGIN EC PRIVATE KEY-----/g, "")
    .replace(/-----END EC PRIVATE KEY-----/g, "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

async function buildApnsJwt(
  keyId: string,
  teamId: string,
  privateKey: CryptoKey,
): Promise<string> {
  const header = { alg: "ES256", kid: keyId };
  const payload = { iss: teamId, iat: Math.floor(Date.now() / 1000) };

  const encodedHeader = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(header)),
  );
  const encodedPayload = base64UrlEncode(
    new TextEncoder().encode(JSON.stringify(payload)),
  );

  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(signingInput),
  );

  return `${signingInput}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function sendApnsNotification(opts: {
  deviceToken: string;
  title: string;
  body: string;
  url: string;
  bundleId: string;
  keyId: string;
  teamId: string;
  privateKeyPem: string;
}): Promise<{ success: boolean; gone?: boolean; error?: string }> {
  const { deviceToken, title, body, url, bundleId, keyId, teamId, privateKeyPem } = opts;

  const privateKey = await importApnsPrivateKey(privateKeyPem);
  const jwt = await buildApnsJwt(keyId, teamId, privateKey);

  const apnsPayload = JSON.stringify({
    aps: {
      alert: { title, body },
      sound: "default",
    },
    url,
  });

  const response = await fetch(
    `https://api.push.apple.com/3/device/${deviceToken}`,
    {
      method: "POST",
      headers: {
        authorization: `bearer ${jwt}`,
        "apns-topic": bundleId,
        "apns-push-type": "alert",
        "apns-priority": "10",
        "content-type": "application/json",
      },
      body: apnsPayload,
    },
  );

  if (response.status === 200) {
    return { success: true };
  }

  if (response.status === 410) {
    return { success: false, gone: true, error: "Device token expired (410 Gone)" };
  }

  const errorBody = await response.json().catch(() => ({}));
  return {
    success: false,
    error: (errorBody as any).reason ?? `APNs error ${response.status}`,
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") ?? "";

    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const apnsKeyId = Deno.env.get("APNS_KEY_ID");
    const apnsTeamId = Deno.env.get("APNS_TEAM_ID");
    const apnsBundleId = Deno.env.get("APNS_BUNDLE_ID");
    const apnsPrivateKey = Deno.env.get("APNS_PRIVATE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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
    if (!userId || typeof userId !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing or invalid userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (title && (typeof title !== "string" || title.length > 200)) {
      return new Response(
        JSON.stringify({ error: "Title must be a string under 200 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (body && (typeof body !== "string" || body.length > 1000)) {
      return new Response(
        JSON.stringify({ error: "Body must be a string under 1000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (url && typeof url === "string") {
      if (!url.startsWith("/") || url.startsWith("//")) {
        return new Response(
          JSON.stringify({ error: "Invalid URL: must be a relative path" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Authorization: non-service-role callers may only send to themselves (or admin)
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

    console.log("send-push-notification: Sending to user:", userId);

    // Fetch subscription — include platform to route APNs vs Web Push
    const { data: subscription, error: subError } = await supabase
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth, platform")
      .eq("user_id", userId)
      .maybeSingle();

    if (subError) {
      console.error("Error fetching subscription:", subError);
      throw subError;
    }

    if (!subscription) {
      console.log("send-push-notification: No subscription found for user:", userId);
      return new Response(
        JSON.stringify({ success: false, message: "No subscription found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const notifTitle = title || "NestAI";
    const notifBody = body || "";
    const notifUrl = url || "/";

    // ── iOS → APNs ────────────────────────────────────────────────────────────
    const isIos = subscription.platform === "ios";

    if (isIos) {
      if (!apnsKeyId || !apnsTeamId || !apnsBundleId || !apnsPrivateKey) {
        throw new Error(
          "APNs environment variables not configured (APNS_KEY_ID, APNS_TEAM_ID, APNS_BUNDLE_ID, APNS_PRIVATE_KEY)",
        );
      }

      console.log(`send-push-notification: Using APNs for user ${userId}`);

      const result = await sendApnsNotification({
        deviceToken: subscription.endpoint, // device token stored as endpoint
        title: notifTitle,
        body: notifBody,
        url: notifUrl,
        bundleId: apnsBundleId,
        keyId: apnsKeyId,
        teamId: apnsTeamId,
        privateKeyPem: apnsPrivateKey,
      });

      if (!result.success && result.gone) {
        console.log(`send-push-notification: APNs token expired for user ${userId}, removing`);
        await supabase.from("push_subscriptions").delete().eq("user_id", userId);

        return new Response(
          JSON.stringify({
            success: false,
            message: "Device token expired. Please re-enable notifications.",
            gone: true,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (!result.success) {
        console.error(`send-push-notification: APNs error for user ${userId}:`, result.error);
        return new Response(
          JSON.stringify({ success: false, error: result.error }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      console.log("send-push-notification: APNs notification delivered for user", userId);
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ── Web Push (VAPID) ──────────────────────────────────────────────────────
    if (!vapidPublicKey || !vapidPrivateKey) {
      throw new Error("VAPID keys not configured");
    }

    const payload = JSON.stringify({
      title: notifTitle,
      body: notifBody,
      url: notifUrl,
      dir: "rtl",
      lang: "he",
    });

    const exportedVapidKeys = toExportedVapidKeys(vapidPublicKey, vapidPrivateKey);
    const vapidKeys = await webpush.importVapidKeys(exportedVapidKeys, { extractable: false });

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
        `send-push-notification: Web Push for user ${userId}, endpoint: ${subscription.endpoint.substring(0, 60)}...`,
      );
      await subscriber.pushTextMessage(payload, {
        ttl: 60 * 60 * 24,
        urgency: webpush.Urgency.High,
      });

      console.log("send-push-notification: Web Push accepted by push service");
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (err: unknown) {
      if (err instanceof webpush.PushMessageError) {
        console.error(
          `send-push-notification: PushMessageError for user ${userId}:`,
          JSON.stringify({
            message: err.message,
            name: err.name,
            isGone: err.isGone(),
            endpoint: subscription.endpoint.substring(0, 60),
          }),
        );

        if (err.isGone()) {
          console.log(`send-push-notification: Subscription expired (410) for user ${userId}, removing`);
          await supabase.from("push_subscriptions").delete().eq("user_id", userId);

          return new Response(
            JSON.stringify({
              success: false,
              message: "Subscription expired. Please re-enable notifications.",
              gone: true,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
          );
        }

        return new Response(
          JSON.stringify({ success: false, error: err.toString() }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
