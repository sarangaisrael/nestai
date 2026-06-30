import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "./BottomNav";
import { rescheduleNotificationsFromSettings } from "@/lib/pushNotifications";
import { useSubscription } from "@/hooks/useSubscription";

interface Props {
  children: ReactNode;
}

const TrialBanner = () => {
  const navigate = useNavigate();
  const { plan, daysLeft, isExpired, loading } = useSubscription();

  if (loading) return null;
  if (plan === "monthly" || plan === "yearly") return null;

  if (isExpired) {
    return (
      <div style={{
        background: "#fef2f2", borderBottom: "1px solid #fecaca",
        padding: "10px 16px", textAlign: "center", fontFamily: "'Heebo', sans-serif",
      }}>
        <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 700 }}>
          תקופת הניסיון הסתיימה.{" "}
        </span>
        <button
          onClick={() => navigate("/month")}
          style={{
            background: "none", border: "none", padding: 0,
            fontSize: 13, fontWeight: 700, color: "#6366f1",
            cursor: "pointer", textDecoration: "underline", fontFamily: "'Heebo', sans-serif",
          }}
        >
          עברו ל-Premium ✨
        </button>
      </div>
    );
  }

  if (plan === "trial") {
    const urgent = daysLeft <= 2;
    return (
      <div style={{
        background: urgent ? "#fffbeb" : "#f0fdf4",
        borderBottom: `1px solid ${urgent ? "#fde68a" : "#bbf7d0"}`,
        padding: "8px 16px", textAlign: "center", fontFamily: "'Heebo', sans-serif",
      }}>
        <span style={{ fontSize: 13, color: urgent ? "#92400e" : "#15803d", fontWeight: 600 }}>
          {daysLeft === 0
            ? "היום הוא היום האחרון של הניסיון החינמי"
            : `נותרו ${daysLeft} ימים בניסיון החינמי`}
          {" · "}
        </span>
        <button
          onClick={() => navigate("/month")}
          style={{
            background: "none", border: "none", padding: 0,
            fontSize: 13, fontWeight: 700, color: "#6366f1",
            cursor: "pointer", textDecoration: "underline", fontFamily: "'Heebo', sans-serif",
          }}
        >
          שדרג עכשיו
        </button>
      </div>
    );
  }

  return null;
};

const NewAppLayout = ({ children }: Props) => {
  useEffect(() => {
    // Restore notifications once per app session in case iOS reset them
    if (sessionStorage.getItem("notifs_init")) return;
    sessionStorage.setItem("notifs_init", "1");
    console.log("[Notifications] NewAppLayout: triggering reschedule on app open");
    rescheduleNotificationsFromSettings();
  }, []);

  return (
    <div dir="rtl" style={{ minHeight: "100dvh", background: "#f8fafc", fontFamily: "'Heebo', sans-serif" }}>
      <TrialBanner />
      <div style={{ paddingBottom: "calc(58px + env(safe-area-inset-bottom, 0px))" }}>
        {children}
      </div>
      <BottomNav />
    </div>
  );
};

export default NewAppLayout;
