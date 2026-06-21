import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

declare global {
  interface Window { paypal?: any; }
}

const PAYPAL_CLIENT_ID =
  "AYPIOgfAoOsn_ShD4LWxQGfGH7Wn27xWdoXprCVylSwVW_9tVVRPK2NwTUHA9EvkQwzMTLkXNlz4etIY";
const PLAN_ID = "P-6BL08142MG162312XNI34GXA";
const CONTAINER_ID = `paypal-button-container-${PLAN_ID}`;

const freeUntilDate = (): string => {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
};

const FEATURES = [
  { icon: "✅", text: "גישה מלאה לכל הפיצ'רים" },
  { icon: "📝", text: "תיעוד יומי ללא הגבלה" },
  { icon: "📋", text: "סיכום שבועי אוטומטי" },
  { icon: "📊", text: "מעקב מגמות רגשיות" },
  { icon: "💬", text: "צ'אט AI בין הפגישות" },
];

export default function MonthlySubscription() {
  const btnRef    = useRef<HTMLDivElement>(null);
  const rendered  = useRef(false);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const [paid, setPaid] = useState(false);

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
        onApprove: () => {
          window.location.href = "/register?payment=success";
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
            <span style={{ fontSize: 44, fontWeight: 900, color: "#0f172a", letterSpacing: "-1px" }}>₪29</span>
            <span style={{ fontSize: 15, color: "#94a3b8", fontWeight: 500 }}>/ חודש</span>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "#f0fdf4", border: "1.5px solid #86efac",
            borderRadius: 50, padding: "5px 14px", margin: "10px auto 6px",
          }}>
            <span style={{ fontSize: 13 }}>🎁</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
              14 יום חינם
            </span>
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
            </div>
          ))}
        </motion.div>

        {/* PayPal button / Success message */}
        <AnimatePresence mode="wait">
          {paid ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35 }}
              style={{
                background: "linear-gradient(135deg, #16a34a, #15803d)",
                borderRadius: 20,
                padding: "32px 28px",
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <p style={{
                fontSize: 18, fontWeight: 800, color: "#ffffff",
                margin: "0 0 10px", lineHeight: 1.4,
              }}>
                התשלום התקבל!
              </p>
              <p style={{
                fontSize: 14, color: "rgba(255,255,255,0.85)",
                margin: "0 0 24px", lineHeight: 1.6,
              }}>
                המנוי שלך יופעל בשעות הקרובות 🎉
              </p>
              <a
                href="/app/dashboard"
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.2)",
                  border: "1.5px solid rgba(255,255,255,0.4)",
                  borderRadius: 12, padding: "10px 24px",
                  fontSize: 14, fontWeight: 700, color: "#ffffff",
                  textDecoration: "none",
                }}
              >
                חזרה לאפליקציה ←
              </a>
            </motion.div>
          ) : (
            <motion.div
              key="paypal"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
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
          )}
        </AnimatePresence>

        {/* Trust */}
        {!paid && (
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 6, color: "#94a3b8", fontSize: 11,
          }}>
            <span>🔒</span>
            <span>תשלום מאובטח דרך PayPal • הנתונים שלך מוצפנים ופרטיים</span>
          </div>
        )}
      </div>
    </div>
  );
}
