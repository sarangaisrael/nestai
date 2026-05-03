import { useNavigate } from "react-router-dom";
import { BookOpen, FileText, TrendingUp, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ActionGrid = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const tiles = [
    {
      label: isRTL ? "היומן שלי" : "My Journal",
      subtitle: isRTL ? "רשומות יומיומיות" : "Daily entries",
      icon: BookOpen,
      path: "/app/journal",
    },
    {
      label: isRTL ? "סיכומים שבועיים" : "Weekly Summaries",
      subtitle: isRTL ? "צפה בסיכום האחרון" : "View last summary",
      icon: FileText,
      path: "/app/summary",
    },
    {
      label: isRTL ? "מגמות חודשיות" : "Monthly Trends",
      subtitle: isRTL ? "ניתוח לאורך זמן" : "Long-term analysis",
      icon: TrendingUp,
      path: "/app/monthly-summary",
    },
    {
      label: isRTL ? "כלים טיפוליים" : "Therapeutic Tools",
      subtitle: isRTL ? "תרגילים ומדיטציה" : "Exercises & meditation",
      icon: Sparkles,
      path: "/app/meditation",
    },
  ];

  return (
    <div>
      <p style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
        {isRTL ? "סקירה מהירה" : "QUICK OVERVIEW"}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {tiles.map((tile) => (
          <button
            key={tile.path}
            onClick={() => navigate(tile.path)}
            style={{ background: '#f8fafc', border: '0.5px solid #e2e8f0', borderRadius: 12, padding: '14px 12px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, cursor: 'pointer', textAlign: 'start', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.background = '#f1f5f9'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc'}
          >
            <div style={{ width: 34, height: 34, borderRadius: 9, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <tile.icon size={16} color="#1d4ed8" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: 0, marginBottom: 2 }}>{tile.label}</p>
              <p style={{ fontSize: 10, color: '#94a3b8', margin: 0 }}>{tile.subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActionGrid;
