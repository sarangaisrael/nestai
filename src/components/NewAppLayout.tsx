import { useEffect, type ReactNode } from "react";
import BottomNav from "./BottomNav";
import { rescheduleNotificationsFromSettings } from "@/lib/pushNotifications";

interface Props {
  children: ReactNode;
}

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
      <div style={{ paddingBottom: "calc(58px + env(safe-area-inset-bottom, 0px))" }}>
        {children}
      </div>
      <BottomNav />
    </div>
  );
};

export default NewAppLayout;
