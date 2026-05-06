import { useLanguage } from "@/contexts/LanguageContext";
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
      <p style={{
        fontSize: 9, fontWeight: 600, color: '#cbd5e1',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14,
      }}>
        {isRTL ? "מגמות אחרונות" : "RECENT TRENDS"}
      </p>
      <button
        onClick={() => navigate("/app/patterns")}
        style={{
          width: '100%', background: '#f0f9ff', border: '0.5px solid #bae6fd',
          borderRadius: 14, padding: '16px 18px',
          textAlign: 'start', cursor: 'pointer', display: 'block',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#e0f2fe'}
        onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#f0f9ff'}
      >
        {/* Pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#dbeafe', borderRadius: 20, padding: '3px 10px', marginBottom: 12,
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
          <span style={{ fontSize: 9, fontWeight: 500, color: '#1d4ed8' }}>
            {isRTL ? "תובנה שבועית" : "Weekly insight"}
          </span>
        </div>

        {/* Body */}
        <p style={{ fontSize: 12, color: '#0c4a6e', lineHeight: 1.65, margin: '0 0 14px' }}>
          {narrativeInsight || (isRTL ? "רמות הלחץ שלך ירדו ב-15% השבוע 🎉" : "Your stress levels decreased by 15% this week 🎉")}
        </p>

        {/* Link */}
        <span style={{ fontSize: 11, fontWeight: 500, color: '#3b82f6' }}>
          {isRTL ? "צפה בתובנות המלאות ←" : "View full insights →"}
        </span>
      </button>
    </motion.div>
  );
};

export default InsightsSection;
