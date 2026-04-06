import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ShieldAlert } from "lucide-react";

const ADMIN_SESSION_KEY = "__admin_unlocked__";

interface AdminGateProps {
  children: React.ReactNode;
}

const AdminGate = ({ children }: AdminGateProps) => {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useAdminStatus();
  const [session, setSession] = useState<any>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  // Check auth session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        setUnlocked(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Check sessionStorage for existing unlock
  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "true") {
      setUnlocked(true);
    }
  }, []);

  const handleVerify = useCallback(async () => {
    if (!password.trim()) return;
    setVerifying(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke("verify-admin-password", {
        body: { password: password.trim() },
      });

      if (fnError || !data?.success) {
        setError("סיסמה שגויה");
        setPassword("");
      } else {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
        setUnlocked(true);
      }
    } catch {
      setError("שגיאה באימות");
    } finally {
      setVerifying(false);
    }
  }, [password]);

  // Loading state
  if (sessionLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Not logged in → redirect to dedicated admin login
  if (!session) {
    navigate("/app/admin/login", { replace: true });
    return null;
  }

  // Logged in but not admin → redirect to home
  if (!isAdmin) {
    navigate("/", { replace: true });
    return null;
  }

  // Admin but not yet unlocked → show password challenge
  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">גישת מנהל מוגנת</h2>
            <p className="text-sm text-muted-foreground mt-1">הזן את סיסמת הגישה כדי להמשיך</p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerify();
            }}
            className="space-y-4"
          >
            <Input
              type="password"
              placeholder="סיסמת גישה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              className="text-center"
            />
            {error && (
              <div className="flex items-center justify-center gap-1.5 text-destructive text-sm">
                <ShieldAlert className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={verifying || !password.trim()}>
              {verifying ? "מאמת..." : "אימות"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGate;
