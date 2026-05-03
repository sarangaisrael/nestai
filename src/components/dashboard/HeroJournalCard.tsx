import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const HeroJournalCard = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      style={{ background: '#1e3a5f', borderRadius: 14, padding: 24 }}
    >
      <p style={{ fontSize: 11, fontWeight: 500, color: '#93c5fd', letterSpacing: '0.05em', marginBottom: 8, textTransform: 'uppercase' }}>
        {isRTL ? "רגע של הקשבה" : "A moment of listening"}
      </p>
      <p style={{ fontSize: 15, fontWeight: 500, color: '#ffffff', marginBottom: 16, lineHeight: 1.5 }}>
        {isRTL ? "איך את/ה מרגיש/ה עכשיו?" : "How are you feeling right now?"}
      </p>
      <div
        onClick={() => navigate("/app/chat")}
        style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>
          {isRTL ? "כתוב משהו..." : "Write something..."}
        </span>
      </div>
    </motion.div>
  );
};

export default HeroJournalCard;
