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
        background: '#0f172a',
        borderRadius: 20,
        padding: '22px 20px 20px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "'Heebo', sans-serif",
      }}
    >
      {/* Radial glow — indigo, top-right */}
      <div style={{
        position: 'absolute', top: -40, right: -40,
        width: 180, height: 180, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      {/* Radial glow — blue, bottom-left */}
      <div style={{
        position: 'absolute', bottom: -50, left: -30,
        width: 160, height: 160, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Pill tag */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.35)',
        borderRadius: 50, padding: '3px 10px', marginBottom: 14,
        position: 'relative',
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
        <span style={{
          fontSize: 9, fontWeight: 700, color: '#a5b4fc',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {t.dashboard.writeLabel}
        </span>
      </div>

      {/* Question */}
      <p style={{
        fontSize: 18, fontWeight: 800, color: '#ffffff',
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
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 12, padding: '11px 14px',
        }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.38)', fontWeight: 400 }}>
            {t.dashboard.writePlaceholder}
          </span>
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 12, flexShrink: 0,
          background: '#6366f1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 13V3M8 3L3.5 7.5M8 3L12.5 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </motion.div>
  );
};

export default HeroJournalCard;
