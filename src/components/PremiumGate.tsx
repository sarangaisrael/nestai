import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const PremiumGate = ({ children }: Props) => {
  const navigate = useNavigate();
  const { isActive, loading } = useSubscription();

  if (loading) return null;

  if (!isActive) {
    return (
      <div dir="rtl" style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "'Heebo', sans-serif", display: "flex", flexDirection: "column" }}>
        {/* Banner */}
        <div style={{
          background: "linear-gradient(135deg, #6366f1, #818cf8)",
          padding: "calc(env(safe-area-inset-top,0px) + 20px) 20px 24px",
          textAlign: "center",
        }}>
          <p style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 900, color: "#fff" }}>💬 שיחה רגשית עם AI</p>
          <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.85)" }}>צ'אט אישי מבוסס על כל הנתונים שלך</p>
        </div>

        {/* Lock screen */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "32px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🔒</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#0f172a", margin: "0 0 10px" }}>פיצ'ר Premium</h2>
          <p style={{ fontSize: 15, color: "#64748b", margin: "0 0 32px", lineHeight: 1.6, maxWidth: 300 }}>
            הצ'אט זמין למנויים בלבד. שדרג עכשיו לקבל גישה לשיחה רגשית אישית עם AI שמכיר אותך.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 320 }}>
            <button onClick={() => navigate("/month")} style={{
              padding: "14px", borderRadius: 14, border: "none",
              background: "#6366f1", color: "#fff",
              fontSize: 16, fontWeight: 700, cursor: "pointer", fontFamily: "'Heebo', sans-serif",
            }}>
              שדרג ל-Premium ✨
            </button>
            <button onClick={() => navigate("/app/dashboard")} style={{
              padding: "12px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#fff",
              color: "#64748b", fontSize: 14, cursor: "pointer", fontFamily: "'Heebo', sans-serif",
            }}>
              חזור לדף הבית
            </button>
          </div>

          {/* Features list */}
          <div style={{ marginTop: 32, background: "#fff", borderRadius: 16, border: "0.5px solid #e2e8f0", padding: "18px 20px", width: "100%", maxWidth: 320 }}>
            <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700, color: "#0f172a" }}>מה כלול ב-Premium:</p>
            {[
              "💬 צ'אט רגשי עם AI ללא הגבלה",
              "📋 סיכום שבועי ומגמות מתקדמות",
              "🧠 תובנות אישיות מבוססות נתונים",
              "🔔 התראות חכמות מותאמות אישית",
            ].map(f => (
              <p key={f} style={{ margin: "0 0 8px", fontSize: 13, color: "#374151", display: "flex", alignItems: "center", gap: 6 }}>
                {f}
              </p>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PremiumGate;
