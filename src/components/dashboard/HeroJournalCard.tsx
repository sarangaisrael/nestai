import { useNavigate } from "react-router-dom";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const HeroJournalCard = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-3xl p-6 shadow-elevated"
      style={{
        background: "linear-gradient(135deg, hsl(210 50% 22%), hsl(220 45% 30%))",
      }}
    >
      <p className="text-sm font-medium text-white/70 mb-1">
        {isRTL ? "רגע של הקשבה" : "A moment of listening"}
      </p>
      <h2 className="text-lg font-semibold text-white mb-4">
        {isRTL ? "איך את/ה מרגיש/ה עכשיו?" : "How are you feeling right now?"}
      </h2>
      <Button
        onClick={() => navigate("/app/chat")}
        size="lg"
        className="w-full h-12 text-base font-semibold rounded-2xl bg-white text-foreground hover:bg-white/90 shadow-md"
      >
        <PenLine className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
        {isRTL ? "התחל לכתוב" : "Start Writing"}
      </Button>
    </motion.div>
  );
};

export default HeroJournalCard;
