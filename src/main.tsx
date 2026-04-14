import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker, isNativeApp, registerNotificationListeners, registerForApnsPush, scheduleAllNotifications } from "./lib/pushNotifications";

// Register service worker for PWA (not needed in native app)
if (!isNativeApp() && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    registerServiceWorker();
  });
}

// Register notification tap listeners for native app
if (isNativeApp()) {
  registerNotificationListeners();
  // Register for APNs remote push (iOS) — saves device token to Supabase
  registerForApnsPush();
  // Schedule local notifications (daily reminder + weekly/monthly summaries)
  scheduleAllNotifications();
}

createRoot(document.getElementById("root")!).render(<App />);
