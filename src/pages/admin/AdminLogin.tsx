import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Lock } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });

      if (authError) {
        setError("אימייל או סיסמה שגויים");
        return;
      }

      // After login, navigate to admin — AdminGate will handle role check + password challenge
      navigate("/app/admin", { replace: true });
    } catch {
      setError("שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">התחברות מנהל</h1>
          <p className="text-sm text-muted-foreground mt-1">גישה מוגבלת למנהלים בלבד</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 text-right">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">אימייל</label>
            <Input
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">סיסמה</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="flex items-center justify-center gap-1.5 text-destructive text-sm">
              <ShieldAlert className="h-4 w-4" />
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading || !email.trim() || !password.trim()}>
            {loading ? "מתחבר..." : "התחבר"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
