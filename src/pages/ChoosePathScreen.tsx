import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import nestLogo from "@/assets/nestai-logo-full.png";
import { motion } from "framer-motion";
import { Heart, Stethoscope } from "lucide-react";

const ChoosePathScreen = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/app/dashboard", { replace: true });
      } else {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6">
        <img src={nestLogo} alt="NestAI" className="w-32 h-32 object-contain animate-pulse" />
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-between px-6 py-12" dir="rtl">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="pt-4"
      >
        <img src={nestLogo} alt="NestAI" className="w-36 h-36 object-contain" />
      </motion.div>

      {/* Title */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center space-y-2"
      >
        <h1 className="text-2xl font-semibold text-foreground">ברוכים הבאים ל-Nest AI</h1>
        <p className="text-sm text-muted-foreground">איך נוכל לעזור לך?</p>
      </motion.div>

      {/* Cards */}
      <div className="w-full max-w-md space-y-4 flex-1 flex flex-col justify-center">
        {/* Patient Path */}
        <motion.button
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          onClick={() => navigate("/app/auth?mode=patient")}
          className="w-full rounded-2xl border border-border bg-card p-6 text-right shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-200 group"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 space-y-1">
              <h2 className="text-lg font-semibold text-foreground">אני כאן לתהליך האישי שלי</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                מרחב בטוח לעיבוד מחשבות ורגשות בין הפגישות עם המטפל/ת שלך
              </p>
            </div>
          </div>
        </motion.button>

        {/* Professional Path */}
        <motion.button
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          onClick={() => navigate("/app/professional/intro")}
          className="w-full rounded-2xl border border-border bg-card p-6 text-right shadow-sm hover:shadow-md hover:border-secondary/40 transition-all duration-200 group"
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center group-hover:bg-secondary/20 transition-colors">
              <Stethoscope className="w-6 h-6 text-secondary" />
            </div>
            <div className="flex-1 space-y-1">
              <h2 className="text-lg font-semibold text-foreground">אני מטפל/ת — רוצה לחקור את הכלי</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                צפו בדמו אינטראקטיבי וגלו כיצד Nest AI מחזק את התהליך הטיפולי
              </p>
            </div>
          </div>
        </motion.button>
      </div>

      {/* Footer */}
      <div className="text-xs text-foreground/40 mt-6">
        © {new Date().getFullYear()} Nest AI. כל הזכויות שמורות.
      </div>
    </div>
  );
};

export default ChoosePathScreen;
