import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getDefaultRouteForUser } from "@/lib/userRoles";

const RootRedirect = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if this is a recovery/password reset redirect
    const hash = window.location.hash;
    if (hash) {
      const hashParams = new URLSearchParams(hash.substring(1));
      const type = hashParams.get("type");
      if (type === "recovery") {
        // Forward the entire hash to the auth page for password reset
        navigate(`/app/auth${hash}`, { replace: true });
        setChecking(false);
        return;
      }
    }

    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const target = await getDefaultRouteForUser(session.user.id);
        navigate(target, { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
      setChecking(false);
    };
    check();
  }, [navigate]);

  if (!checking) return null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default RootRedirect;
