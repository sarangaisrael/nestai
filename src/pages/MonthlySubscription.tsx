import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

declare global {
  interface Window { paypal?: any; }
}

const PAYPAL_CLIENT_ID =
  "AYPIOgfAoOsn_ShD4LWxQGfGH7Wn27xWdoXprCVylSwVW_9tVVRPK2NwTUHA9EvkQwzMTLkXNlz4etIY";
const PLAN_ID = "P-6BL08142MG162312XNI34GXA";
const CONTAINER_ID = `paypal-button-container-${PLAN_ID}`;

const FEATURES = [
  { icon: "🧠", text: "סיכומים שבועיים חכמים מבוססי AI" },
  { icon: "📊", text: "ניתוח מגמות ודפוסים חודשי" },
  { icon: "🔒", text: "הצפנה מלאה — רק אתה/את קורא/ת" },
  { icon: "💬", text: "שיחה חופשית עם NestAI ללא הגבלה" },
  { icon: "🌙", text: "מעקב שינה ומצב רוח" },
  { icon: "✨", text: "כלי מדיטציה ורפלקציה" },
];

export default function MonthlySubscription() {
  const btnRef      = useRef<HTMLDivElement>(null);
  const rendered    = useRef(false);
  const scriptRef   = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    if (scriptRef.current) return;

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&vault=true&intent=subscription`;
    script.setAttribute("data-sdk-integration-source", "button-factory");
    script.async = true;

    script.onload = () => {
      if (rendered.current || !btnRef.current || !window.paypal) return;
      rendered.current = true;

      window.paypal.Buttons({
        style: {
          shape: "rect",
          color: "gold",
          layout: "vertical",
          label: "subscribe",
          height: 50,
        },
        createSubscription: (_data: any, actions: any) =>
          actions.subscription.create({ plan_id: PLAN_ID }),
        onApprove: (_data: any) => {
          window.location.href = "/app/dashboard";
        },
      }).render(`#${CONTAINER_ID}`);
    };

    document.head.appendChild(script);
    scriptRef.current = script;

    return () => {
      if (scriptRef.current) {
        document.head.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, []);

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100dvh",
        background: "linear-gradient(160deg, #f8faff 0%, #eef2ff 100%)",
        fontFamily: "'Heebo', sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Nav */}
      <nav style={{
        width: "100%", maxWidth: 680,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 28px", boxSizing: "border-box",
      }}>
        <span style={{ fontFamily: "'Righteous', sans-serif", fontSize: 22, color: "#0f172a" }}>
          Nest<span style={{ color: "#6366f1" }}>AI</span>
        </span>
        <a
          href="/app/dashboard"
          style={{
            fontSize: 13, color: "#64748b", textDecoration: "none",
            display: "flex", alignItems: "center", gap: 4,
          }}
        >
          ← חזרה לאפליקציה
        </a>
      </nav>

      {/* Content */}
      <div style={{
        width: "100%", maxWidth: 520,
        padding: "0 24px 60px",
        boxSizing: "border-box",
      }}>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          style={{ textAlign: "center", marginBottom: 36 }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 72, height: 72, borderRadius: 20,
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            marginBottom: 20, fontSize: 30,
          }}>
            🌿
          </div>

          <h1 style={{
            fontSize: 28, fontWeight: 900, color: "#0f172a",
            margin: "0 0 12px", lineHeight: 1.25, letterSpacing: "-0.5px",
          }}>
            NestAI Pro — מנוי חודשי
          </h1>

          <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, margin: 0 }}>
            גישה מלאה לכל כלי היומן הרגשי, הסיכומים, וניתוח המגמות.
            <br />בלי הגבלות. בלי פשרות.
          </p>
        </motion.div>

        {/* Price */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{
            background: "#ffffff", borderRadius: 20,
            border: "1.5px solid #e2e8f0",
            padding: "24px 28px",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4, marginBottom: 4 }}>
            <span style={{ fontSize: 44, fontWeight: 900, color: "#0f172a", letterSpacing: "-1px" }}>₪39</span>
            <span style={{ fontSize: 15, color: "#94a3b8", fontWeight: 500 }}>/ חודש</span>
          </div>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>ביטול בכל עת • ללא התחייבות</p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          style={{
            background: "#ffffff", borderRadius: 20,
            border: "0.5px solid #e2e8f0",
            padding: "20px 24px",
            marginBottom: 24,
            display: "flex", flexDirection: "column", gap: 14,
          }}
        >
          {FEATURES.map(({ icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, flexShrink: 0, width: 28, textAlign: "center" }}>{icon}</span>
              <span style={{ fontSize: 13, color: "#374151", fontWeight: 500 }}>{text}</span>
              <span style={{ marginRight: "auto", color: "#6366f1", fontSize: 14, fontWeight: 700 }}>✓</span>
            </div>
          ))}
        </motion.div>

        {/* PayPal button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{
            background: "#ffffff", borderRadius: 20,
            border: "1.5px solid #e2e8f0",
            padding: "24px 24px 20px",
            marginBottom: 16,
          }}
        >
          <p style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", margin: "0 0 16px", textAlign: "center" }}>
            התחל/י את המנוי
          </p>
          <div id={CONTAINER_ID} ref={btnRef} />
        </motion.div>

        {/* Trust */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, color: "#94a3b8", fontSize: 11,
        }}>
          <span>🔒</span>
          <span>תשלום מאובטח דרך PayPal • הנתונים שלך מוצפנים ופרטיים</span>
        </div>
      </div>
    </div>
  );
}
