import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

interface InsightsSectionProps {
  narrativeInsight?: string | null;
}

const InsightsSection = ({ narrativeInsight }: InsightsSectionProps) => {
  const { isRTL } = useLanguage();
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
    >
      <p style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
        {isRTL ? "מגמות אחרונות" : "RECENT TRENDS"}
      </p>
      <button
        onClick={() => navigate("/app/patterns")}
        style={{ width: '100%', background: '#f0f9ff', border: '0.5px solid #bae6fd', borderRadius: 12, padding: 16, textAlign: 'start', cursor: 'pointer', display: 'block', transition: 'background 0.15s' }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#e0f2fe'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#f0f9ff'}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dbeafe', borderRadius: 20, padding: '3px 10px', marginBottom: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 500, color: '#1d4ed8' }}>{isRTL ? "תובנה שבועית" : "Weekly insight"}</span>
        </div>
        <p style={{ fontSize: 12, color: '#0c4a6e', lineHeight: 1.6, margin: '0 0 12px' }}>
          {narrativeInsight || (isRTL ? "רמות הלחץ שלך ירדו ב-15% השבוע 🎉" : "Your stress levels decreased by 15% this week 🎉")}
        </p>
        <span style={{ fontSize: 12, color: '#3b82f6', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {isRTL ? "צפה בתובנות המלאות ←" : "View full insights →"}
        </span>
      </button>
    </motion.div>
  );
};

export default InsightsSection;
