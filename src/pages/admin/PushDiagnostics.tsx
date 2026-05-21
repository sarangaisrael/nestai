import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStatus } from "@/hooks/useAdminStatus";

interface DiagnosticStep {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message: string;
  details?: string;
}

const PushDiagnostics = () => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const [userId, setUserId] = useState<string | null>(null);
  const [steps, setSteps] = useState<DiagnosticStep[]>([
    { name: "תמיכת דפדפן", status: "pending", message: "בודק..." },
    { name: "הרשאת התראות", status: "pending", message: "בודק..." },
    { name: "Service Worker", status: "pending", message: "בודק..." },
    { name: "VAPID Key", status: "pending", message: "בודק..." },
    { name: "Push Subscription", status: "pending", message: "בודק..." },
    { name: "שמירה בדאטהבייס", status: "pending", message: "בודק..." },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/app/auth");
      return;
    }
    setUserId(session.user.id);
  };

  const updateStep = (index: number, update: Partial<DiagnosticStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...update } : step
    ));
  };

  const runDiagnostics = async () => {
    if (!userId) return;
    
    setIsRunning(true);
    
    // Reset all steps
    setSteps(prev => prev.map(step => ({ ...step, status: "pending", message: "בודק...", details: undefined })));

    // Step 1: Browser support
    updateStep(0, { status: "running" });
    await new Promise(r => setTimeout(r, 300));
    
    const hasServiceWorker = "serviceWorker" in navigator;
    const hasPushManager = "PushManager" in window;
    const hasNotification = "Notification" in window;
    
    if (hasServiceWorker && hasPushManager && hasNotification) {
      updateStep(0, { 
        status: "success", 
        message: "הדפדפן תומך בהתראות",
        details: `ServiceWorker: ✓ | PushManager: ✓ | Notification: ✓`
      });
    } else {
      updateStep(0, { 
        status: "error", 
        message: "הדפדפן לא תומך בכל הפיצ'רים הנדרשים",
        details: `ServiceWorker: ${hasServiceWorker ? "✓" : "✗"} | PushManager: ${hasPushManager ? "✓" : "✗"} | Notification: ${hasNotification ? "✓" : "✗"}`
      });
      setIsRunning(false);
      return;
    }

    // Step 2: Notification permission
    updateStep(1, { status: "running" });
    await new Promise(r => setTimeout(r, 300));
    
    const permission = Notification.permission;
    if (permission === "granted") {
      updateStep(1, { status: "success", message: "הרשאה אושרה", details: `Permission: ${permission}` });
    } else if (permission === "denied") {
      updateStep(1, { status: "error", message: "הרשאה נדחתה - יש לאפשר בהגדרות הדפדפן", details: `Permission: ${permission}` });
      setIsRunning(false);
      return;
    } else {
      updateStep(1, { status: "error", message: "הרשאה לא נתבקשה עדיין", details: `Permission: ${permission}` });
    }

    // Step 3: Service Worker registration
    updateStep(2, { status: "running" });
    await new Promise(r => setTimeout(r, 300));
    
    let registration: ServiceWorkerRegistration | null = null;
    try {
      registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      await navigator.serviceWorker.ready;
      updateStep(2, { 
        status: "success", 
        message: "Service Worker רשום ופעיל",
        details: `Scope: ${registration.scope} | State: ${registration.active?.state || "unknown"}`
      });
    } catch (error: any) {
      updateStep(2, { status: "error", message: "נכשל ברישום Service Worker", details: error.message });
      setIsRunning(false);
      return;
    }

    // Step 4: VAPID Key
    updateStep(3, { status: "running" });
    await new Promise(r => setTimeout(r, 300));
    
    let vapidKey: string | null = null;
    try {
      const { data, error } = await supabase.functions.invoke("get-vapid-public-key");
      if (error) throw error;
      if (!data?.publicKey) throw new Error("No public key in response");
      vapidKey = data.publicKey;
      updateStep(3, { 
        status: "success", 
        message: "VAPID Key התקבל",
        details: `Key: ${vapidKey.substring(0, 20)}...`
      });
    } catch (error: any) {
      updateStep(3, { status: "error", message: "נכשל בקבלת VAPID Key", details: error.message });
      setIsRunning(false);
      return;
    }

    // Step 5: Push Subscription
    updateStep(4, { status: "running" });
    await new Promise(r => setTimeout(r, 300));
    
    let subscription: PushSubscription | null = null;
    try {
      // Check existing subscription first
      subscription = await (registration as any).pushManager.getSubscription();
      
      if (!subscription && vapidKey) {
        // Create new subscription
        const cleanVapidKey = (key: string) =>
          key
            .trim()
            .replace(/[\r\n\s]/g, "")
            .replace(/^'+|'+$/g, "")
            .replace(/^"+|"+$/g, "");

        const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
          const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
          const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
          const rawData = window.atob(base64);
          const outputArray = new Uint8Array(rawData.length);
          for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
          }
          return outputArray;
        };

        const cleanedKey = cleanVapidKey(vapidKey);
        const applicationServerKeyBytes = urlBase64ToUint8Array(cleanedKey);

        if (applicationServerKeyBytes.length !== 65 || applicationServerKeyBytes[0] !== 4) {
          throw new Error(
            `Invalid VAPID public key (decoded length ${applicationServerKeyBytes.length}). Please regenerate VAPID keys and paste ONLY the publicKey value.`
          );
        }

        const applicationServerKey = new ArrayBuffer(applicationServerKeyBytes.byteLength);
        new Uint8Array(applicationServerKey).set(applicationServerKeyBytes);

        subscription = await (registration as any).pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });
      }

      if (subscription) {
        const subJson = subscription.toJSON();
        updateStep(4, { 
          status: "success", 
          message: "Push Subscription פעיל",
          details: `Endpoint: ${subJson.endpoint?.substring(0, 40)}... | Keys: ${subJson.keys ? "✓" : "✗"}`
        });
      } else {
        throw new Error("No subscription created");
      }
    } catch (error: any) {
      updateStep(4, { status: "error", message: "נכשל ביצירת Push Subscription", details: error.message });
      setIsRunning(false);
      return;
    }

    // Step 6: Save to database
    updateStep(5, { status: "running" });
    await new Promise(r => setTimeout(r, 300));
    
    try {
      const subJson = subscription.toJSON();
      
      const { data, error } = await supabase.from("push_subscriptions").upsert({
        user_id: userId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
      }, {
        onConflict: "user_id",
      }).select();

      if (error) throw error;

      updateStep(5, { 
        status: "success", 
        message: "נשמר בהצלחה בדאטהבייס!",
        details: `Record ID: ${data?.[0]?.id || "saved"}`
      });
    } catch (error: any) {
      updateStep(5, { status: "error", message: "נכשל בשמירה לדאטהבייס", details: error.message });
    }

    setIsRunning(false);
  };

  const getStatusIcon = (status: DiagnosticStep["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-destructive" />;
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-primary" />;
      default:
        return <AlertCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    navigate("/app/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4" dir="rtl">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/app/admin/notifications")}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">אבחון התראות Push</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>בדיקות אבחון</span>
              <Button 
                onClick={runDiagnostics} 
                disabled={isRunning || !userId}
                size="sm"
              >
                {isRunning ? (
                  <Loader2 className="h-4 w-4 animate-spin ml-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 ml-2" />
                )}
                {isRunning ? "בודק..." : "הפעל בדיקות"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border ${
                  step.status === "success" ? "bg-green-500/10 border-green-500/30" :
                  step.status === "error" ? "bg-destructive/10 border-destructive/30" :
                  step.status === "running" ? "bg-primary/10 border-primary/30" :
                  "bg-muted/20 border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(step.status)}
                  <div className="flex-1">
                    <p className="font-medium text-[15px]">{step.name}</p>
                    <p className="text-[13px] text-muted-foreground">{step.message}</p>
                    {step.details && (
                      <p className="text-[12px] text-muted-foreground/70 mt-1 font-mono bg-muted/30 px-2 py-1 rounded">
                        {step.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">מידע נוסף</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-[14px] text-muted-foreground">
            <p>• ודא שהאפליקציה מותקנת כ-PWA (הוספה למסך הבית)</p>
            <p>• ב-iOS Safari יש לוודא שהאפליקציה נפתחת ממסך הבית</p>
            <p>• בדוק שאין חסימת התראות ברמת המערכת</p>
            <p>• נסה לסגור ולפתוח את האפליקציה מחדש</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PushDiagnostics;
