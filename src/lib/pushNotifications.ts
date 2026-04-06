import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

// ──── Platform detection ────
export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

export const isNotificationsSupported = (): boolean => {
  if (isNativeApp()) return true;
  return "Notification" in window;
};

// ──── Permission handling ────
export const getNotificationPermission = async (): Promise<"granted" | "denied" | "prompt"> => {
  if (isNativeApp()) {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === "granted") return "granted";
    if (display === "denied") return "denied";
    return "prompt";
  }
  if (!("Notification" in window)) return "denied";
  return Notification.permission as "granted" | "denied" | "prompt";
};

export const requestNotificationPermission = async (): Promise<"granted" | "denied"> => {
  if (isNativeApp()) {
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted" ? "granted" : "denied";
  }
  if (!("Notification" in window)) return "denied";
  const result = await Notification.requestPermission();
  return result === "granted" ? "granted" : "denied";
};

// ──── Notification IDs ────
const DAILY_REMINDER_ID = 1001;
const WEEKLY_SUMMARY_ID = 1002;
const MONTHLY_SUMMARY_ID = 1003;
const MANAGED_NOTIFICATION_IDS = [
  DAILY_REMINDER_ID,
  WEEKLY_SUMMARY_ID,
  MONTHLY_SUMMARY_ID,
];

// ──── Cancel helpers ────

export const cancelAllScheduledNotifications = async (): Promise<void> => {
  if (!isNativeApp()) return;
  try {
    const pending = await LocalNotifications.getPending();
    const notificationsToCancel = [
      ...pending.notifications.map(({ id }) => ({ id })),
      ...MANAGED_NOTIFICATION_IDS.map((id) => ({ id })),
    ].filter(
      (notification, index, notifications) =>
        notifications.findIndex(({ id }) => id === notification.id) === index
    );

    if (notificationsToCancel.length > 0) {
      await LocalNotifications.cancel({ notifications: notificationsToCancel });
    }

    await LocalNotifications.removeAllDeliveredNotifications();
  } catch {
    // Ignore if not found
  }
};

export const cancelDailyReminder = async (): Promise<void> => {
  if (!isNativeApp()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: DAILY_REMINDER_ID }] });
  } catch {
    // Ignore
  }
};

// ──── Scheduling ────

/** Schedule the daily 20:00 reminder (repeats every day) */
export const scheduleDailyReminder = async (): Promise<void> => {
  if (!isNativeApp()) return;

  await cancelDailyReminder();

  const now = new Date();
  let trigger = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: DAILY_REMINDER_ID,
        title: "NestAI",
        body: "איך היה לך היום? זמן לכתוב ב-NestAI",
        schedule: {
          at: trigger,
          repeats: true,
          every: "day",
        },
        sound: "default",
        actionTypeId: "DAILY_REMINDER",
        extra: { url: "/app/dashboard?from=daily-reminder" },
      },
    ],
  });
  console.log("Local notification: Daily reminder scheduled for 20:00");
};

// ──── Day mapping ────
const DAY_MAP: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

/** Parse "HH:MM" string into hours and minutes */
const parseTime = (time: string): { hours: number; minutes: number } => {
  const [h, m] = time.split(":").map(Number);
  return { hours: h || 0, minutes: m || 0 };
};

/**
 * Schedule weekly summary notification based on user preferences.
 * @param summaryDay - e.g. "saturday", "sunday"
 * @param summaryTime - e.g. "20:00"
 */
export const scheduleWeeklySummaryNotification = async (
  summaryDay: string = "saturday",
  summaryTime: string = "20:00"
): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: WEEKLY_SUMMARY_ID }] });
  } catch {
    // Ignore
  }

  const targetDayNum = DAY_MAP[summaryDay.toLowerCase()] ?? 6; // default Saturday
  const { hours, minutes } = parseTime(summaryTime);

  const now = new Date();
  let trigger = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  const currentDay = now.getDay();
  let daysUntil = (targetDayNum - currentDay + 7) % 7;
  if (daysUntil === 0 && trigger <= now) daysUntil = 7;
  trigger.setDate(trigger.getDate() + daysUntil);

  await LocalNotifications.schedule({
    notifications: [
      {
        id: WEEKLY_SUMMARY_ID,
        title: "NestAI",
        body: "הסיכום השבועי מחכה לך 📊",
        schedule: {
          at: trigger,
          repeats: true,
          every: "week",
        },
        sound: "default",
        actionTypeId: "WEEKLY_SUMMARY",
        extra: { url: "/app/summary" },
      },
    ],
  });
  console.log(`Local notification: Weekly summary scheduled for ${summaryDay} ${summaryTime}`);
};

/**
 * Schedule monthly summary notification — same day-of-week & time as weekly,
 * but on the 1st occurrence of that day each month.
 * @param summaryTime - e.g. "20:00"
 */
export const scheduleMonthlySummaryNotification = async (
  summaryTime: string = "20:00"
): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: MONTHLY_SUMMARY_ID }] });
  } catch {
    // Ignore
  }

  const { hours, minutes } = parseTime(summaryTime);

  // Schedule for the 1st of next applicable month at the user's chosen time
  const now = new Date();
  let trigger = new Date(now.getFullYear(), now.getMonth(), 1, hours, minutes, 0);
  if (trigger <= now) {
    trigger = new Date(now.getFullYear(), now.getMonth() + 1, 1, hours, minutes, 0);
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: MONTHLY_SUMMARY_ID,
        title: "NestAI",
        body: "הסיכום החודשי מחכה לך 📅",
        schedule: {
          at: trigger,
          repeats: true,
          every: "month",
        },
        sound: "default",
        actionTypeId: "MONTHLY_SUMMARY",
        extra: { url: "/app/monthly-summary" },
      },
    ],
  });
  console.log(`Local notification: Monthly summary scheduled for 1st at ${summaryTime}`);
};

/**
 * Schedule all notifications at once.
 * @param summaryDay - user's preferred summary day (e.g. "saturday")
 * @param summaryTime - user's preferred summary time (e.g. "20:00")
 */
export const scheduleAllNotifications = async (
  summaryDay: string = "saturday",
  summaryTime: string = "20:00"
): Promise<void> => {
  await cancelAllScheduledNotifications();
  await scheduleDailyReminder();
  await scheduleWeeklySummaryNotification(summaryDay, summaryTime);
  await scheduleMonthlySummaryNotification(summaryTime);
};

/** Fire an immediate local notification */
export const sendLocalNotification = async (
  title: string,
  body: string,
  extra?: Record<string, string>
): Promise<void> => {
  if (!isNativeApp()) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    }
    return;
  }

  await LocalNotifications.schedule({
    notifications: [
      {
        id: Date.now() % 100000,
        title,
        body,
        sound: "default",
        extra,
      },
    ],
  });
};

/** Register a listener to handle notification taps (deep-link) */
export const registerNotificationListeners = (): void => {
  if (!isNativeApp()) return;

  LocalNotifications.addListener("localNotificationActionPerformed", (notification) => {
    const url = notification.notification.extra?.url;
    if (url && typeof url === "string") {
      window.location.href = url;
    }
  });
};

// ──── Service Worker (keep for PWA) ────

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!("serviceWorker" in navigator)) return null;
  if (isNativeApp()) return null;

  try {
    if (typeof window !== "undefined" && !sessionStorage.getItem("sw_reloaded")) {
      let reloading = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading) return;
        reloading = true;
        sessionStorage.setItem("sw_reloaded", "1");
        window.location.reload();
      });
    }

    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });

    registration.update().catch(() => undefined);

    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          worker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });

    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
};
