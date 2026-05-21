import { useNavigate } from "react-router-dom";
import { FileText, BookOpen, Sparkles, TrendingUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ActionGrid = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();

  const tiles = [
    {
      label:      isRTL ? "סיכומים שבועיים" : "Weekly Summaries",
      subtitle:   isRTL ? "צפה בסיכום האחרון" : "View last summary",
      icon:       FileText,
      path:       "/app/summary",
      bg:         '#fffbeb',
      border:     '#fde68a',
      iconBg:     '#fef3c7',
      iconColor:  '#d97706',
      titleColor: '#92400e',
      subColor:   '#b45309',
    },
    {
      label:      isRTL ? "היומן שלי" : "My Journal",
      subtitle:   isRTL ? "רשומות יומיומיות" : "Daily entries",
      icon:       BookOpen,
      path:       "/app/journal",
      bg:         '#f0fdf4',
      border:     '#bbf7d0',
      iconBg:     '#d1fae5',
      iconColor:  '#059669',
      titleColor: '#065f46',
      subColor:   '#10b981',
    },
    {
      label:      isRTL ? "כלים טיפוליים" : "Therapy Tools",
      subtitle:   isRTL ? "מדיטציה ונשימות" : "Meditation & breathing",
      icon:       Sparkles,
      path:       "/app/meditation",
      bg:         '#fdf4ff',
      border:     '#e9d5ff',
      iconBg:     '#ede9fe',
      iconColor:  '#7c3aed',
      titleColor: '#5b21b6',
      subColor:   '#7c3aed',
    },
    {
      label:      isRTL ? "מגמות חודשיות" : "Monthly Trends",
      subtitle:   isRTL ? "ניתוח לאורך זמן" : "Long-term analysis",
      icon:       TrendingUp,
      path:       "/app/monthly-summary",
      bg:         '#f0f9ff',
      border:     '#bae6fd',
      iconBg:     '#e0f2fe',
      iconColor:  '#0284c7',
      titleColor: '#0c4a6e',
      subColor:   '#0284c7',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
    }}>
      {tiles.map((tile) => (
        <button
          key={tile.path}
          onClick={() => navigate(tile.path)}
          style={{
            background:    tile.bg,
            border:        `0.5px solid ${tile.border}`,
            borderRadius:  16,
            padding:       '16px 14px',
            display:       'flex',
            flexDirection: 'column',
            cursor:        'pointer',
            textAlign:     'start',
            transition:    'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.opacity = '0.82'}
          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.opacity = '1'}
        >
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: tile.iconBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 10, flexShrink: 0,
          }}>
            <tile.icon size={15} color={tile.iconColor} strokeWidth={2} />
          </div>
          <p style={{ fontSize: 12, fontWeight: 600, color: tile.titleColor, margin: '0 0 3px' }}>
            {tile.label}
          </p>
          <p style={{ fontSize: 10, fontWeight: 500, color: tile.subColor, margin: 0, opacity: 0.85 }}>
            {tile.subtitle}
          </p>
        </button>
      ))}
    </div>
  );
};

export default ActionGrid;
