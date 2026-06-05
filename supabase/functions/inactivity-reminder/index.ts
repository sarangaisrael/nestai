import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EMAIL_HTML = `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width">
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Heebo',Arial,sans-serif;direction:rtl">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px">
<tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;max-width:520px">

  <tr>
    <td style="background:#0f172a;padding:20px 28px">
      <span style="font-size:16px;font-weight:700;color:#ffffff;letter-spacing:-0.3px">NestAI</span>
      <span style="display:inline-block;width:6px;height:6px;background:#6366f1;border-radius:50%;margin-right:6px;vertical-align:middle"></span>
    </td>
  </tr>

  <tr>
    <td style="padding:28px">
      <p style="font-size:13px;color:#94a3b8;margin:0 0 16px">נשלח אליך מ-NestAI.care</p>
      <p style="font-size:18px;font-weight:700;color:#0f172a;margin:0 0 20px;line-height:1.4">לא כתבת כבר כמה ימים</p>
      <p style="font-size:14px;color:#64748b;line-height:1.75;margin:0 0 20px">
        היי,<br><br>
        שמנו לב שלא כתבת כבר 3 ימים.<br>
        כתיבה קצרה של 2 דקות יכולה לעזור לך להפיק יותר מהתהליך הטיפולי שלך.
      </p>
      <p style="font-size:14px;color:#64748b;margin:0 0 24px;font-style:italic">מה עבר עליך לאחרונה?</p>
      <a href="https://www.nestai.care/app" style="display:inline-block;background:#6366f1;color:#ffffff;text-decoration:none;padding:11px 24px;border-radius:20px;font-size:14px;font-weight:700">
        כותבים עכשיו
      </a>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;border-top:1px solid #e2e8f0;padding-top:20px">
        <tr><td style="padding-top:20px">
          <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6">
            קיבלת מייל זה כי נרשמת ל-NestAI.care.<br>
            <a href="https://www.nestai.care/settings" style="color:#94a3b8">להסרה מרשימת התזכורות</a>
          </p>
        </td></tr>
      </table>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate cron secret
  const cronSecret = req.headers.get("x-cron-secret");
  const expectedSecret = Deno.env.get("CRON_SECRET");
  if (!expectedSecret || cronSecret !== expectedSecret) {
    console.error("inactivity-reminder: Unauthorized");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY            = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL                = Deno.env.get("FROM_EMAIL") || "NestAI <noreply@nestai.care>";

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Threshold: users who have not written in the last 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Fetch all auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    console.log(`inactivity-reminder: Checking ${users.length} users`);

    let sentCount = 0;
    let skippedCount = 0;

    for (const user of users) {
      if (!user.email) {
        skippedCount++;
        continue;
      }

      try {
        // Check whether the user has written anything in the last 3 days
        const { data: recentMessages, error: msgError } = await supabase
          .from("messages")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "user")
          .eq("is_system", false)
          .gte("created_at", threeDaysAgo.toISOString())
          .limit(1);

        if (msgError) {
          console.error(`inactivity-reminder: Error checking messages for ${user.id}:`, msgError);
          skippedCount++;
          continue;
        }

        // User has written recently — skip
        if (recentMessages && recentMessages.length > 0) {
          skippedCount++;
          continue;
        }

        // Send the inactivity email via Resend
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [user.email],
            subject: "לא כתבת כבר כמה ימים 💙",
            html: EMAIL_HTML,
          }),
        });

        if (!resendRes.ok) {
          const errText = await resendRes.text();
          console.error(`inactivity-reminder: Resend error for ${user.email}:`, errText);
          skippedCount++;
          continue;
        }

        console.log(`inactivity-reminder: Email sent to ${user.email}`);
        sentCount++;
      } catch (userErr) {
        console.error(`inactivity-reminder: Error processing user ${user.id}:`, userErr);
        skippedCount++;
      }
    }

    console.log(`inactivity-reminder: Done. Sent: ${sentCount}, Skipped: ${skippedCount}`);

    return new Response(
      JSON.stringify({ success: true, sent: sentCount, skipped: skippedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("inactivity-reminder: Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
