import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const HeroJournalCard = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
      style={{ background: '#1e3a5f', borderRadius: 18, padding: '22px 24px' }}
    >
      <p style={{
        fontSize: 9, fontWeight: 500, color: '#93c5fd',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10,
      }}>
        {isRTL ? "רגע של הקשבה" : "A moment of listening"}
      </p>
      <p style={{ fontSize: 16, fontWeight: 500, color: '#ffffff', marginBottom: 18, lineHeight: 1.5 }}>
        {isRTL ? "איך את/ה מרגיש/ה עכשיו?" : "How are you feeling right now?"}
      </p>
      <div
        onClick={() => navigate("/app/chat")}
        style={{
          background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: 10, padding: '12px 16px', cursor: 'pointer',
          display: 'flex', alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>
          {isRTL ? "כתוב משהו..." : "Write something..."}
        </span>
      </div>
    </motion.div>
  );
};

export default HeroJournalCard;
