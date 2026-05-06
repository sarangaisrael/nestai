import { useNavigate } from "react-router-dom";
import { FileText, BookOpen, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ActionGrid = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const tiles = [
    {
      label:    isRTL ? "סיכומים שבועיים" : "Weekly Summaries",
      subtitle: isRTL ? "צפה בסיכום האחרון" : "View last summary",
      icon: FileText,
      path: "/app/summary",
      bg:         '#eff6ff',
      border:     '#bfdbfe',
      iconBg:     '#dbeafe',
      iconColor:  '#1d4ed8',
      titleColor: '#1e40af',
      subColor:   '#3b82f6',
    },
    {
      label:    isRTL ? "היומן שלי" : "My Journal",
      subtitle: isRTL ? "רשומות יומיומיות" : "Daily entries",
      icon: BookOpen,
      path: "/app/journal",
      bg:         '#fdf4ff',
      border:     '#e9d5ff',
      iconBg:     '#ede9fe',
      iconColor:  '#6d28d9',
      titleColor: '#5b21b6',
      subColor:   '#7c3aed',
    },
    {
      label:    isRTL ? "מגמות חודשיות" : "Monthly Trends",
      subtitle: isRTL ? "ניתוח לאורך זמן" : "Long-term analysis",
      icon: TrendingUp,
      path: "/app/monthly-summary",
      bg:         '#f0fdf4',
      border:     '#bbf7d0',
      iconBg:     '#d1fae5',
      iconColor:  '#065f46',
      titleColor: '#065f46',
      subColor:   '#10b981',
    },
  ];

  return (
    <div>
      <p style={{
        fontSize: 9, fontWeight: 600, color: '#cbd5e1',
        letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14,
      }}>
        {isRTL ? "סקירה מהירה" : "QUICK OVERVIEW"}
      </p>

      {/* dash-overview-grid class drives 2-col mobile / 3-col desktop via RESPONSIVE css in Dashboard */}
      <div className="dash-overview-grid">
        {tiles.map((tile) => (
          <button
            key={tile.path}
            onClick={() => navigate(tile.path)}
            style={{
              background: tile.bg,
              border: `0.5px solid ${tile.border}`,
              borderRadius: 16, padding: 18,
              display: 'flex', flexDirection: 'column',
              cursor: 'pointer', textAlign: 'start',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.85'}
            onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: tile.iconBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 12, flexShrink: 0,
            }}>
              <tile.icon size={15} color={tile.iconColor} strokeWidth={2} />
            </div>
            <p style={{ fontSize: 12, fontWeight: 600, color: tile.titleColor, margin: '0 0 4px' }}>
              {tile.label}
            </p>
            <p style={{ fontSize: 10, fontWeight: 500, color: tile.subColor, margin: 0 }}>
              {tile.subtitle}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ActionGrid;
