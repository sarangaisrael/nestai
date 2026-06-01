import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";

const HeroJournalCard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      style={{
        background: '#3730a3',
        borderRadius: 16,
        padding: '18px 24px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Heebo', sans-serif",
      }}
    >
      {/* Radial glow — lighter indigo, top-right */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(165,180,252,0.2) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Radial glow — deep, bottom-left */}
      <div style={{
        position: 'absolute', bottom: -50, left: -30,
        width: 160, height: 160, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(30,27,75,0.4) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Pill tag */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 50, padding: '3px 10px', marginBottom: 14,
        position: 'relative',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#a5b4fc', flexShrink: 0 }} />
        <span style={{
          fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          {t.dashboard.writeLabel}
        </span>
      </div>

      {/* Question */}
      <p style={{
        fontSize: 17, fontWeight: 800, color: '#ffffff',
        marginBottom: 18, lineHeight: 1.45, letterSpacing: '-0.3px',
        position: 'relative',
      }}>
        {t.dashboard.writeQuestion}
      </p>

      {/* Input row */}
      <div
        onClick={() => navigate("/app/chat")}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          position: 'relative', cursor: 'pointer',
        }}
      >
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 12, padding: '11px 14px',
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
            {t.dashboard.writePlaceholder}
          </span>
        </div>
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: '#1e1b4b',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 14V4M9 4L4.5 8.5M9 4L13.5 8.5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroJournalCard;
