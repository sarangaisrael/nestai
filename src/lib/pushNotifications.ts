import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";

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
const DAILY_REMINDER_ID   = 1001; // legacy single-ID, cancelled when rescheduling
const WEEKLY_SUMMARY_ID   = 1002;
const MONTHLY_SUMMARY_ID  = 1003;
const SLEEP_REMINDER_ID   = 1004;
// 7 weekly-repeating IDs, one per weekday (Sun=1010 … Sat=1016)
const DAILY_QUESTION_IDS  = [1010, 1011, 1012, 1013, 1014, 1015, 1016];
const MANAGED_NOTIFICATION_IDS = [
  DAILY_REMINDER_ID,
  WEEKLY_SUMMARY_ID,
  MONTHLY_SUMMARY_ID,
  SLEEP_REMINDER_ID,
  ...DAILY_QUESTION_IDS,
];

// ──── Daily questions (index 0 = Sunday … 6 = Saturday) ────
const DAILY_QUESTIONS = [
  "מה הרגע אחד שגרם לך להרגיש שהיום היה שווה?",  // ראשון
  "מה דבר אחד שהפתיע אותך היום?",                  // שני
  "מה אתה גאה בו מהיום?",                          // שלישי
  "מה למדת על עצמך היום?",                          // רביעי
  "מה הדבר שנתת לעצמך היום?",                       // חמישי
  "מה היה הרגע הכי שקט שלך השבוע?",                 // שישי
  "מה אתה רוצה לקחת איתך לשבוע הבא?",              // שבת
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

/**
 * Schedule 7 weekly-repeating local notifications — one per day of week,
 * each with a different reflective question.
 *
 * Uses `schedule.on { weekday, hour, minute }` so the time is interpreted in
 * the device's LOCAL timezone (correct for Israel-timezone devices).
 * Cancel-then-reschedule is safe to call any time preferences change.
 *
 * @param time - "HH:MM" string, default "21:00"
 */
export const scheduleDailyReminder = async (time: string = "21:00"): Promise<void> => {
  if (!isNativeApp()) return;

  console.log(`[Notifications] scheduleDailyReminder called with time="${time}"`);

  // Cancel legacy single ID + all 7 per-day IDs
  const toCancel = [{ id: DAILY_REMINDER_ID }, ...DAILY_QUESTION_IDS.map(id => ({ id }))];
  try { await LocalNotifications.cancel({ notifications: toCancel }); } catch { /* ignore */ }

  const { hours, minutes } = parseTime(time);
  console.log(`[Notifications] scheduleDailyReminder parsed → hour=${hours}, minute=${minutes}`);

  // weekday in Capacitor: 1 = Sunday, 2 = Monday, …, 7 = Saturday
  await LocalNotifications.schedule({
    notifications: DAILY_QUESTIONS.map((question, i) => ({
      id: DAILY_QUESTION_IDS[i],
      title: "הגיע הזמן שלך 🌙",
      body: "רגע של דקה לעצמך. איך עבר היום?",
      schedule: {
        on: { weekday: i + 1, hour: hours, minute: minutes },
        repeats: true,
      },
      sound: "default",
      actionTypeId: "DAILY_REMINDER",
      extra: { url: `/app/chat?q=${encodeURIComponent(question)}` },
    })),
  });

  // Verify what's actually registered with the OS
  const pending = await LocalNotifications.getPending();
  const myIds = new Set(DAILY_QUESTION_IDS);
  const registered = pending.notifications.filter(n => myIds.has(n.id));
  console.log(`[Notifications] scheduleDailyReminder done — ${registered.length}/7 notifications registered with OS at ${hours}:${String(minutes).padStart(2, "0")}`);
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
 * Schedule all notifications at once using user preferences.
 * Safe to call any time preferences change — each helper cancels its own IDs first.
 *
 * @param summaryDay        - weekly summary day, e.g. "saturday"
 * @param summaryTime       - weekly summary time, e.g. "20:00"
 * @param dailyReminderTime - daily question time, e.g. "21:00"
 */
/**
 * Schedule a daily sleep-log reminder at the given time every morning.
 * Tapping it navigates to the dashboard where the SleepCard is shown.
 * @param time - "HH:MM" string, default "07:30"
 */
export const scheduleSleepReminder = async (time: string = "07:30"): Promise<void> => {
  if (!isNativeApp()) return;

  try {
    await LocalNotifications.cancel({ notifications: [{ id: SLEEP_REMINDER_ID }] });
  } catch { /* ignore */ }

  const { hours, minutes } = parseTime(time);
  const now = new Date();
  const trigger = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
  if (trigger <= now) trigger.setDate(trigger.getDate() + 1);

  await LocalNotifications.schedule({
    notifications: [{
      id: SLEEP_REMINDER_ID,
      title: "בוקר טוב ☀️",
      body: "איך ישנת?",
      schedule: { at: trigger, repeats: true, every: "day" },
      sound: "default",
      actionTypeId: "SLEEP_REMINDER",
      extra: { url: "/app/dashboard" },
    }],
  });

  const pending = await LocalNotifications.getPending();
  const registered = pending.notifications.some(n => n.id === SLEEP_REMINDER_ID);
  console.log(`[Notifications] scheduleSleepReminder done — registered=${registered}, first trigger=${trigger.toISOString()}`);
};

export const cancelSleepReminder = async (): Promise<void> => {
  if (!isNativeApp()) return;
  try {
    await LocalNotifications.cancel({ notifications: [{ id: SLEEP_REMINDER_ID }] });
  } catch { /* ignore */ }
};

/**
 * Re-schedule all notifications from the user's stored settings in user_settings.
 * Call once per app session (e.g. on app open) to restore notifications after
 * reinstall, OS reset, or permission revoke.
 */
export const rescheduleNotificationsFromSettings = async (): Promise<void> => {
  if (!isNativeApp()) return;

  console.log("[Notifications] rescheduleNotificationsFromSettings: starting");

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.log("[Notifications] rescheduleNotificationsFromSettings: no session, skipping");
    return;
  }

  const { data: settings, error } = await supabase
    .from("user_settings")
    .select("checkin_time, sleep_reminder_time, sleep_reminder_enabled")
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (error) {
    console.warn("[Notifications] rescheduleNotificationsFromSettings: DB error", error.message);
    return;
  }

  const checkinTime  = settings?.checkin_time          ?? "20:00";
  const sleepTime    = settings?.sleep_reminder_time   ?? "08:00";
  const sleepEnabled = settings?.sleep_reminder_enabled ?? true;

  console.log(`[Notifications] rescheduleNotificationsFromSettings: checkin_time=${checkinTime}, sleep_time=${sleepTime}, sleep_enabled=${sleepEnabled}`);

  await scheduleAllNotifications("saturday", "20:00", checkinTime, sleepEnabled, sleepTime);

  console.log("[Notifications] rescheduleNotificationsFromSettings: complete");
};

export const scheduleAllNotifications = async (
  summaryDay: string         = "saturday",
  summaryTime: string        = "20:00",
  dailyReminderTime: string  = "21:00",
  sleepReminderEnabled: boolean = true,
  sleepReminderTime: string  = "07:30"
): Promise<void> => {
  console.log(`[Notifications] scheduleAllNotifications: dailyReminderTime=${dailyReminderTime}, sleepReminderEnabled=${sleepReminderEnabled}, sleepReminderTime=${sleepReminderTime}`);
  await scheduleDailyReminder(dailyReminderTime);
  await scheduleWeeklySummaryNotification(summaryDay, summaryTime);
  await scheduleMonthlySummaryNotification(summaryTime);
  if (sleepReminderEnabled) {
    await scheduleSleepReminder(sleepReminderTime);
  } else {
    await cancelSleepReminder();
  }
  console.log("[Notifications] scheduleAllNotifications: all done");
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

// ──── APNs / Remote Push Registration (iOS native) ────

/**
 * Register for remote push notifications via APNs (iOS only).
 * Requests permission, gets the device token, and saves it to
 * the push_subscriptions table with platform: 'ios'.
 * Safe to call on non-iOS platforms — exits immediately.
 */
export const registerForApnsPush = async (): Promise<void> => {
  if (!isNativeApp()) return;
  if (Capacitor.getPlatform() !== "ios") return;

  try {
    // 1. Check / request permission
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === "prompt") {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive !== "granted") {
      console.log("registerForApnsPush: permission not granted, skipping");
      return;
    }

    // 2. Register with APNs — the token arrives via the 'registration' event
    await PushNotifications.register();

    // 3. Listen for the device token once
    PushNotifications.addListener("registration", async (token) => {
      console.log("registerForApnsPush: received device token", token.value.substring(0, 12) + "...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("registerForApnsPush: no authenticated user, skipping token save");
        return;
      }

      // Upsert so re-installs or token rotations are handled cleanly
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: user.id,
            endpoint: token.value,   // device token stored as endpoint
            platform: "ios",
            p256dh: null,
            auth: null,
          },
          { onConflict: "user_id" },
        );

      if (error) {
        console.error("registerForApnsPush: failed to save token", error);
      } else {
        console.log("registerForApnsPush: device token saved for user", user.id);
      }
    });

    // 4. Log registration errors
    PushNotifications.addListener("registrationError", (err) => {
      console.error("registerForApnsPush: registration error", err.error);
    });
  } catch (err) {
    console.error("registerForApnsPush: unexpected error", err);
  }
};

/** Register a listener to handle notification taps (deep-link) */
export const registerNotificationListeners = (): void => {
  if (!isNativeApp()) return;

  // Local notifications (daily questions, scheduled reminders)
  LocalNotifications.addListener("localNotificationActionPerformed", (notification) => {
    const url = notification.notification.extra?.url;
    if (url && typeof url === "string") {
      window.location.href = url;
    }
  });

  // Remote push notifications tapped while app is in background/closed (APNs)
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = (action.notification.data as Record<string, string>)?.url;
    if (url && typeof url === "string") {
      window.location.href = url;
    }
  });

  // Remote push arrives while app is in foreground — show as local notification
  PushNotifications.addListener("pushNotificationReceived", async (notification) => {
    const url = (notification.data as Record<string, string>)?.url;
    const title = notification.title ?? "NestAI";
    const body  = notification.body  ?? "";
    await LocalNotifications.schedule({
      notifications: [{
        id: Date.now() % 100000,
        title,
        body,
        sound: "default",
        extra: url ? { url } : undefined,
      }],
    });
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
